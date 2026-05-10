# Select

Select and MultipleSelect components provide Material Design 3 style dropdown menus with search/selection dialogs.

## Use Example
```jsx
<CarbonSelect
  Id="single_1"
  Placeholder="Select Fruit"
  Type="Border"
  Data="Apple, Banana, Orange"
>
</CarbonSelect>

<CarbonMultipleSelect
  Id="multi_1"
  Placeholder="Select Skills"
  Type="Filled"
  Data="HTML, CSS, JS, PHP"
>
</CarbonMultipleSelect>
```

## Attribute Define:
1.  **Id** = Unique identifier.
2.  **Placeholder** = Label text.
3.  **Type** = "Filled" or "Border".
4.  **Data** = Comma-separated initial options.

## Javascript Api
### Use of api:
```js
CarbonSelect.<api>
```

| Api Name | Method | Example | Extra |
| :--- | :--- | :--- | :--- |
| **Get Value** | `getSelect(id)` | `CarbonSelect.getSelect("id")` | Returns selected string. |
| **Set Value** | `setValue(id, val)` | `CarbonSelect.setValue("id", "Apple")` | Sets current selection. |
| **Clear** | `unSet(id)` | `CarbonSelect.unSet("id")` | Resets the select field. |
| **Add Data** | `appendData(id, arr)` | `CarbonSelect.appendData("id", ["New"])` | Appends new options. |
| **Get Checked** | `getAllChecked(id)` | `CarbonSelect.getAllChecked("id")` | Returns array of selected items. |
#verified 