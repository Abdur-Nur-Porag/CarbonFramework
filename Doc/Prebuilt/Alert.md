## Alert
3 type of alert:
  - Alert
  - AlertConfirm
  - AlertInput

## Alert
```js
Alert("This is Alert")
```
##  AlertConfirm
```js
AlertConfirm("Are you sure you want to delete this file?", function(result) {
    if (result === true) {
        // User clicked OK
        console.log("File deleted.");
    } else {
        // User clicked Cancel
        console.log("Action cancelled.");
    }
});
```
## AlertInput
```js
AlertInput("Please enter your name", function(name) {
    if (name) {
        Alert("Hello, " + name + "!");
    } else {
        console.log("User cancelled or left name blank.");
    }
}, "e.g. John Doe");
```