# ActionSheet Documention
```html

        <button class="btn" onclick="openActionSheet('MainSheet')">Open Elevation 2</button>
        <button class="btn" onclick="openActionSheet('TopAlert')">Open Elevation 10</button>

        <ActionSheet Name="MainSheet" Position="Bottom" Notch="true" Elevation="2">
          Top
           
        </ActionSheet>

        <ActionSheet Name="TopAlert" Position="Top" Notch="true" Elevation="10">
            Bottom
        </ActionSheet>
```
## trigger
- openActionSheet(name)
## Position
- top
- bottom
## Notch
- true
- false
## Elevation
- 0(min) to 10(max)
