     const DrawerRegistry = {};

        const DrawerEngine = {
            getShadow(level, pos) {
                const val = Math.min(Math.max(parseInt(level) || 0, 0), 10);
                if (val === 0) return 'none';
                const blur = val * 5;
                const xOffset = pos === 'left' ? val : -val;
                return `${xOffset}px 0px ${blur}px rgba(0,0,0,${0.05 + (val * 0.02)})`;
            },

            initDrawer(el) {
                const name = el.getAttribute('Name');
                const pos = (el.getAttribute('Position') || 'Left').toLowerCase();
                const elevation = el.getAttribute('Elevation') || '5';

                // 1. Create Overlay if missing
                if (!document.getElementById('dr-global-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.id = 'dr-global-overlay';
                    overlay.className = 'dr-overlay';
                    // Backdrop click disabled as requested
                    document.body.appendChild(overlay);
                }

                // 2. Create Wrapper
                const wrapper = document.createElement('div');
                wrapper.className = `dr-wrapper dr-${pos}`;
                wrapper.style.boxShadow = this.getShadow(elevation, pos);

                // 3. Move Content
                while (el.firstChild) {
                    wrapper.appendChild(el.firstChild);
                }

                // 4. Register & Clean
                document.body.appendChild(wrapper);
                DrawerRegistry[name] = wrapper;
                el.remove();
            }
        };

        // API Methods
        window.openDrawer = (name) => {
            const dr = DrawerRegistry[name];
            if (dr) {
                document.getElementById('dr-global-overlay').classList.add('active');
                dr.classList.add('active');
            }
        };

        window.closeDrawer = (name) => {
            const dr = DrawerRegistry[name];
            if (dr) {
                dr.classList.remove('active');
                setTimeout(() => {
                    if (!document.querySelector('.dr-wrapper.active')) {
                        document.getElementById('dr-global-overlay').classList.remove('active');
                    }
                }, 150);
            }
        };

        // Observer for dynamic tags
        const drObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'DRAWER') DrawerEngine.initDrawer(node);
                });
            });
        });

        drObserver.observe(document.documentElement, { childList: true, subtree: true });

        // Initial Boot
        document.querySelectorAll('Drawer').forEach(el => DrawerEngine.initDrawer(el));
   