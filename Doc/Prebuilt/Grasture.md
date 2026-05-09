#Gesture Doc
```html
<dialog id="left" class="left"></dialog>
<dialog id="right" class="right"></dialog>
<dialog id="bottom" class="bottom"></dialog>
<dialog id="top" class="top"></dialog>

```
```javascript

GestureManager.grastureTop({
    EdgeSize: "40px",
    Content: "top", // <-- Put the actual HTML ID of your panel here (without the #)
    OnOpen: () => ui("#top"),
    OnClose: () => ui("#top")
});

GestureManager.grastureBottom({
    EdgeSize: "40px",
    Content:"bottom",
    OnOpen: () => ui("#bottom"),
    OnClose: () => ui("#bottom")
});

GestureManager.grastureLeft({
    EdgeSize: "40px",
    Content: "left", // Clicking outside this ID will close it
    OnOpen: () => ui("#left"),
    OnClose: () => ui("#left")
});

GestureManager.grastureRight({
    EdgeSize: "40px",
    Content: "right", // Clicking outside this ID will close it
    OnOpen: () => ui("#right"),
    OnClose: () => ui("#right")
});

```