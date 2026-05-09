  const CarbonDatePicker = {
      _states: {},
      _months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],

      // --- PUBLIC API ---
      
      /** * Returns the currently selected date string (YYYY-MM-DD) or null
       */
      getSelectDate: function(id) {
        const el = document.getElementById(id);
        return el ? el.value : null;
      },

      init: function(id) {
        const now = new Date();
        this._states[id] = {
          viewMonth: now.getMonth(),
          viewYear: now.getFullYear(),
          tempSelected: null,
          confirmedDate: null,
          mode: 'calendar' 
        };
        this.render(id);
      },

      confirmSelection: function(id) {
        const s = this._states[id];
        if (!s.tempSelected) {
            ui(`#dlg_${id}`);
            return;
        }
        s.confirmedDate = s.tempSelected;
        const input = document.getElementById(id);
        input.value = s.confirmedDate;
        input.parentElement.classList.add('active');
        ui(`#dlg_${id}`);
        this.render(id);
      },

      // --- INTERNAL LOGIC ---

      highlightDate: function(id, d, m, y) {
        this._states[id].tempSelected = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        this.render(id);
      },

      changeView: function(id, mode) {
        this._states[id].mode = mode;
        this.render(id);
      },

      changeMonth: function(id, dir) {
        let s = this._states[id];
        s.viewMonth += dir;
        if (s.viewMonth > 11) { s.viewMonth = 0; s.viewYear++; }
        if (s.viewMonth < 0) { s.viewMonth = 11; s.viewYear--; }
        this.render(id);
      },

      goToday: function(id) {
        const now = new Date();
        this._states[id].viewMonth = now.getMonth();
        this._states[id].viewYear = now.getFullYear();
        this._states[id].mode = 'calendar';
        this._states[id].tempSelected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        this.render(id);
      },

      selectYear: function(id, y) {
        this._states[id].viewYear = y;
        this._states[id].mode = 'calendar';
        this.render(id);
      },

      selectMonth: function(id, m) {
        this._states[id].viewMonth = m;
        this._states[id].mode = 'calendar';
        this.render(id);
      },

      render: function(id) {
        const s = this._states[id];
        const dialog = document.getElementById(`dlg_${id}`);
        if(!dialog) return;
        const content = dialog.querySelector('.calendar-content');
        const title = dialog.querySelector('.calendar-title');
        const footer = dialog.querySelector('.calendar-footer');
        const headerBtnLeft = dialog.querySelector('.header-left');
        const headerBtnRight = dialog.querySelector('.header-right');
        
        headerBtnLeft.style.display = "inline-flex";
        headerBtnRight.style.display = "inline-flex";

        if (s.mode === 'year') {
          title.innerHTML = `Select Year`;
          headerBtnLeft.style.display = "none";
          headerBtnRight.style.display = "none";
          footer.innerHTML = `
            <button class="border" onclick="CarbonDatePicker.selectYear('${id}', new Date().getFullYear())">Current Year</button>
            <button class="transparent link" onclick="CarbonDatePicker.changeView('${id}', 'calendar')">Back</button>
          `;

          let html = `<div class="selection-list no-scrollbar">`;
          for (let y = 1950; y <= 2100; y++) {
            const isCurrent = y === new Date().getFullYear() ? 'current-item-text' : '';
            const isSelected = y === s.viewYear ? 'selected-item' : '';
            html += `<div class="selection-item ${isCurrent} ${isSelected}" onclick="CarbonDatePicker.selectYear('${id}', ${y})">${y}</div>`;
          }
          content.innerHTML = html + `</div>`;
          setTimeout(() => content.querySelector('.selected-item')?.scrollIntoView({ block: 'center' }), 50);

        } else if (s.mode === 'month') {
          title.innerHTML = `Select Month`;
          headerBtnLeft.style.display = "none";
          headerBtnRight.style.display = "none";
          footer.innerHTML = `<button class="transparent link" onclick="CarbonDatePicker.changeView('${id}', 'calendar')">Back</button>`;

          let html = `<div class="selection-list no-scrollbar">`;
          this._months.forEach((m, idx) => {
            const isCurrent = idx === new Date().getMonth() ? 'current-item-text' : '';
            const isSelected = idx === s.viewMonth ? 'selected-item' : '';
            html += `<div class="selection-item ${isCurrent} ${isSelected}" onclick="CarbonDatePicker.selectMonth('${id}', ${idx})">${m}</div>`;
          });
          content.innerHTML = html + `</div>`;

        } else {
          title.innerHTML = `
            <span onclick="CarbonDatePicker.changeView('${id}', 'month')" style="cursor:pointer">${this._months[s.viewMonth]}</span> 
            <span onclick="CarbonDatePicker.changeView('${id}', 'year')" style="cursor:pointer">${s.viewYear} <i>arrow_drop_down</i></span>
          `;
          footer.innerHTML = `
            <button class="transparent link" onclick="CarbonDatePicker.goToday('${id}')">Today</button>
            <button class="transparent link" data-ui="#dlg_${id}">Cancel</button>
            <button class="primary" onclick="CarbonDatePicker.confirmSelection('${id}')">OK</button>
          `;

          const firstDay = new Date(s.viewYear, s.viewMonth, 1).getDay();
          const daysInMonth = new Date(s.viewYear, s.viewMonth + 1, 0).getDate();
          const today = new Date();

          let html = `<div class="calendar-grid">
            <div class="weekday">S</div><div class="weekday">M</div><div class="weekday">T</div>
            <div class="weekday">W</div><div class="weekday">T</div><div class="weekday">F</div><div class="weekday">S</div>`;
          
          for (let i = 0; i < firstDay; i++) html += `<div class="calendar-day empty"></div>`;
          for (let d = 1; d <= daysInMonth; d++) {
            const dateKey = `${s.viewYear}-${String(s.viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = d === today.getDate() && s.viewMonth === today.getMonth() && s.viewYear === today.getFullYear() ? 'today' : '';
            const isSelected = (s.tempSelected === dateKey) ? 'selected-date' : '';
            html += `<div class="calendar-day ${isToday} ${isSelected}" onclick="CarbonDatePicker.highlightDate('${id}', ${d}, ${s.viewMonth}, ${s.viewYear})">${d}</div>`;
          }
          content.innerHTML = html + `</div>`;
        }
      }
    };

    // Auto-Initialization Function
    function initCarbonDatePickers() {
      document.querySelectorAll('CarbonDatePicker').forEach(el => {
        const id = el.getAttribute('Id');
        const placeholder = el.getAttribute('Placeholder') || "Select Date";
        const type = el.getAttribute('Type') || "Border";
        const iconDir=el.getAttribute("Icon")||"Right";
        const dialogId = `dlg_${id}`;

        const field = document.createElement('div');
       if(iconDir==="Left"){
        field.className = `field label prefix ${type.toLowerCase() === 'filled' ? 'fill' : 'border'}`;
        field.setAttribute('data-ui', `#${dialogId}`);
        field.style.cursor = "pointer";
        field.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M7 10H17M7 14H12M7 3V5M17 3V5M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z" stroke="#000000" stroke-width="0.4800000000000001" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg><input type="text" id="${id}" readonly placeholder=" "><label>${placeholder}</label>`;
       }
       else{
        field.className = `field label suffix ${type.toLowerCase() === 'filled' ? 'fill' : 'border'}`;
        field.setAttribute('data-ui', `#${dialogId}`);
        field.style.cursor = "pointer";
        field.innerHTML = `<input type="text" id="${id}" readonly placeholder=" "><label>${placeholder}</label><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M7 10H17M7 14H12M7 3V5M17 3V5M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z" stroke="#000000" stroke-width="0.4800000000000001" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`;
       }

        const dialog = document.createElement('dialog');
        dialog.id = dialogId;
        dialog.className = "m3-date-dialog";
        dialog.innerHTML = `
          <nav class="no-space">
            <button class="circle transparent header-left" onclick="CarbonDatePicker.changeMonth('${id}', -1)"><i>chevron_left</i></button>
            <h6 class="max center-align calendar-title" style="font-size:1.1rem"></h6>
            <button class="circle transparent header-right" onclick="CarbonDatePicker.changeMonth('${id}', 1)"><i>chevron_right</i></button>
          </nav>
          <div class="calendar-content"></div>
          <nav class="right-align no-space calendar-footer" style="margin-top:10px; gap:8px;"></nav>
        `;

        const container = document.createElement('div');
        container.appendChild(field);
        container.appendChild(dialog);
        el.replaceWith(container);

        CarbonDatePicker.init(id);
      });
    }

    document.addEventListener("DOMContentLoaded", () => {
      initCarbonDatePickers();
      if (window.ui) ui();
    });