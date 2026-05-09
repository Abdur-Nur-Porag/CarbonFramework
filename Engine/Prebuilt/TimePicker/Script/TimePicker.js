    document.addEventListener("DOMContentLoaded", () => {
      
      window.CarbonTimePicker = {
        instances: {},
        getTime: function(id) {
          const input = document.getElementById(id);
          return input ? input.value : null;
        },
        setTime: function(id, timeStr) {
          const input = document.getElementById(id);
          if (input) {
            input.value = timeStr;
            if(this.instances[id]) this.instances[id].parseAndSync(timeStr);
          }
        },
        removeTime: function(id) {
          const input = document.getElementById(id);
          if (input) {
            input.value = "";
            if(this.instances[id]) this.instances[id].reset();
          }
        }
      };

      class TimePickerInstance {
        constructor(id, dialogEl, format) {
          this.id = id;
          this.dialog = dialogEl;
          this.input = document.getElementById(id);
          this.format = format; // "12" or "24"

          this.state = {
            mode: 'hours',
            hour: 12,
            minute: 0,
            period: 'PM',
            isDragging: false,
            clockRadiusOuter: 100,
            clockRadiusInner: 64, // Precise radius to separate inner/outer rings
            centerOffset: 128 
          };

          this.DOM = {
            clockFace: this.dialog.querySelector('.clock-face'),
            touchTarget: this.dialog.querySelector('.touch-target'),
            clockHand: this.dialog.querySelector('.clock-hand-wrapper'),
            clockHandText: this.dialog.querySelector('.clock-hand-text'),
            numbersContainer: this.dialog.querySelector('.clock-numbers-container'),
            hourBlock: this.dialog.querySelector('.hour-block'),
            minuteBlock: this.dialog.querySelector('.minute-block'),
            hourText: this.dialog.querySelector('.hour-text'),
            minuteText: this.dialog.querySelector('.minute-text'),
            amBtn: this.dialog.querySelector('.am-btn'),
            pmBtn: this.dialog.querySelector('.pm-btn'),
            ampmToggle: this.dialog.querySelector('.ampm-toggle'),
            btnCancel: this.dialog.querySelector('.btn-cancel'),
            btnOk: this.dialog.querySelector('.btn-ok')
          };

          this.init();
        }

        init() {
          // Strictly hide AM/PM toggle when in 24 Hour format
          if (this.format === '24') {
            this.DOM.ampmToggle.style.display = 'none';
          }
          this.bindEvents();
          this.renderUI();
        }

        bindEvents() {
          this.DOM.hourBlock.addEventListener('click', () => this.setMode('hours'));
          this.DOM.minuteBlock.addEventListener('click', () => this.setMode('minutes'));

          if (this.format === '12') {
            this.DOM.amBtn.addEventListener('click', () => this.setPeriod('AM'));
            this.DOM.pmBtn.addEventListener('click', () => this.setPeriod('PM'));
          }

          // Desktop Events
          this.DOM.touchTarget.addEventListener('mousedown', (e) => this.handleStart(e));
          document.addEventListener('mousemove', (e) => this.handleMove(e));
          document.addEventListener('mouseup', (e) => this.handleEnd(e));

          // Mobile Events
          this.DOM.touchTarget.addEventListener('touchstart', (e) => this.handleStart(e), { passive: false });
          document.addEventListener('touchmove', (e) => this.handleMove(e), { passive: false });
          document.addEventListener('touchend', (e) => this.handleEnd(e));

          // Actions
          this.DOM.btnCancel.addEventListener('click', () => {
            if(typeof ui === 'function') ui(`#${this.id}_dialog`);
          });

          this.DOM.btnOk.addEventListener('click', () => {
            this.saveTime();
            if(typeof ui === 'function') ui(`#${this.id}_dialog`);
          });
        }

        renderUI() {
          this.DOM.hourBlock.classList.toggle('active', this.state.mode === 'hours');
          this.DOM.minuteBlock.classList.toggle('active', this.state.mode === 'minutes');

          if (this.format === '12') {
            this.DOM.amBtn.classList.toggle('active', this.state.period === 'AM');
            this.DOM.pmBtn.classList.toggle('active', this.state.period === 'PM');
          }

          this.renderClockNumbers();
          this.updateDisplays();
        }

        renderClockNumbers() {
          this.DOM.numbersContainer.innerHTML = ''; 
          let items = [];

          if (this.state.mode === 'hours') {
            if (this.format === '24') {
              // Standard MD: Outer Ring is 00, 13-23
              items.push({ val: 0, display: '00', radius: this.state.clockRadiusOuter, angle: 360 });
              for (let i = 13; i <= 23; i++) {
                items.push({ val: i, display: String(i), radius: this.state.clockRadiusOuter, angle: (i - 12) * 30 });
              }
              // Standard MD: Inner Ring is 12, 1-11
              items.push({ val: 12, display: '12', radius: this.state.clockRadiusInner, angle: 360 });
              for (let i = 1; i <= 11; i++) {
                items.push({ val: i, display: String(i), radius: this.state.clockRadiusInner, angle: i * 30 });
              }
            } else {
              // 12-Hour format: Only ONE ring (1-12)
              items.push({ val: 12, display: '12', radius: this.state.clockRadiusOuter, angle: 360 });
              for (let i = 1; i <= 11; i++) {
                items.push({ val: i, display: String(i), radius: this.state.clockRadiusOuter, angle: i * 30 });
              }
            }
          } else {
            // Minutes: Standard 00-55 on Outer Ring
            items.push({ val: 0, display: '00', radius: this.state.clockRadiusOuter, angle: 360 });
            for (let i = 1; i <= 11; i++) {
              items.push({ val: i * 5, display: this.pad(i * 5), radius: this.state.clockRadiusOuter, angle: i * 30 });
            }
          }

          items.forEach(item => {
            const numDiv = document.createElement('div');
            numDiv.className = 'clock-number';
            numDiv.innerText = item.display;

            const angleRad = (item.angle - 90) * (Math.PI / 180);
            const x = Math.cos(angleRad) * item.radius;
            const y = Math.sin(angleRad) * item.radius;

            numDiv.style.left = `calc(50% - 20px + ${x}px)`; 
            numDiv.style.top = `calc(50% - 20px + ${y}px)`;
            this.DOM.numbersContainer.appendChild(numDiv);
          });
        }

        updateDisplays() {
          let displayHour = this.state.hour;
          // In 12-hour, standard UI shows "12" instead of "0"
          if (this.format === '12' && displayHour === 0) displayHour = 12;

          this.DOM.hourText.innerText = this.pad(displayHour);
          this.DOM.minuteText.innerText = this.pad(this.state.minute);

          let angle, displayValue, handRadius = this.state.clockRadiusOuter;

          if (this.state.mode === 'hours') {
            if (this.format === '24') {
              if (this.state.hour >= 1 && this.state.hour <= 12) {
                handRadius = this.state.clockRadiusInner;
                angle = (this.state.hour * 30) - 90;
              } else {
                handRadius = this.state.clockRadiusOuter;
                let h = this.state.hour === 0 ? 12 : (this.state.hour - 12);
                angle = (h * 30) - 90;
              }
            } else {
              handRadius = this.state.clockRadiusOuter;
              let h = this.state.hour === 0 ? 12 : this.state.hour;
              angle = (h * 30) - 90;
            }
            displayValue = displayHour;
          } else {
            handRadius = this.state.clockRadiusOuter;
            angle = (this.state.minute * 6) - 90;
            displayValue = this.state.minute;
          }

          this.DOM.clockHand.style.width = `${handRadius}px`;
          this.DOM.clockHand.style.transform = `rotate(${angle}deg)`;
          
          // Display the exact value in the pointer circle
          let handText = (this.state.mode === 'hours' && this.format === '24' && displayValue === 0) 
            ? '00' 
            : this.pad(displayValue);
            
          this.DOM.clockHandText.innerText = handText;
          this.DOM.clockHandText.style.transform = `rotate(${-angle}deg)`; // Keeps text upright
        }

        handleStart(e) {
          e.preventDefault();
          this.state.isDragging = true;
          this.DOM.clockFace.classList.add('dragging');
          this.processGesture(e);
        }

        handleMove(e) {
          if (!this.state.isDragging) return;
          e.preventDefault();
          this.processGesture(e);
        }

        handleEnd(e) {
          if (!this.state.isDragging) return;
          this.state.isDragging = false;
          this.DOM.clockFace.classList.remove('dragging');

          // Auto-advance to minutes when releasing hour drag
          if (this.state.mode === 'hours') {
            setTimeout(() => this.setMode('minutes'), 300);
          }
        }

        processGesture(e) {
          const coords = this.getCoords(e);
          const rect = this.DOM.clockFace.getBoundingClientRect();
          const centerX = rect.left + this.state.centerOffset;
          const centerY = rect.top + this.state.centerOffset;

          const dx = coords.x - centerX;
          const dy = coords.y - centerY;
          const distance = Math.sqrt(dx*dx + dy*dy);

          let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
          if (angle < 0) angle += 360;

          if (this.state.mode === 'hours') {
            let index = Math.round(angle / 30);
            if (index === 0) index = 12; // Top position
            
            let hour = index;

            if (this.format === '24') {
              // Determine inner/outer ring by touch distance
              if (distance < 82) { 
                if (hour === 12) hour = 12; 
              } else { 
                if (hour === 12) hour = 0; 
                else hour += 12; 
              }
            }
            
            if (this.state.hour !== hour) {
              this.state.hour = hour;
              this.updateDisplays();
            }
          } else {
            // Minutes snap nicely to individual markers (1-59)
            let minute = Math.round(angle / 6);
            if (minute === 60) minute = 0;
            
            if (this.state.minute !== minute) {
              this.state.minute = minute;
              this.updateDisplays();
            }
          }
        }

        getCoords(e) {
          if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
          if (e.changedTouches && e.changedTouches.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
          return { x: e.clientX, y: e.clientY };
        }

        setMode(mode) {
          if (this.state.mode === mode) return;
          this.state.mode = mode;
          this.renderUI();
        }

        setPeriod(period) {
          if (this.state.period === period) return;
          this.state.period = period;
          this.renderUI();
        }

        saveTime() {
          let finalString = "";
          if (this.format === '12') {
            let h = this.state.hour === 0 ? 12 : this.state.hour;
            finalString = `${this.pad(h)}:${this.pad(this.state.minute)} ${this.state.period}`;
          } else {
            finalString = `${this.pad(this.state.hour)}:${this.pad(this.state.minute)}`;
          }
          this.input.value = finalString;
        }

        parseAndSync(timeStr) {
          if(!timeStr) return this.reset();
          try {
            if (this.format === '12') {
              const parts = timeStr.trim().split(/\s+/);
              const time = parts[0].split(':');
              let hr = parseInt(time[0], 10);
              this.state.minute = parseInt(time[1], 10) || 0;
              this.state.period = parts[1] ? parts[1].toUpperCase() : (hr >= 12 ? 'PM' : 'AM');
              this.state.hour = hr % 12 || 12;
            } else {
              const time = timeStr.split(':');
              this.state.hour = parseInt(time[0], 10);
              this.state.minute = parseInt(time[1], 10) || 0;
            }
            this.renderUI();
          } catch(e) {}
        }

        reset() {
          this.state.hour = 12;
          this.state.minute = 0;
          this.state.period = 'PM';
          this.state.mode = 'hours';
          this.renderUI();
        }

        pad(num) { return num < 10 ? '0' + num : String(num); }
      }

      const pickers = document.querySelectorAll('CarbonTimePicker, carbontimepicker');

      pickers.forEach(el => {
        const id = el.getAttribute('Id') || el.getAttribute('id') || `picker_${Math.random().toString(36).substr(2, 9)}`;
        const type = (el.getAttribute('Type') || el.getAttribute('type') || 'fill').toLowerCase();
        const placeholder = el.getAttribute('Placeholder') || el.getAttribute('placeholder') || 'Select Time';
        const format = el.getAttribute('Format') || el.getAttribute('format') || '12';
        const iconDir=el.getAttribute('Icon') || "Right";
        const wrapper = document.createElement('div');
        
        if(iconDir==="Left"){
          wrapper.className = `field prefix ${type} label`;
        //svg 
        const svgClock= document.createElement("svg")
         svgClock.innerHTML=`
         <svg fill="#000000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M12.5 7.25a.75.75 0 00-1.5 0v5.5c0 .27.144.518.378.651l3.5 2a.75.75 0 00.744-1.302L12.5 12.315V7.25z"></path><path fill-rule="evenodd" d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zM2.5 12a9.5 9.5 0 1119 0 9.5 9.5 0 01-19 0z"></path></g></svg>
         `;
        const input = document.createElement('input');
        input.id = id;
        input.readOnly = true; 
        input.onclick = () => { if(typeof ui === 'function') ui(`#${id}_dialog`); };
        
        
        const label = document.createElement('label');
        label.innerText = placeholder;
        
        wrapper.appendChild(svgClock)
        wrapper.appendChild(input);
        wrapper.appendChild(label);
        
        }
        else{
          wrapper.className = `field suffix ${type} label`;
        //svg 
        const svgClock= document.createElement("svg")
         svgClock.innerHTML=`
         <svg fill="#000000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M12.5 7.25a.75.75 0 00-1.5 0v5.5c0 .27.144.518.378.651l3.5 2a.75.75 0 00.744-1.302L12.5 12.315V7.25z"></path><path fill-rule="evenodd" d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zM2.5 12a9.5 9.5 0 1119 0 9.5 9.5 0 01-19 0z"></path></g></svg>
         `;
        const input = document.createElement('input');
        input.id = id;
        input.readOnly = true; 
        input.onclick = () => { if(typeof ui === 'function') ui(`#${id}_dialog`); };
        
        
        const label = document.createElement('label');
        label.innerText = placeholder;
        
        
        wrapper.appendChild(input);
        wrapper.appendChild(label);
        wrapper.appendChild(svgClock)
        
        }
        
        

        const dialog = document.createElement('dialog');
        dialog.id = `${id}_dialog`;
        dialog.className = 'carbon-time-picker-dialog';

        dialog.innerHTML = `
          <div class="time-picker-container">
            <div class="time-picker-header">Select Time</div>
            
            <div class="time-display">
              <div class="time-block hour-block active">
                <span class="hour-text ripple">12</span>
              </div>
              <div class="time-colon">:</div>
              <div class="time-block minute-block">
                <span class="minute-text ripple">00</span>
              </div>
              
              <div class="ampm-toggle">
                <div class="ampm-btn am-btn ripple">AM</div>
                <div class="ampm-btn pm-btn ripple active">PM</div>
              </div>
            </div>

            <div class="clock-container">
              <div class="clock-face">
                <div class="clock-center"></div>
                <div class="clock-hand-wrapper">
                  <div class="clock-hand-line"></div>
                  <div class="clock-hand-circle">
                    <span class="clock-hand-text">12</span>
                  </div>
                </div>
                <div class="clock-numbers-container"></div>
                <div class="touch-target"></div>
              </div>
            </div>

            <div class="picker-actions">
              <button class="transparent ripple btn-cancel">Cancel</button>
              <button class="transparent ripple btn-ok">OK</button>
            </div>
          </div>
        `;

        el.parentNode.replaceChild(dialog, el);
        dialog.parentNode.insertBefore(wrapper, dialog);

        CarbonTimePicker.instances[id] = new TimePickerInstance(id, dialog, format);
      });
    });