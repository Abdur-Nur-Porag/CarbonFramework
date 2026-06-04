# Gesture

GestureManager allows you to handle edge-swiping gestures (Top, Bottom, Left, Right) to trigger actions like opening or closing menus.

## Use Example
```js
GestureManager.gestureLeft({

  PageView:"HomeView",
  Content: "main-drawer",
  EdgeSize: 50,
  OnOpen: () => {
    openDrawer("mainMenu");
  },
  OnClose: () => {
    closeDrawer("mainMenu");
  },
  OnBackdrop:()=>{
  	closeDrawer("mainMenu");
  }
});
```

## Javascript Api
### Use of api:
```js
GestureManager.gestureLeft(config);
```

| Api Name           | Method                   | Example                            | Extra                                   |
| :----------------- | :----------------------- | :--------------------------------- | :-------------------------------------- |
| **Top Gesture**    | `gestureTop(config)`    | `GestureManager.gestureTop(c)`    | Handles downward swipe from top edge.   |
| **Bottom Gesture** | `gestureBottom(config)` | `GestureManager.gestureBottom(c)` | Handles upward swipe from bottom edge.  |
| **Left Gesture**   | `gestureLeft(config)`   | `GestureManager.gestureLeft(c)`   | Handles rightward swipe from left edge. |
| **Right Gesture**  | `gestureRight(config)`  | `GestureManager.gestureRight(c)`  | Handles leftward swipe from right edge. |

## Config Object Properties:
1. PageView = PageView name
2.  **Content** = Id of elements
3.  **EdgeSize** = Detection zone size in pixels. Default is 40.
4.  **OnOpen** = Callback function triggered on "Open" gesture.
5.  **OnClose** = Callback function triggered on "Close" gesture.
6. OnBackdrop = CallNack function triggered on "Backdrop" gesture.
>[!Danger]
PageView is optional becuase unless this will available in globally.

#verified 