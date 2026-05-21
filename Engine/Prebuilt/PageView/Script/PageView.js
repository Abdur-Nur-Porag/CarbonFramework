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
   CARBON ROUTER (GHOST VIEW & ANIMATION FIXED)
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
  
  // Fallback parser for time formats
  _parseTime: function(timeStr) {
    if (!timeStr) return '0ms';
    return typeof timeStr === 'number' ? `${timeStr}ms` : timeStr;
  },
  
  // Calculate fallback timeout to prevent animation hangs
  _getMs: function(timeStr) {
    if (!timeStr) return 0;
    const isSec = timeStr.includes('s') && !timeStr.includes('ms');
    return parseFloat(timeStr) * (isSec ? 1000 : 1) + 50;
  },
  
  PageView: function(config) {
    const isInitial = !!config.Initial;
    this.pages[config.Name] = { ...config, Initial: isInitial };
    
    if (isInitial) {
      const initPage = () => OpenPageView({ Target: config.Name });
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initPage);
      } else {
        setTimeout(initPage, 0);
      }
    }
  },
  
  navigate: async function(config, mode = 'open') {
    // Backwards compatibility for string inputs
    if (typeof config === 'string') {
      config = { Target: config };
    }
    
    const { Target, Delay = 0, AnimationName, AnimationTime = '300ms' } = config;
    
    if (this.isTransitioning) {
      console.warn(`Carbon: Transition locked. Ignored action for "${Target}".`);
      return;
    }
    if (this.currentPage === Target) return;
    
    const newPage = this.pages[Target];
    const targetEl = document.querySelector(`PageView[Name="${Target}"], pageview[Name="${Target}"]`);
    const currentEl = this.currentPage ? document.querySelector(`PageView[Name="${this.currentPage}"], pageview[Name="${this.currentPage}"]`) : null;
    
    if (!newPage || !targetEl) {
      console.warn(`Carbon: Page "${Target}" not found.`);
      return;
    }
    
    this.isTransitioning = true;
    
    try {
      // 1. DELAY EXECUTION
      if (Delay > 0) {
        await new Promise(res => setTimeout(res, Delay));
      }
      
      // 2. PREPARE NEW PAGE
      this._resetPageDOM(targetEl);
      if (newPage.OnStart) await newPage.OnStart();
      
      const animDuration = this._parseTime(AnimationTime);
      const hasAnim = !!AnimationName;
      
      // 3. ANIMATION LOGIC
      if (mode === 'open') {
        // Opening: New page overlays current page and animates
        if (currentEl) currentEl.style.zIndex = '1';
        targetEl.style.zIndex = '10';
        targetEl.setAttribute('active', 'true');
        
        if (hasAnim) {
          targetEl.style.animation = `${AnimationName} ${animDuration} ease forwards`;
          await new Promise(resolve => {
            targetEl.addEventListener('animationend', resolve, { once: true });
            setTimeout(resolve, this._getMs(animDuration));
          });
        }
      } else if (mode === 'close') {
        // Closing: Current page animates out, revealing target page behind it
        targetEl.style.zIndex = '1';
        targetEl.setAttribute('active', 'true');
        
        if (currentEl) {
          currentEl.style.zIndex = '10';
          if (hasAnim) {
            currentEl.style.animation = `${AnimationName} ${animDuration} ease forwards`;
            await new Promise(resolve => {
              currentEl.addEventListener('animationend', resolve, { once: true });
              setTimeout(resolve, this._getMs(animDuration));
            });
          }
        }
      }
      
      // 4. GHOST VIEW CLEANUP (Force wipe states to prevent stuck views)
      document.querySelectorAll('PageView, pageview').forEach(el => {
        el.style.animation = ''; // Clear animations
        el.style.zIndex = ''; // Clear inline z-indexes
        if (el !== targetEl) {
          el.removeAttribute('active'); // Hide non-targets
        }
      });
      
      // 5. LIFECYCLE SCRIPTS
      if (this.currentPage && this.pages[this.currentPage]?.OnFinished) {
        await this.pages[this.currentPage].OnFinished();
      }
      
      this.currentPage = Target;
      
      if (newPage.OnScript) {
        setTimeout(async () => { await newPage.OnScript(); }, 0);
      }
      
    } catch (error) {
      console.error("Carbon Router Error:", error);
    } finally {
      this.isTransitioning = false;
    }
  }
};

// Global API
const OpenPageView = (config) => Carbon.navigate(config, 'open');
const ClosePageView = (config) => Carbon.navigate(config, 'close');