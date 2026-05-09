## CarbonTimePicker Documentation

### Time Picker Select
```html
<CarbonTimePicker 
  Id="meeting_1" 
  Placeholder="Select Time" 
  Type="fill"
  Format:"24"
  Icon:"Left/Right"
  >
</CarbonTimePicker>

<CarbonTimePicker 
  Id="alarm_1" 
  Placeholder="Set Alarm" 
  Type="border"
  Format:"12"
  Icon:"Left/Right"
  >
</CarbonTimePicker>
```

---
### Attribute
 - Id
 - Type = fill/border
 - Placeholder
 - Format =24/12
 - Icon=Left/Right
### Api
`CarbonTimePicker.<api>`

| Name | Methods | Example |
| :--- | :--- | :--- |
| **Get Time** | `getTime(id)` | `CarbonTimePicker.getTime("meeting_1")` |
| **Set Time** | `setTime(id, timeStr)` | `CarbonTimePicker.setTime("meeting_1", "10:30 AM")` |
| **Clear** | `removeTime(id)` | `CarbonTimePicker.removeTime("meeting_1")` |