# Gesture

GestureManager allows you to handle edge-swiping gestures (Top, Bottom, Left, Right) to trigger actions like opening or closing menus.

## Use Example
```js
GestureManager.grastureLeft({
  Content: "#main-drawer",
  EdgeSize: 50,
  OnOpen: () => {
    console.log("Gesture: Opening drawer");
    openDrawer("mainMenu");
  },
  OnClose: () => {
    console.log("Gesture: Closing drawer");
    closeDrawer("mainMenu");
  }
});
```

## Javascript Api
### Use of api:
```js
GestureManager.grastureLeft(config);
```

| Api Name | Method | Example | Extra |
| :--- | :--- | :--- | :--- |
| **Top Gesture** | `grastureTop(config)` | `GestureManager.grastureTop(c)` | Handles downward swipe from top edge. |
| **Bottom Gesture** | `grastureBottom(config)` | `GestureManager.grastureBottom(c)` | Handles upward swipe from bottom edge. |
| **Left Gesture** | `grastureLeft(config)` | `GestureManager.grastureLeft(c)` | Handles rightward swipe from left edge. |
| **Right Gesture** | `grastureRight(config)` | `GestureManager.grastureRight(c)` | Handles leftward swipe from right edge. |

## Config Object Properties:
1.  **Content** = Selector of the element to target (fixes focus outlines).
2.  **EdgeSize** = Detection zone size in pixels. Default is 40.
3.  **OnOpen** = Callback function triggered on "Open" gesture.
4.  **OnClose** = Callback function triggered on "Close" gesture.
#verified 