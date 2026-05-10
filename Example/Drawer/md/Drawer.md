# Drawer

Drawer is a Material Design 3 navigation component that slides in from the edge of the screen.

## Use Example
```jsx
<Drawer Name="mainMenu" Position="Left" Elevation="5">
  <div class="padding">
    <h4>Menu</h4>
    <nav>
      <a>Home</a>
      <a>Settings</a>
    </nav>
  </div>
</Drawer>
```

## Attribute Define:
1.  **Name** = Unique identifier for the Drawer.
2.  **Position** = Position of the drawer (Left / Right). Default is "Left".
3.  **Elevation** = Visual depth (0 to 10). Default is 5.

## Javascript Api
### Use of api:
```js
openDrawer("mainMenu");
```

| Api Name | Method | Example | Extra |
| :--- | :--- | :--- | :--- |
| **Open Drawer** | `openDrawer(name)` | `openDrawer("mainMenu")` | Opens the drawer by Name. |
| **Close Drawer** | `closeDrawer(name)` | `closeDrawer("mainMenu")` | Closes the drawer by Name. |
