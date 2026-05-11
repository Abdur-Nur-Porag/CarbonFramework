## 😎😎 Welcome
You are too Smart 👍.
Let's  go to deep.
## Core Knowledge
CarbonFramework use `PageView` for making `spa(single page application)`. 
As 👨‍🎓 learns you need to know it.
### Let's go deep
Open `Main/Views/HomeView.jsx` and write(replace Whole code with it)
```jsx
var HomeView=(
<PageView Name="HomeView">
	<App>
	<AppBody>
	<p>Hello,From HomeView</p>
	<button onclick="Carbon.openPageView('SettingsView')">go SettingsView</button>
	</AppBody>
	</App>
</PageView>
);
{/*----------------------------*/}
var SettingsView=(
<PageView Name="SettingsView">
	<App>
	<AppBody>
			<p>
			Hello,From Settings View
			</p>
			<button onclick="Carbon.openPageView('HomeView')">go home</button>
	</AppBody>
	</App>
</PageView>
);
```
Then open `Main/Views/MainView.jsx` then replace whole file with:
```jsx
var MainView=(
<div>
	<HomeView/>
	<SettingsView/>
</div>
);
```
😍 you successful set you multiple view. But this is not visible now. For add Visibility we need add some `javascript`.
❓
 Open `Main/Script/MainView.js` add this 
 ```js
 
Carbon.PageView({
  Name:"HomeView",
  Initial:true,
  OnScript(){
  }
})
Carbon.PageView({
  Name:"SettlingsView",
  Initial:false,
  OnScript(){
    
  }
})
 ```
👍😎 Now open terminal  run commands
1. cd <your project>
2. node CarbonCli.js --sync
3. node LiveServer.js
4. Open [http://localhost:3000](http://localhost:3000)
Then see.

## Go Deep Core
Here every seperate pageview contain there own items. PageView must contain App,AppBody.
Another's way: you can enable pageview but I do not recommended that. You use (Initial="true") attribute inside pageview tag to something visible. But Avoid it. Use javascript methods.

# Extra
## Attribute Define:
### AppBody
1.  **Type** = Scroll direction ("VScroll" or "HScroll").
2.  **ScrollBar** = Boolean ("true"/"false").
```html
<AppBody Type="VScroll" ScrollBar="true/false">
With ScrollBar
</AppBody>
Or
<AppBody>No Scrollbar</AppBody>
```

### PageView
1.  **Name** = Unique name for the page.
2.  **active** = (Internal) Set to "true" when page is visible.

## Javascript Api
### Use of api:
```js
Carbon.PageView(config);
Carbon.openPageView("name");
```

| Api Name          | Method                      | Example                           | Extra                                     |
| :---------------- | :-------------------------- | :-------------------------------- | :---------------------------------------- |
| **Register Page** | `Carbon.PageView(config)`   | `Carbon.PageView({...})`          | Registers a page and its lifecycle hooks. |
| **Open Page**     | `Carbon.openPageView(name)` | `Carbon.openPageView("settings")` | Switches view to the specified page.      |

## Config Object Properties:
1.  **Name** = Matching name attribute in HTML.
2.  **Initial** = Boolean. If true, this page loads first.
3.  **OnStart** = Async hook called before the page shows.
4.  **OnScript** = Async hook called after the page is visible.
5.  **OnFinished** = Async hook called when leaving the page.

`