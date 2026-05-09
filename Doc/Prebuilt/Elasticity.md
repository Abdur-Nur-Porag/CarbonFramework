## ElasticityEffect Documentation
```html
<div id="item-alpha" style="width: 300px; height: 180px; background: #fff;">
    <div class="elastic-content">
        <h3>Locked Content</h3>
        <p>I stay the same size</p>
    </div>
</div>
```

### Script Initialization
```javascript
// Initialize the effect on an element
ElasticityEffect('item-alpha')
    .maxSize(400)    // Maximum height in pixels
    .friction(1200); // Resistance to pull (higher = stiffer)
```

### API Reference
`ElasticityEffect(id).<method>`

| Name | Methods | Example |
| :--- | :--- | :--- |
| **Max Stretch** | `maxSize(px)` | `.maxSize(500)` |
| **Pull Resistance** | `friction(value)` | `.friction(1000)` |
