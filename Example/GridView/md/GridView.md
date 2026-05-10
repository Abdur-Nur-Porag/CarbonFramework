# GridView

GridView is a responsive layout component based on CSS Grid, allowing easy column and row management.

## Use Example
```jsx
<GridView Row="2" Col="3" GapX="10" GapY="10">
  <div>Item 1</div>
  <div>Item 2</div>
  <ColumnSpan ColRange="2">
    <div>I span 2 columns</div>
  </ColumnSpan>
</GridView>
```

## Attribute Define:
### GridView
1.  **Row** = Number of rows.
2.  **Col** = Number of columns.
3.  **GapX** = Horizontal gap between items (px or %).
4.  **GapY** = Vertical gap between items (px or %).
5.  **GapTop/Bottom/Left/Right** = Padding for the grid container.

### ColumnSpan
1.  **ColRange** = Number of columns this item should span.
