# PixelEngine 
Carbon App use `PixelGridEngine` for layout management.
This engine use Hybrid approch of combinations with canvas and dom 
manipulation. It uses canvas to draw layout. Dom use `Target and Hit`
formula to drawlayout. This is simmilar to `Flutter` but not fully.

This engine automatically detected where `Engine` is defined.
## Installation
There is nothing to do for implementing it. Because `Carbon Framework`
`Engine/Prebuilt` containing this engine.
## Using Of Engine
Syntex:
```html
<parent style="height:must;width:must;">
  <PixelEngine>
    <PixelGrid x="" y="" rowspan="" colspan=""></PixelGrid>
  </PixelEngine>
</parent>

```
### Important
  - Must declear inside `<parent>`
  - If your code contain multiple `engine`. You must wrap every engine inside different parent.
  - For `SPA Application` use multiple different `parent` for different `engine`
  - For `Non SPA Application` use `single parent` and `engine`
  - 
### Caution
  Be carefull about `using engine`.
Parent must `contain` `height`&`width`
### Carbon Framework Application
If you want use engine inside `PageView`. Remember Every `PageView` will contain single engine and parent.
Example:
```jsx
//MainView

var Main=(
  
    <PageView Name="MainView">
      <PixelEngine>
        <PixelGrid x="5" y="20" colspan="35" rowspan="20" style="background-color:#203665;">
            <h1 style="margin: 0; padding: 20px;">Engine 3</h1>
        </PixelGrid>
        <PixelGrid x="5" y="39.9" colspan="35" rowspan="40" style="background-color:#14213D">
            <h1 style="margin: 0; padding: 20px;">Block 1</h1>
        </PixelGrid>
        <PixelGrid x="40" y="20" colspan="35" rowspan="40" style="background-color:#FFBE0B">
            <div style="height:100%; color: black; padding: 20px;" class="scroll">
                <h1 style="margin-top: 0;">Name List</h1>
                <p>User A</p><p>User B</p><p>User C</p>
            </div>
        </PixelGrid>
        <PixelGrid x="40" y="60" colspan="35" rowspan="20" style="background-color:#06848F">
            <div style="padding: 20px;">
                <input placeholder="Enter Name" style="padding: 10px; border-radius: 5px; border: none; width: 80%;"/>
                <button onclick="Carbon.openPageView('2ndView')">2ndView</button>
          
            </div>
        </PixelGrid>
    </PixelEngine>
    </PageView>
    <PageView Name="2ndView">
      <PixelEngine>
          <PixelGrid x="0" y="0" colspan="100" rowspan="80" style="background-color:green">
              <article ScrollBar="true" Type="VScroll" style="width:100%;height:100%;border-radius:0px;">
                  <h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello 10</h1>
              </article>
          </PixelGrid>
          <PixelGrid class="scroll" x="0" y="79.9">
             <button>Bottom</button>
         </PixelGrid>
      </PixelEngine>
    </PageView>
  
)

```