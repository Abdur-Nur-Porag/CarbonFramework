const UIStyleFixer = {
  _sheet: null,
  _registeredIds: new Set(),

  _init: function () {
    if (this._sheet) return;

    const styleEl = document.createElement("style");
    styleEl.id = "lithium-dynamic-styles";
    document.head.appendChild(styleEl);
    this._sheet = styleEl.sheet;

    // 1. Remove blue tap highlight on mobile
    this._insertRule("* { -webkit-tap-highlight-color: transparent; }");
    // 2. Fix dialog outlines globally
    this._insertRule("dialog:focus, dialog:focus-visible { outline: none !important; }");
    // 3. Prevent text selection while swiping
    this._insertRule(".gesture-active { user-select: none; -webkit-user-select: none; }");
  },

  _insertRule: function (ruleText) {
    try {
      this._sheet.insertRule(ruleText, this._sheet.cssRules.length);
    } catch (e) {
      console.warn("Lithium Engine: CSS Rule rejected by browser ->", ruleText);
    }
  },

  removeOutlineForId: function (id) {
    if (!id) return;
    this._init();

    const cleanId = id.replace(/^#/, "");
    if (this._registeredIds.has(cleanId)) return;

    const rule = `#${cleanId}:focus, #${cleanId}:focus-visible { outline: none !important; }`;
    this._insertRule(rule);
    this._registeredIds.add(cleanId);
  },
};

const GestureManager = {
  // Registry of all gesture state objects, keyed by ownerPageName (or "__global__").
  // Used by Carbon to reset gestures on page transitions.
  _registry: {},

  _createGesture: function (direction, config) {
    const state = {
      active: false,
      startX: 0,
      startY: 0,
      startedInZone: false,
    };

    const edgeLimit = parseInt(config.EdgeSize) || 40;
    const threshold = 60;

    // Automatically fix CSS outline for the content element
    if (config.Content) {
      UIStyleFixer.removeOutlineForId(config.Content);
    }

    // --- PAGE SCOPE ---
    // config.PageView must match the Name attribute of the owning <PageView>.
    // Gestures with no PageView set are global (legacy behaviour).
    const ownerPageName = config.PageView || null;
    const registryKey   = ownerPageName || "__global__";

    // Register this state so Carbon.navigate() can reset it on page leave.
    if (!this._registry[registryKey]) {
      this._registry[registryKey] = [];
    }
    this._registry[registryKey].push(state);

    /**
     * isCurrentPage()
     * Returns true only when this gesture is allowed to fire:
     *  - No PageView scope is set (global / legacy), OR
     *  - Carbon.currentPage matches the owning PageView name (primary check), OR
     *  - The owning PageView element carries the [active] attribute (DOM fallback).
     */
    const isCurrentPage = () => {
      if (!ownerPageName) return true;

      // Primary: trust the Carbon router
      if (typeof Carbon !== "undefined" && Carbon.currentPage !== undefined) {
        return Carbon.currentPage === ownerPageName;
      }

      // Fallback: inspect the DOM directly
      const el = document.querySelector(
        `PageView[Name="${ownerPageName}"], pageview[Name="${ownerPageName}"]`
      );
      return el ? el.hasAttribute("active") : true;
    };

    /**
     * resetState()
     * Fully clears in-flight touch tracking and the open/close toggle.
     * Called by Carbon.navigate() when leaving this gesture's page so no
     * stale state leaks into the next visit.
     */
    const resetState = () => {
      state.active        = false;
      state.startedInZone = false;
      document.body.classList.remove("gesture-active");
    };

    // Expose reset so the registry can call it
    state._reset = resetState;

    // ─── touchstart ──────────────────────────────────────────────────────────
    window.addEventListener(
      "touchstart",
      (e) => {
        // SCOPE GUARD — must be checked first, before any state mutation.
        // This covers backdrop logic too; if the page is inactive, nothing runs.
        if (!isCurrentPage()) {
          // Defensively wipe any leftover in-flight state from a previous visit
          // (guards against the edge case where navigation happened mid-swipe).
          state.startedInZone = false;
          return;
        }

        // ── Backdrop / click-outside logic ────────────────────────────────
        // Only runs when the gesture is in the open state AND a Content target
        // is configured. The tap must land *outside* that element to dismiss.
        if (state.active && config.Content) {
          const elementId     = config.Content.replace(/^#/, "");
          const contentElement = document.getElementById(elementId);

          if (contentElement && !contentElement.contains(e.target)) {
            state.active        = false;
            state.startedInZone = false;
            document.body.classList.remove("gesture-active");

            // OnBackdrop fires specifically for outside-tap dismissals
            if (typeof config.OnBackdrop === "function") config.OnBackdrop();

            // OnClose fires so existing close animations still run
            if (typeof config.OnClose === "function") config.OnClose();
            return;
          }
        }

        // ── Record touch origin ───────────────────────────────────────────
        state.startX = e.touches[0].clientX;
        state.startY = e.touches[0].clientY;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        // ── Edge-zone detection ───────────────────────────────────────────
        // When already open, every touch is a candidate (enables swipe-to-close
        // from anywhere, not just the original edge). When closed, only touches
        // that originate inside the configured edge zone count.
        if (!state.active) {
          if      (direction === "top"    && state.startY <= edgeLimit)           state.startedInZone = true;
          else if (direction === "bottom" && state.startY >= screenH - edgeLimit) state.startedInZone = true;
          else if (direction === "left"   && state.startX <= edgeLimit)           state.startedInZone = true;
          else if (direction === "right"  && state.startX >= screenW - edgeLimit) state.startedInZone = true;
          else                                                                     state.startedInZone = false;
        } else {
          state.startedInZone = true;
        }

        if (state.startedInZone) {
          document.body.classList.add("gesture-active");
        }
      },
      { passive: false }
    );

    // ─── touchmove ───────────────────────────────────────────────────────────
    window.addEventListener(
      "touchmove",
      (e) => {
        // Only block native scroll when this gesture is both active-page AND
        // has a confirmed in-zone swipe underway. Prevents Page A's gesture
        // from stealing scroll events while Page B is visible.
        if (isCurrentPage() && state.startedInZone) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    // ─── touchend ────────────────────────────────────────────────────────────
    const handleEnd = (e) => {
      document.body.classList.remove("gesture-active");

      if (!state.startedInZone) return;

      const endX  = e.changedTouches[0].clientX;
      const endY  = e.changedTouches[0].clientY;
      const diffX = endX - state.startX;
      const diffY = endY - state.startY;

      let shouldOpen  = false;
      let shouldClose = false;

      if      (direction === "top")    { shouldOpen = diffY >  threshold; shouldClose = diffY < -threshold; }
      else if (direction === "bottom") { shouldOpen = diffY < -threshold; shouldClose = diffY >  threshold; }
      else if (direction === "left")   { shouldOpen = diffX >  threshold; shouldClose = diffX < -threshold; }
      else if (direction === "right")  { shouldOpen = diffX < -threshold; shouldClose = diffX >  threshold; }

      if (!state.active && shouldOpen) {
        state.active = true;
        if (typeof config.OnOpen === "function") config.OnOpen();
      } else if (state.active && shouldClose) {
        state.active = false;
        if (typeof config.OnClose === "function") config.OnClose();
      }

      state.startedInZone = false;
    };

    window.addEventListener("touchend", handleEnd);

    // ─── touchcancel ─────────────────────────────────────────────────────────
    window.addEventListener("touchcancel", () => {
      state.startedInZone = false;
      document.body.classList.remove("gesture-active");
    });
  },

  // ── Public API ─────────────────────────────────────────────────────────────
  gestureTop:    function (config) { this._createGesture("top",    config); },
  gestureBottom: function (config) { this._createGesture("bottom", config); },
  gestureLeft:   function (config) { this._createGesture("left",   config); },
  gestureRight:  function (config) { this._createGesture("right",  config); },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Carbon.navigate() PATCH
   Intercepts every page transition and resets gesture state for the page being
   left, so no open drawers or in-flight swipes survive across navigations.
   This patch is applied once, after both Carbon and GestureManager are defined.
───────────────────────────────────────────────────────────────────────────── */
(function patchCarbonNavigate() {
  // Guard: retry once the DOM is ready if Carbon isn't available yet.
  const apply = () => {
    if (typeof Carbon === "undefined" || typeof Carbon.navigate !== "function") {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", apply, { once: true });
      }
      return;
    }

    const _originalNavigate = Carbon.navigate.bind(Carbon);

    Carbon.navigate = async function (config, mode = "open") {
      // Resolve the page name we are leaving
      const leavingPage = Carbon.currentPage;

      // Reset all gestures that belong to the page being left.
      // This covers:
      //   • open drawers/panels (state.active = true)
      //   • mid-swipe touches that were interrupted by programmatic navigation
      if (leavingPage && GestureManager._registry[leavingPage]) {
        GestureManager._registry[leavingPage].forEach(s => {
          if (typeof s._reset === "function") s._reset();
        });
      }

      return _originalNavigate(config, mode);
    };
  };

  apply();
})();