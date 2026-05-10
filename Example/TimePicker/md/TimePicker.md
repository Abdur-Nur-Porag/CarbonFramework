![Time Picker](../timepicker.png)
TimePicker is a prebuilt component for CarbonFramework following standard `Material Design 3` principles.

## Use Example
```jsx
<CarbonTimePicker
  Id="meeting_1"
  Placeholder="Select Time"
  Type="fill"
  Format="24"
  Icon="Right"
>
</CarbonTimePicker>

<CarbonTimePicker
  Id="alarm_1"
  Placeholder="Set Alarm"
  Type="border"
  Format="12"
  Icon="Left"
>
</CarbonTimePicker>
```

## Attribute Define:
1.  **Id** = Unique identifier for the input.
2.  **Placeholder** = Label text.
3.  **Type** = Visual style ("Filled" or "Border").
4.  **Icon** = Icon position ("Left" or "Right").
5.  **Format** = Time format ("12" or "24").

## Javascript Api
### Use of Api
```js
CarbonTimePicker.<api>
```

| Api Name | Method | Example | Extra |
| :--- | :--- | :--- | :--- |
| **Get Time** | `getTime(id)` | `CarbonTimePicker.getTime("meeting_1")` | Returns currently selected time string. |
| **Set Time** | `setTime(id, timeStr)` | `CarbonTimePicker.setTime("id", "10:30 AM")` | Programmatically sets the time. |
| **Clear** | `removeTime(id)` | `CarbonTimePicker.removeTime("meeting_1")` | Resets the time picker. |
#verified 