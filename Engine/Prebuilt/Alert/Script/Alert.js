const alertQueue = [];
let isDialogOpen = false;

// 1. Standard Alert
function Alert(message, callback) {
  alertQueue.push({ type: 'alert', message: message, callback: callback });
  processQueue();
}

// 2. Input Alert (Returns text, or null if cancelled)
function AlertInput(message, callback, placeholder = "Type here...") {
  alertQueue.push({ type: 'input', message: message, callback: callback, placeholder: placeholder });
  processQueue();
}

// 3. Confirm Alert (Returns true if OK, false if Cancel)
function AlertConfirm(message, callback) {
  alertQueue.push({ type: 'confirm', message: message, callback: callback });
  processQueue();
}

function processQueue() {
  if (isDialogOpen || alertQueue.length === 0) return;
  
  isDialogOpen = true;
  const task = alertQueue.shift();
  const { type, message, callback, placeholder } = task;
  
  const overlay = document.createElement('div');
  overlay.className = 'md-dialog-overlay';
  
  const isInput = type === 'input';
  const isConfirm = type === 'confirm';
  
  // Set title based on type
  let titleText = 'Alert';
  if (isInput) titleText = 'Input Required';
  if (isConfirm) titleText = 'Confirm';
  
  // Create Input HTML if needed
  const inputHtml = isInput ?
    `<input type="text" id="md-input-field" class="md-dialog-input" placeholder="${placeholder}" autocomplete="off">` : '';
  
  // Create Buttons HTML
  let buttonsHtml = '';
  if (isInput || isConfirm) {
    buttonsHtml += `<button class="transparent no-round ripple" id="md-cancel-btn">Cancel</button>`;
  }
  buttonsHtml += `<button class="transparent no-round ripple" id="md-close-btn">OK</button>`;
  
  const dialog = document.createElement('div');
  dialog.className = 'md-dialog';
  
  dialog.innerHTML = `
    <div>
        <h4 class="md-dialog-title">${titleText}</h4>
    </div>
    <div ScrollBar="true" Type="VScroll" class="md-dialog-content">
        ${message.replace(/\n/g, '<br>')}
        ${inputHtml}
    </div>
    <div class="md-dialog-actions">
        ${buttonsHtml}
    </div>
  `;
  
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  // Focus input if it exists
  const inputField = overlay.querySelector('#md-input-field');
  if (isInput) {
    setTimeout(() => inputField.focus(), 100);
  }
  
  // Trigger entrance animation
  requestAnimationFrame(() => {
    overlay.classList.add('show');
  });
  
const closeDialog = (returnValue) => {
  overlay.classList.remove('show');
  
  setTimeout(() => {
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
    
    // 1. Reset the flag FIRST so the next alert can start
    isDialogOpen = false;
    
    // 2. Execute the callback
    if (typeof callback === 'function') {
      callback(returnValue);
    }
    
    // 3. Process the next item in the queue
    processQueue();
    
  }, 250); // Matches your transition time
};
  // OK Button Click
  overlay.querySelector('#md-close-btn').onclick = function() {
    if (isInput) {
      closeDialog(inputField.value);
    } else {
      closeDialog(true);
    }
  };
  
  // Cancel Button Click (only exists for Input and Confirm)
  const cancelBtn = overlay.querySelector('#md-cancel-btn');
  if (cancelBtn) {
    cancelBtn.onclick = function() {
      if (isInput) {
        closeDialog(null);
      } else {
        closeDialog(false);
      }
    };
  }
  
  // Enter key support for Input
  if (isInput) {
    inputField.onkeydown = function(e) {
      if (e.key === "Enter") {
        overlay.querySelector('#md-close-btn').click();
      }
    };
  }
}