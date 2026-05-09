class AutoScroll {
    constructor(el) {
        this.el = el;
        this.type = el.getAttribute('Type') || 'VScroll';
        this.timeout = null;
        this.vBar = null;
        this.hBar = null;
        
        this.createBars();
        
        // Listen to scroll events properly
        const targetEl = (this.el === document.body || this.el === document.documentElement) ? window : this.el;
        targetEl.addEventListener('scroll', () => this.handleScroll(), { passive: true });
        window.addEventListener('resize', () => this.update(), { passive: true });
        
        // Render initial state
        this.update();
    }
    
    createBars() {
        const isBody = this.el === document.body || this.el === document.documentElement;
        const parent = isBody ? document.body : this.el;
        const posType = isBody ? 'fixed' : 'absolute';
        
        if (this.type.includes('VScroll')) {
            this.vBar = document.createElement('div');
            this.vBar.className = 'md-scrollbar-track';
            this.vBar.style.width = '4px'; /* Thinner Material Size */
            this.vBar.style.top = '0px';
            this.vBar.style.left = '0px';
            this.vBar.style.position = posType;
            parent.appendChild(this.vBar);
        }
        
        if (this.type.includes('HScroll')) {
            this.hBar = document.createElement('div');
            this.hBar.className = 'md-scrollbar-track';
            this.hBar.style.height = '4px'; /* Thinner Material Size */
            this.hBar.style.top = '0px';
            this.hBar.style.left = '0px';
            this.hBar.style.position = posType;
            parent.appendChild(this.hBar);
        }
    }
    
    handleScroll() {
        if (this.vBar && this.vBar.style.display !== 'none') this.vBar.style.opacity = '1';
        if (this.hBar && this.hBar.style.display !== 'none') this.hBar.style.opacity = '1';
        
        this.update();
        
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            if (this.vBar) this.vBar.style.opacity = '0';
            if (this.hBar) this.hBar.style.opacity = '0';
        }, 1200);
    }
    
    update() {
        const isBody = this.el === document.body || this.el === document.documentElement;
        const target = isBody ? document.documentElement : this.el;
        
        const sTop = isBody ? window.scrollY : target.scrollTop;
        const sLeft = isBody ? window.scrollX : target.scrollLeft;
        const sHeight = target.scrollHeight;
        const sWidth = target.scrollWidth;
        const vHeight = isBody ? window.innerHeight : target.clientHeight;
        const vWidth = isBody ? window.innerWidth : target.clientWidth;
        
        // --- VSCROLL LOGIC ---
        if (this.vBar) {
            if (sHeight > vHeight + 2) {
                this.vBar.style.display = 'block';
                
                // Material minimum scrollbar length is usually around 30px
                const barHeight = Math.max((vHeight / sHeight) * vHeight, 30);
                const maxTravel = vHeight - barHeight - 4; // 2px margin top and bottom
                const scrollPercent = sTop / (sHeight - vHeight);
                const barPos = scrollPercent * maxTravel;
                
                // Position 4px from edge 
                const offsetX = isBody ? (vWidth - 4) : (sLeft + vWidth -4 );
                const offsetY = isBody ? 0 : sTop;
                
                this.vBar.style.height = `${barHeight}px`;
                this.vBar.style.transform = `translate(${offsetX}px, ${barPos + offsetY + 2}px)`;
            } else {
                this.vBar.style.display = 'none';
            }
        }
        
        // --- HSCROLL LOGIC ---
        if (this.hBar) {
            if (sWidth > vWidth + 2) {
                this.hBar.style.display = 'block';
                
                const barWidth = Math.max((vWidth / sWidth) * vWidth, 30);
                const maxTravel = vWidth - barWidth - 4; // 2px margin left and right
                const scrollPercent = sLeft / (sWidth - vWidth);
                const barPos = scrollPercent * maxTravel;
                
                // Position 6px from bottom (4px height + 2px gap)
                const offsetX = isBody ? 0 : sLeft;
                const offsetY = isBody ? (vHeight - 6) : (sTop + vHeight - 6);
                
                this.hBar.style.width = `${barWidth}px`;
                this.hBar.style.transform = `translate(${barPos + offsetX + 2}px, ${offsetY}px)`;
            } else {
                this.hBar.style.display = 'none';
            }
        }
    }
}

// Auto-initialize system
function initAutoScroll() {
    const elements = document.querySelectorAll('[ScrollBar="true"]');
    elements.forEach(el => {
        if (!el.dataset.scrollInited) {
            new AutoScroll(el);
            el.dataset.scrollInited = "true";
        }
    });
}

// Run on DOM Load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoScroll);
} else {
    initAutoScroll();
}

// Watch for dynamically added elements in the future
const observer_1 = new MutationObserver(initAutoScroll);
observer_1.observe(document.body, { childList: true, subtree: true });