/* =========================================================
   LAYOUT FRAMEWORK
========================================================= */

class LayoutFramework {
  static instances = [];
  
  constructor(root) {
    this.root = root;
    this.body = root.querySelector("AppBody");
    this.scrollTimer = null;
    
    this.init();
    LayoutFramework.instances.push(this);
  }
  
  init() {
    this.applyDefaults();
    this.initScrollbar();
    this.observe();
    this.emitReady();
  }
  
  applyDefaults() {
    if (!this.body) return;
    if (!this.body.hasAttribute("type")) {
      this.body.setAttribute("type", "vscroll");
    }
    if (!this.body.hasAttribute("scrollbar")) {
      this.body.setAttribute("scrollbar", "true");
    }
  }
  
  initScrollbar() {
    if (!this.body) return;
    if (this.body.getAttribute("scrollbar") === "false") return;
    
    this.body.addEventListener("scroll", () => {
      this.body.classList.add("scrolling");
      clearTimeout(this.scrollTimer);
      
      this.scrollTimer = setTimeout(() => {
        this.body.classList.remove("scrolling");
      }, 1200);
    }, { passive: true });
  }
  
  observe() {
    this.observer = new MutationObserver(() => {
      this.update();
    });
    
    this.observer.observe(this.root, {
      childList: true,
      subtree: true,
      attributes: true
    });
  }
  
  update() {}
  
  scrollToTop(smooth = true) {
    this.body?.scrollTo({
      top: 0,
      behavior: smooth ? "smooth" : "auto"
    });
  }
  
  scrollToLeft(smooth = true) {
    this.body?.scrollTo({
      left: 0,
      behavior: smooth ? "smooth" : "auto"
    });
  }
  
  destroy() {
    this.observer?.disconnect();
  }
  
  emitReady() {
    this.root.dispatchEvent(
      new CustomEvent("layout-ready", { detail: this })
    );
  }
}

document.querySelectorAll("App").forEach(app => {
  app.__layout = new LayoutFramework(app);
});
window.LayoutFramework = LayoutFramework;


/* =========================================================
   CARBON ROUTER (WITH ANIMATION TIME & BACKDROP OVERLAY)
========================================================= */

const Carbon = {
  pages: {},
  currentPage: null,
  isTransitioning: false, 
  
  _resetPageDOM: function(element) {
    if (!element) return;
    element.querySelectorAll('input, textarea, select').forEach(field => {
      if (field.type === 'checkbox' || field.type === 'radio') {
        field.checked = field.defaultChecked || false;
      } else {
        field.value = field.defaultValue || '';
      }
    });
  },

  PageView: function(config) {
    const isInitial = !!config.Initial;
    Carbon.pages[config.Name] = { ...config, Initial: isInitial };
    
    if (isInitial) {
      const initPage = () => Carbon.openPageView({ page: config.Name });
      
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initPage);
      } else {
        setTimeout(initPage, 0);
      }
    }
  },
  
  openPageView: async function(options) {
    let pageName, delay, animation, backdrop, animationTime;
    
    if (typeof options === 'string') {
      pageName = options;
      delay = 0;
    } else if (options && typeof options === 'object') {
      pageName = options.page;
      delay = options.delay !== undefined ? Number(options.delay) : 0;
      animation = options.animation; 
      backdrop = options.backdrop;
      animationTime = options.animationTime; // e.g., 500 or "0.5s"
    }

    if (this.isTransitioning) {
      console.warn(`Carbon: Transition in progress. Suppressing load for "${pageName}".`);
      return;
    }
    if (this.currentPage === pageName) return; 
    
    const newPage = this.pages[pageName];
    const targetEl = document.querySelector(`PageView[Name="${pageName}"], pageview[Name="${pageName}"]`);
    
    if (!newPage || !targetEl) {
      console.warn(`Carbon: Page "${pageName}" not found.`);
      return;
    }
    
    this.isTransitioning = true; 
    
    // Format custom animation time to a valid CSS duration string
    const parsedTime = animationTime ? (typeof animationTime === 'number' ? `${animationTime}ms` : animationTime) : null;

    try {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const oldPageName = this.currentPage;
      const oldEl = oldPageName ? document.querySelector(`PageView[Name="${oldPageName}"], pageview[Name="${oldPageName}"]`) : null;

      const currentExitAni = animation || (oldEl ? oldEl.getAttribute('closeAni') : null);
      const targetOpenAni = targetEl.getAttribute('openAni');

      // 1. MANAGE GLOBAL BACKDROP
      this._manageBackdrop(backdrop, parsedTime);

      // 2. EXIT LOGIC FOR CURRENT PAGE
      if (oldPageName) {
        const oldPage = this.pages[oldPageName];
        
        if (oldEl && currentExitAni) {
          if (parsedTime) oldEl.style.animationDuration = parsedTime;
          oldEl.className = `carbon-ani-${currentExitAni}`;
          
          oldEl.addEventListener('animationend', function handler() {
            oldEl.removeAttribute('active');
            oldEl.className = '';
            oldEl.style.animationDuration = ''; // Cleanup inline styles
            oldEl.removeEventListener('animationend', handler);
          });
        } else if (oldEl) {
          oldEl.removeAttribute('active');
        }

        // Hide any ghost DOM nodes dynamically
        document.querySelectorAll('PageView, pageview').forEach(el => {
          if (el !== targetEl && el !== oldEl) {
            el.removeAttribute('active');
            el.className = '';
          }
        });
        
        if (oldPage && oldPage.OnFinished) {
          await oldPage.OnFinished(); 
        }
      }

      // 3. PREPARE NEW PAGE
      this._resetPageDOM(targetEl);
      this.currentPage = pageName;
      
      if (newPage.OnStart) {
        await newPage.OnStart();
      }
      
      // 4. SHOW TARGET UI
      requestAnimationFrame(() => {
        targetEl.setAttribute('active', 'true');
        
        if (targetOpenAni) {
          if (parsedTime) targetEl.style.animationDuration = parsedTime;
          targetEl.className = `carbon-ani-${targetOpenAni}`;
          
          targetEl.addEventListener('animationend', function handler() {
            targetEl.className = ''; 
            targetEl.style.animationDuration = ''; // Cleanup inline styles
            targetEl.removeEventListener('animationend', handler);
          });
        }

        setTimeout(async () => {
          if (newPage.OnScript) {
            await newPage.OnScript();
          }
          this.isTransitioning = false; 
        }, 0);
      });
      
    } catch (error) {
      console.error("Carbon Router Error:", error);
      this.isTransitioning = false; 
    }
  },

  _manageBackdrop: function(backdropValue, customDuration) {
    let backdropEl = document.getElementById('carbon-global-backdrop');
    
    // Determine duration to match user overrides or fallback to CSS default (0.3s)
    const durationStyle = customDuration ? customDuration : ''; 

    // Scenario A: The incoming page requests a backdrop
    if (backdropValue) {
      if (!backdropEl) {
        backdropEl = document.createElement('div');
        backdropEl.id = 'carbon-global-backdrop';
        backdropEl.className = 'carbon-backdrop-layer';
        document.body.appendChild(backdropEl);
      }
      
      // Apply user's custom backdrop color/style if valid, else default to dark tint
      backdropEl.style.background = typeof backdropValue === 'string' ? backdropValue : 'rgba(0,0,0,0.5)';
      backdropEl.style.animationDuration = durationStyle;
      
      // Reset classes to trigger entry animation
      backdropEl.classList.remove('carbon-backdrop-out');
      // Trigger reflow to restart animation reliably
      void backdropEl.offsetWidth; 
      backdropEl.classList.add('carbon-backdrop-in');
    } 
    // Scenario B: The incoming page doesn't want a backdrop, but one is currently visible
    else if (backdropEl && !backdropValue) {
      backdropEl.style.animationDuration = durationStyle;
      backdropEl.classList.remove('carbon-backdrop-in');
      backdropEl.classList.add('carbon-backdrop-out');
      
      // Remove it from DOM completely once faded out
      backdropEl.addEventListener('animationend', function handler() {
        backdropEl.remove();
        backdropEl.removeEventListener('animationend', handler);
      });
    }
  }
};

// Global Extensions
Carbon.PageView.Animation = function(animationsObject) {
  let styleEl = document.getElementById('carbon-custom-animations');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'carbon-custom-animations';
    document.head.appendChild(styleEl);
  }
  
  let cssBuffer = '';
  for (const [animationName, cssRules] of Object.entries(animationsObject)) {
    cssBuffer += `\n.carbon-ani-${animationName} { ${cssRules} }\n`;
  }
  styleEl.appendChild(document.createTextNode(cssBuffer));
};

const openPageView = (options) => Carbon.openPageView(options);
const PageView = Carbon.PageView;

window.Carbon = Carbon;
window.PageView = PageView;
window.openPageView = openPageView;