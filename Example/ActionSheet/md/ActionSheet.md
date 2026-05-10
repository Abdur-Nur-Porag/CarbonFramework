# ActionSheet

ActionSheet is a prebuilt component for CarbonFramework that follows standard `Material Design 3` guidelines. It's perfect for presenting a set of choices to the user.

## Use Example
```jsx
<ActionSheet Name="mySheet" Position="Bottom" Notch="true" Elevation="5">
  <div class="padding">
    <h6>Select Action</h6>
    <button class="border" onclick="closeActionSheet('mySheet')">Cancel</button>
  </div>
</ActionSheet>
```

## Attribute Define:
1.  **Name** = Unique identifier for the ActionSheet.
2.  **Position** = Position of the sheet (Top / Bottom / Left / Right). Default is "Bottom".
3.  **Notch** = Boolean (true/false). Adds a visual notch at the top of the sheet.
4.  **Elevation** = Visual depth (0 to 10). Default is 2.

## Javascript Api
### Use of api:
```js
openActionSheet("mySheet");
```

| Api Name | Method | Example | Extra |
| :--- | :--- | :--- | :--- |
| **Open Sheet** | `openActionSheet(name)` | `openActionSheet("mySheet")` | Opens the ActionSheet by Name. |
| **Close Sheet** | `closeActionSheet(name)` | `closeActionSheet("mySheet")` | Closes the ActionSheet by Name. |
