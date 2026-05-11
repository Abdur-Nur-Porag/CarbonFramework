# PageView & Router

The PageView system provides a robust routing and page management framework for Carbon apps.

## ⚠️Do you complete your basic❓
If not go to [basic](Tutorial/Hello,World)
## Use Example
```jsx
<PageView Name="home">
	<App>
		<AppBar></AppBar>
		<AppBody>Home</AppBody>
		<BottomBar></BottomBar>
	</App>
</PageView>
<PageView Name="settings">
	<App>
		<AppBar></AppBar>
		<AppBody>Home</AppBody>
		<BottomBar></BottomBar>
	</App>
</PageView>

<script>
Carbon.PageView({
  Name: "home",
  Initial: true,
  OnStart: () => console.log("Home starting..."),
  OnScript: () => console.log("Home ready.")
});

Carbon.PageView({
  Name: "settings"
  //default inital is false
});
</script>
```

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
#verified 