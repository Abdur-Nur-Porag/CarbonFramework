# PageView & Router

The PageView system provides a robust routing and page management framework for Carbon apps.

## Use Example
```jsx
<App>
  <AppBody Type="VScroll" ScrollBar="true">

    <PageView Name="home">
      <h1>Welcome Home</h1>
      <button onclick="openPageView('settings')">Go to Settings</button>
    </PageView>

    <PageView Name="settings">
      <h1>Settings</h1>
      <button onclick="openPageView('home')">Back</button>
    </PageView>

  </AppBody>
</App>

<script>
Carbon.PageView({
  Name: "home",
  Initial: true,
  OnStart: () => console.log("Home starting..."),
  OnScript: () => console.log("Home ready.")
});

Carbon.PageView({
  Name: "settings"
});
</script>
```

## Attribute Define:
### AppBody
1.  **Type** = Scroll direction ("VScroll" or "HScroll").
2.  **ScrollBar** = Boolean ("true"/"false").

### PageView
1.  **Name** = Unique name for the page.
2.  **active** = (Internal) Set to "true" when page is visible.

## Javascript Api
### Use of api:
```js
Carbon.PageView(config);
openPageView("name");
```

| Api Name | Method | Example | Extra |
| :--- | :--- | :--- | :--- |
| **Register Page** | `Carbon.PageView(config)` | `Carbon.PageView({...})` | Registers a page and its lifecycle hooks. |
| **Open Page** | `openPageView(name)` | `openPageView("settings")` | Switches view to the specified page. |

## Config Object Properties:
1.  **Name** = Matching name attribute in HTML.
2.  **Initial** = Boolean. If true, this page loads first.
3.  **OnStart** = Async hook called before the page shows.
4.  **OnScript** = Async hook called after the page is visible.
5.  **OnFinished** = Async hook called when leaving the page.
