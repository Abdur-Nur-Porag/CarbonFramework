# Alert

Alert components provide standard Material Design 3 dialogs for alerts, confirmations, and user input.

## Use Example
```js
// Simple Alert
Alert("Operation Successful!", (ok) => {
  console.log("Alert closed");
});

// Confirmation Dialog
AlertConfirm("Do you want to delete this item?", (isConfirmed) => {
  if (isConfirmed) {
    console.log("Deleted");
  }
});

// Input Dialog
AlertInput("Enter your name:", (value) => {
  if (value !== null) {
    console.log("User name:", value);
  }
}, "John Doe");
```

## Javascript Api
### Use of api:
```js
Alert(message, callback);
```

| Api Name | Method | Example | Extra |
| :--- | :--- | :--- | :--- |
| **Alert** | `Alert(message, callback)` | `Alert("Hello", cb)` | Standard alert dialog. |
| **Confirm** | `AlertConfirm(message, callback)` | `AlertConfirm("Sure?", cb)` | Returns true/false to callback. |
| **Input** | `AlertInput(message, callback, placeholder)` | `AlertInput("Name:", cb, "Type...")` | Returns input string or null. |
