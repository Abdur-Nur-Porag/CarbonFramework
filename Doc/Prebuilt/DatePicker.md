## CarbonDatePicker Documentation

### Date Picker Select
```html
<CarbonDatePicker 
  Id="event_1" 
  Placeholder="Event Date" 
  Type="Border"
  Icon:"Left/Right"
  >
</CarbonDatePicker>

<CarbonDatePicker 
  Id="birth_1" 
  Placeholder="Birth Date" 
  Type="Filled"
  Icon:"Left/Right"
  >
</CarbonDatePicker>
```

---
### Attribute
 - Id
 - Type = Filled/Border
 - Placeholder
 - Icon=Left/Right

### Api
`CarbonDatePicker.<api>`

| Name | Methods | Example |
| :--- | :--- | :--- |
| **Get Date** | `getSelectDate(id)` | `CarbonDatePicker.getSelectDate("event_1")` |
| **Set Today** | `goToday(id)` | `CarbonDatePicker.goToday("event_1")` |
| **Reset View** | `init(id)` | `CarbonDatePicker.init("event_1")` |

---

### Internal Methods (System Use)
| Method | Description |
| :--- | :--- |
| `changeView(id, mode)` | Switches between `calendar`, `month`, and `year` views. |
| `changeMonth(id, dir)` | Steps the calendar view forward (1) or backward (-1). |
| `confirmSelection(id)` | Saves the temporary selected date to the input field. |