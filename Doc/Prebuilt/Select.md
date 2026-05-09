## CarbonSelect Documentation

### Single Elements Select
```html
<CarbonSelect 
  Id="myCity_1" 
  Placeholder="Choose Country" 
  Data="USA,UK,Germany,Canada"
  Type="Filled">
</CarbonSelect>
```

### Multiple Elements Select
```html
<CarbonMultipleSelect 
  Id="myCity_2" 
  Placeholder="Choose Cities" 
  Data="New York,London,Berlin,Toronto,Tokyo"
  Type="Border">
</CarbonMultipleSelect>
```

---
### Attribute
 - Id
 - Type = Filled/Border
 - Placeholder
 - Data


### Api
`CarbonSelect.<api>`

| Name | Methods | Example |
| :--- | :--- | :--- |
| **Get Value** | `getSelect(id)` | `CarbonSelect.getSelect("myCity_1")` |
| **Set Value** | `setValue(id, value)` | `CarbonSelect.setValue("myCity_1", "USA")` |
| **Clear** | `unSet(id)` | `CarbonSelect.unSet("myCity_1")` |
| **Add Data** | `addData(id, dataArray)` | `CarbonSelect.addData("myCity_1", ["France", "Italy"])` |
| **Append Data** | `appendData(id, newData)` | `CarbonSelect.appendData("myCity_1", "Japan")` |
| **Remove Item** | `removeData(id, value)` | `CarbonSelect.removeData("myCity_1", "UK")` |
| **Remove All** | `removeAll(id)` | `CarbonSelect.removeAll("myCity_1")` |
| **Get All Options** | `getAll(id)` | `CarbonSelect.getAll("myCity_1")` |
| **Check Existence** | `checkExistData(id, value)` | `CarbonSelect.checkExistData("myCity_1", "USA")` |
| **Get Checked** | `getAllChecked(id)` | `CarbonSelect.getAllChecked("myCity_2")` |
| **Get Unchecked** | `getAllUnchecked(id)` | `CarbonSelect.getAllUnchecked("myCity_2")` |