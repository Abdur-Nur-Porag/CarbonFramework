
![Date Picker](datepicker.png)
DatePicker is prebuilt component for CarbonFramework. This is following standard `Material Design 3`. 
## Use Example
```jsx
const HomeView=(
<>
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
);
</>
```
## Attribute Define:
1.  Id = Id
2.  Placeholder = Name
3. Type = Filled/Border
4. Icon = Left/Right
## Javascript Api
### Use of api:
```js
CarbonDatePicker.<api>
```

| Name           | Methods             | Example                                     |
| :------------- | :------------------ | :------------------------------------------ |
| **Get Date**   | `getSelectDate(id)` | `CarbonDatePicker.getSelectDate("event_1")` |
| **Set Today**  | `goToday(id)`       | `CarbonDatePicker.goToday("event_1")`       |
| **Reset View** | `init(id)`          | `CarbonDatePicker.init("event_1")`          |
