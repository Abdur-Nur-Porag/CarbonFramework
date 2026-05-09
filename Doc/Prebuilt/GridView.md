# GridView
![gridview.png](/engine/preBuilt/GridView/gridview.png)
```html
<parent>
  <GridView Row="" Col="" id="">
   ...
  </GridView>
  
</parent>
```
### or 
```html
  <parent>
    <GridView Row="" Col="" id="">
      <ColumnSpan ColRange="">
       ...
      </ColumnSpan>
    </GridView>
  </parent>
```
### About <ColumnSpan>
This is marge multiple coulmn in single column.
Like colspan in table.
**important** when use item inside <ColumnSpan> add class name responsive.
#### Important Example
```html
  <parent>
    <GridView Row="" Col="" id="">
      <ColumnSpan ColRange="">
        <div class="responsive">...</div>
      </ColumnSpan>
     ...
    </GridView>
  </parent>
```
### Attribute List
  - Row=""
  - Col=""
  - GapTop=""
  - GapBottom=""
  - GapLeft=""
  - GapRight=""
  - GapX=""// Space between columns
  - GapY=""// Space between rows
 
### Example
```html
    <div style="height:100px;width:100%;">
        <GridView Row="2" Col="3"
        GapX="5px"
        GapY="5px"
        GapLeft="4px"
        GapRight="4px"
        GapTop="5px"
        >
            <Button></Button>
            <Button></Button>
            <Button></Button>
            <Button></Button>
            <Button></Button>
            <Button></Button>
            <ColumnSpan ColRange="3">
                <button class="responsive"></button>
            </ColumnSpan>
        </GridView>
    </div>


```

GridView must declear inside a parent.
Because Layout default height and width same as
parent height and width.

