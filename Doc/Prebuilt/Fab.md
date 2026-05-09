## Fab
```html
       <Fab name="MainFab">
        <FabBody>
            <FabItem>Create New <FabSpace></FabSpace> 📝</FabItem>
            <FabItem>Upload File <FabSpace></FabSpace> ☁️</FabItem>
            <FabItem>Settings <FabSpace></FabSpace> ⚙️</FabItem>
        </FabBody>
        <FabButton></FabButton>
    </Fab>
    
    <script>
        FabActive("MainFab")
    </script>
```
## Trigger
To `active` and `visible` `Fab` must call `trigger`
```js
//trigger
If you use inside `pageview` trigger is optional.
But others any where trigger is must.
FabActive("Name")
```
### Important
If  `PageView` contain `Fab` and `PixelEngine`

✅ you must declear `Fab` outside of `PixelEngine`.

❌ Do not use inside `PixelEngine`
```html
❌ Wrong :
<PageView>
    <PixelEngine>
        <PixelGrid></PixelGrid>
        
        <Fab></Fab>
        
    </PixelEngine>
</PageView>
```
```html
✅Right

<PageView>
    <PixelEngine>
        <PixelGrid></PixelGrid>
    </PixelEngine>
    
    <Fab></Fab>
</PageView>

```