# Carbon Compiler
### Do you know?
**what `transcompiler` Carbon Framework use?**
 Carbon Framework use own built in transcompiler  names `CarbonCompiler`.
 This is based on `Lithium Compiler Project`.
 Currently CarbonComoiler use its `3.2v` for compiling and parsing.
 
 It has also support `CarbonFormat` which helps to render `js` any where inside html like `php`.
 It is simmilar to `JSX` -> 40-45%

## Processes
```txt
{jsx}->[praser]->raw html
```
General Compiler use like `babble/preact/vue/angular` use `DOM manipulation` format
but carbon use diractly `{source}->{compiler}->{raw html}`. We do not use `dom manipulation`.
So, all codes combined and make bundle in single file.
(Bundle is larger then 3mb).

Working process:
```txt
(General For Script & Style & Views folder file)
{source}->{read jsx}->{compile to html}->{raw html}
{source}->{read css}->{wait}->{wait}->{is html ready}-true->{use css}
                                                         -false->{wait}
{source}->{read js}->{wait}->{wait}->{is html ready}-true->{use js}
                                                         -false->{wait}
(PreScript load before)
(PostScript load after)
                                                     
```
## Use Example
General Syntex.
```jsx
const myView=(
 <App>
  <AppBody>
   <Button>Hello</Button>
  </AppBody>
 </App>
)
```
Use Style Syntex.
```jsx
var myStyle={
 _h1:{
  color:"red",
 },
 _p1:{
  color:"green"
 }
}

var myView=(
 <App>
  <AppBody>
   <h1 style={myStyle._h1}>Hello,World</h1>
   <p style={myStyle._p1}>This is small paragraph</p>
  </AppBody>
 </App>
)
```
Making Componens
```jsx
var form=(
 <Div>
  <input/>
  <input/>
 </Div>
)
var myView=(
 <App>
  <AppBody>
   <VCenter>MyForm</VCenter>
    {/*FORM HERE*/}
    <form/>
  </AppBody>
 </App>
)
```
Use Object
```jsx
var info={
 ip:"123.23.90.8:8070",
 name:"local",
}
var myView=(
 <App>
  <AppBody>
    Server Address:<$info.ip/>
    Name:<$info.name/>
  </AppBody>
 </App>
)
```
Use Comments
Carbon Support Comments as `jsx` style like `{/**/}`