# PageView
This prebuilt component of Carbon Framework.
## Use
```html

  <PageView Name="ViewName">
    <App>
      {/*App Contents*/}
    </App>
  </PageView>

```
Every pageview must call by js to start working.
```js
Carbon.PageView({
  Name: PageViewName,
  Initial: true/false,
  OnStart:()=>{},
  OnScript:()=>{},
  OnFinished:()=>{},
})
```
About attribute:
- Name : This contain pageview name
- Initial : True means first page. Default all is false. False means hidden.
- OnStart: This contain function which execute before all ui load.
- OnScript: This contain all function this execute after all ui load.
- OnFinished: This execute when you move to one page to anothers page.
