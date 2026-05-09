  const UIStyleFixer = {
    _sheet: null,
    _registeredIds: new Set(), // Keeps track of IDs so we don't inject duplicates
    
    _init: function() {
      if (this._sheet) return; // Already initialized
      
      // Create a dedicated style tag for the framework
      const styleEl = document.createElement("style");
      styleEl.id = "lithium-dynamic-styles";
      document.head.appendChild(styleEl);
      this._sheet = styleEl.sheet;
      
      // ==========================================
      // SOLVE OTHER COMMON WEBVIEW PROBLEMS GLOBALLY
      // ==========================================
      // 1. Remove blue tap highlight on mobile
      this._insertRule("* { -webkit-tap-highlight-color: transparent; }");
      // 2. Fix dialog outlines globally just in case
      this._insertRule("dialog:focus, dialog:focus-visible { outline: none !important; }");
      // 3. Prevent text selection while swiping (smooths out gestures)
      this._insertRule(".gesture-active { user-select: none; -webkit-user-select: none; }");
    },
    
    _insertRule: function(ruleText) {
      try {
        this._sheet.insertRule(ruleText, this._sheet.cssRules.length);
      } catch (e) {
        console.warn("Lithium Engine: CSS Rule rejected by browser ->", ruleText);
      }
    },
    
    // --- THE DYNAMIC ID FIXER ---
    removeOutlineForId: function(id) {
      if (!id) return;
      this._init();
      
      // Clean the ID (removes '#' if accidentally passed)
      const cleanId = id.replace(/^#/, '');
      
      // If we already fixed this ID, skip it (saves memory & CPU)
      if (this._registeredIds.has(cleanId)) return;
      
      // Inject the specific rule for this dynamic ID
      const rule = `#${cleanId}:focus, #${cleanId}:focus-visible { outline: none !important; }`;
      this._insertRule(rule);
      
      // Mark as processed
      this._registeredIds.add(cleanId);
    }
  };
  const GestureManager = {
    _createGesture: function(direction, config) {
      const state = {
        active: false,
        startX: 0,
        startY: 0,
        startedInZone: false
      };
      
      const edgeLimit = parseInt(config.EdgeSize) || 40;
      const threshold = 60;
      
      // --- NEW: AUTOMATICALLY FIX CSS FOR THIS ID ---
      if (config.Content) {
        UIStyleFixer.removeOutlineForId(config.Content);
      }
      // ----------------------------------------------
      
      window.addEventListener('touchstart', (e) => {
        // Click outside to close logic
        if (state.active && config.Content) {
          const elementId = config.Content.replace(/^#/, '');
          const contentElement = document.getElementById(elementId);
          
          if (contentElement && !contentElement.contains(e.target)) {
            state.active = false;
            state.startedInZone = false;
            // Remove anti-selection class
            document.body.classList.remove('gesture-active');
            if (typeof config.OnClose === 'function') config.OnClose();
            return;
          }
        }
        
        state.startX = e.touches[0].clientX;
        state.startY = e.touches[0].clientY;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        
        if (!state.active) {
          if (direction === 'top' && state.startY <= edgeLimit) state.startedInZone = true;
          else if (direction === 'bottom' && state.startY >= screenH - edgeLimit) state.startedInZone = true;
          else if (direction === 'left' && state.startX <= edgeLimit) state.startedInZone = true;
          else if (direction === 'right' && state.startX >= screenW - edgeLimit) state.startedInZone = true;
          else state.startedInZone = false;
        } else {
          state.startedInZone = true;
        }
        
        // Apply anti-selection class while gesture might be starting
        if (state.startedInZone) {
          document.body.classList.add('gesture-active');
        }
        
      }, { passive: false });
      
      window.addEventListener('touchmove', (e) => {
        if (state.startedInZone) {
          e.preventDefault();
        }
      }, { passive: false });
      
      const handleEnd = (e) => {
        // Clean up anti-selection class
        document.body.classList.remove('gesture-active');
        
        if (!state.startedInZone) return;
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - state.startX;
        const diffY = endY - state.startY;
        
        let shouldOpen = false;
        let shouldClose = false;
        
        if (direction === 'top') {
          shouldOpen = diffY > threshold;
          shouldClose = diffY < -threshold;
        } else if (direction === 'bottom') {
          shouldOpen = diffY < -threshold;
          shouldClose = diffY > threshold;
        } else if (direction === 'left') {
          shouldOpen = diffX > threshold;
          shouldClose = diffX < -threshold;
        } else if (direction === 'right') {
          shouldOpen = diffX < -threshold;
          shouldClose = diffX > threshold;
        }
        
        if (!state.active && shouldOpen) {
          state.active = true;
          if (typeof config.OnOpen === 'function') config.OnOpen();
        }
        else if (state.active && shouldClose) {
          state.active = false;
          if (typeof config.OnClose === 'function') config.OnClose();
        }
        
        state.startedInZone = false;
      };
      
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('touchcancel', () => {
        state.startedInZone = false;
        document.body.classList.remove('gesture-active');
      });
    },
    // --- PUBLIC API ---
    grastureTop: function(config) { this._createGesture('top', config); },
    grastureBottom: function(config) { this._createGesture('bottom', config); },
    grastureLeft: function(config) { this._createGesture('left', config); },
    grastureRight: function(config) { this._createGesture('right', config); }
    
  };