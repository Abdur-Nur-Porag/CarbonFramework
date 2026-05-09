
const CarbonSelect = {
  _dataStore: {},
  
  getSelect: function(id) {
    const el = document.getElementById(id);
    return el ? el.value : null;
  },
  
  setValue: function(id, value) {
    const input = document.getElementById(id);
    if (!input) return;
    input.value = value;
    input.parentElement.classList.add('active');
    
    const dialog = document.getElementById(`dlg_${id}`);
    if (dialog) {
      const vals = value.split(', ');
      dialog.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        const labelText = cb.closest('li').querySelector('text').textContent;
        cb.checked = vals.includes(labelText);
      });
    }
  },
  
  unSet: function(id) {
    const input = document.getElementById(id);
    if (!input) return;
    input.value = "";
    input.parentElement.classList.remove('active');
    const dialog = document.getElementById(`dlg_${id}`);
    if (dialog) {
      dialog.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
      });
    }
  },
  
  appendData: function(id, newDataArray) {
    if (!this._dataStore[id]) this._dataStore[id] = [];
    const dataToAdd = Array.isArray(newDataArray) ? newDataArray : [newDataArray];
    this._dataStore[id] = [...this._dataStore[id], ...dataToAdd];
    this._renderList(id);
  },
  
  removeData: function(id, itemValue) {
    if (!this._dataStore[id]) return;
    this._dataStore[id] = this._dataStore[id].filter(item => item !== itemValue);
    if (this.getSelect(id) === itemValue) this.unSet(id);
    this._renderList(id);
  },
  
  removeAll: function(id) {
    this._dataStore[id] = [];
    this.unSet(id);
    this._renderList(id);
  },
  
  getAll: function(id) {
    return this._dataStore[id] || [];
  },
  
  checkExistData: function(id, itemValue) {
    if (!this._dataStore[id]) return false;
    return this._dataStore[id].includes(itemValue);
  },
  
  getAllChecked: function(id) {
    const dialog = document.getElementById(`dlg_${id}`);
    if (!dialog) return [];
    return Array.from(dialog.querySelectorAll('input[type="checkbox"]:checked'))
      .map(cb => cb.closest('li').querySelector('text').textContent);
  },
  
  getAllUnchecked: function(id) {
    const dialog = document.getElementById(`dlg_${id}`);
    if (!dialog) return [];
    return Array.from(dialog.querySelectorAll('input[type="checkbox"]:not(:checked)'))
      .map(cb => cb.closest('li').querySelector('text').textContent);
  },
  
  addData: function(id, dataArray) {
    this._dataStore[id] = [...dataArray];
    this._renderList(id);
  },
  
  _renderList: function(id) {
    const dialog = document.getElementById(`dlg_${id}`);
    if (!dialog) return;
    const listContainer = dialog.querySelector('.m3-dialog-list');
    const data = this._dataStore[id] || [];
    const isMulti = dialog.hasAttribute('data-multi');
    
    let html = '';
    data.forEach((opt, index) => {
      const itemId = `${id}_cb_${index}_${Math.random().toString(36).substr(2, 4)}`;
      html += `
                    <li class="ripple" onclick="handleCarbonSelectLogic('${id}', '${opt}', '${itemId}', 'dlg_${id}', ${isMulti})">
                        <label class="checkbox">
                            <input type="checkbox" id="${itemId}" name="grp_${id}" onclick="event.stopPropagation(); handleCarbonSelectLogic('${id}', '${opt}', '${itemId}', 'dlg_${id}', ${isMulti})">
                            <span></span>
                        </label>
                        <span class="space"></span>
                        <text>${opt}</text>
                    </li>`;
    });
    listContainer.innerHTML = html;
  }
};

function handleCarbonSelectLogic(inputId, val, cbId, dialogId, isMulti) {
  const dialog = document.getElementById(dialogId);
  const currentCb = document.getElementById(cbId);
  
  if (!isMulti) {
    const wasChecked = currentCb.checked;
    dialog.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      if (cb.id !== cbId) cb.checked = false;
    });
    currentCb.checked = !wasChecked;
  } else {
    currentCb.checked = !currentCb.checked;
  }
}

function handleCarbonSelectOk(id, dialogId) {
  const input = document.getElementById(id);
  const dialog = document.getElementById(dialogId);
  const selected = Array.from(dialog.querySelectorAll('input[type="checkbox"]:checked'))
    .map(cb => cb.closest('li').querySelector('text').textContent);
  
  if (selected.length > 0) {
    input.value = selected.join(", ");
    input.parentElement.classList.add('active');
  } else {
    input.value = "";
    input.parentElement.classList.remove('active');
  }
  ui(`#${dialogId}`);
}

function renderCarbon(tag, isMulti) {
  document.querySelectorAll(tag).forEach(el => {
    const id = el.getAttribute('Id');
    const placeholder = el.getAttribute('Placeholder') || "Select";
    const type = el.getAttribute('Type') || "Border";
    const initialData = (el.getAttribute('Data') || "").split(',').filter(o => o.trim() !== "");
    const dialogId = `dlg_${id}`;
    
    const fieldWrapper = document.createElement('div');
    fieldWrapper.setAttribute('data-ui', `#${dialogId}`);
    fieldWrapper.className = `field label suffix ${type.toLowerCase() === "filled" ? "fill" : "border"}`;
    fieldWrapper.style.cursor = "pointer";
    fieldWrapper.innerHTML = `<input type="text" id="${id}" readonly placeholder=" "><label>${placeholder}</label><img src="Resources/svg/carbon.fill.dropdown.svg"/>`;
    
    const dialog = document.createElement('dialog');
    dialog.id = dialogId;
    dialog.className = "m3-select-dialog";
    if (isMulti) dialog.setAttribute('data-multi', 'true');
    dialog.innerHTML = `
                <h5>${placeholder}</h5>
                <div class="no-scrollbar" style="height:250px; overflow-y: auto;"><ul class="m3-dialog-list"></ul></div>
                <nav class="right-align no-space">
                    <button class="transparent link" data-ui="#${dialogId}">Cancel</button>
                    <button class="primary" onclick="handleCarbonSelectOk('${id}', '${dialogId}')">Ok</button>
                </nav>`;
    
    const container = document.createElement('div');
    container.appendChild(fieldWrapper);
    container.appendChild(dialog);
    el.replaceWith(container);
    CarbonSelect.addData(id, initialData);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderCarbon('CarbonSelect', false);
  renderCarbon('CarbonMultipleSelect', true);
  if (window.ui) ui();
});