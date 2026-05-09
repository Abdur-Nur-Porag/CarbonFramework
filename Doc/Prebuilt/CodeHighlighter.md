# CodeHighlighter 
# Syntex of JS
```js
CodeHighlighter(id)
.syntax(language)
.code(`code`);
    

```
## Example
```html
<div id="exampleJs"></div>✅must
<script>
  CodeHighlighter('exampleJs').syntax('javascript').code(`
        function runAPI() {
            console.log("Injected into parent div!");
        }
    `);
    
</script>
```
