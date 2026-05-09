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
   CARBON ROUTER (FIXED)
========================================================= */

const Carbon = {
  pages: {},
  currentPage: null,
  isTransitioning: false, // Prevents race conditions
  
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
    this.pages[config.Name] = { ...config, Initial: isInitial };
    
    if (isInitial) {
      const initPage = () => this.openPageView(config.Name);
      
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initPage);
      } else {
        // Ensures all scripts parse before triggering the first view
        setTimeout(initPage, 0);
      }
    }
  },
  
  openPageView: async function(pageName) {
    // 0. RACE CONDITION GUARD
    if (this.isTransitioning) {
      console.warn(`Carbon: Transition in progress. Suppressing load for "${pageName}".`);
      return;
    }
    if (this.currentPage === pageName) return; // Ignore if already on this page
    
    const newPage = this.pages[pageName];
    const targetEl = document.querySelector(`PageView[Name="${pageName}"], pageview[Name="${pageName}"]`);
    
    if (!newPage || !targetEl) {
      console.warn(`Carbon: Page "${pageName}" not found.`);
      return;
    }
    
    this.isTransitioning = true; // Lock state
    
    try {
      // 1. EXIT LOGIC & GHOST VIEW CLEANUP
      if (this.currentPage) {
        const oldPage = this.pages[this.currentPage];
        
        // Force-hide ALL pages just in case DOM got out of sync
        document.querySelectorAll('PageView, pageview').forEach(el => {
          if (el !== targetEl) el.removeAttribute('active');
        });
        
        if (oldPage && oldPage.OnFinished) {
          await oldPage.OnFinished(); // Await in case it contains async cleanup tasks
        }
      }
      
      // 2. PREPARE NEW PAGE
      this._resetPageDOM(targetEl);
      this.currentPage = pageName;
      
      // 3. START LOGIC (Before UI shows)
      if (newPage.OnStart) {
        await newPage.OnStart();
      }
      
      // 4. SHOW UI
      // requestAnimationFrame ensures the DOM has fully processed resets before displaying
      requestAnimationFrame(() => {
        targetEl.setAttribute('active', 'true');
        
        // 5. SCRIPT LOGIC (After UI shows)
        // Give the UI one macro-tick to paint so heavy scripts don't freeze the appearance
        setTimeout(async () => {
          if (newPage.OnScript) {
            await newPage.OnScript();
          }
          this.isTransitioning = false; // Release lock
        }, 0);
      });
      
    } catch (error) {
      console.error("Carbon Router Error:", error);
      this.isTransitioning = false; // Always release lock on error to prevent freezing app
    }
  }
};

const openPageView = (name) => Carbon.openPageView(name);