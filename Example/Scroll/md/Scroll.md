# Scroll (Custom Scrollbar)

The Scroll system automatically applies Material Design styled scrollbars to elements.

## Use Example
```jsx
<div ScrollBar="true" Type="VScroll" style="height: 300px; overflow: auto;">
  <!-- Long content -->
</div>
```

## Attribute Define:
1.  **ScrollBar** = Set to "true" to enable the custom scrollbar on this element.
2.  **Type** = Scroll orientation:
    - `"VScroll"`: Vertical scrollbar.
    - `"HScroll"`: Horizontal scrollbar.
    - `"VScroll HScroll"`: Both.

## Styling
Custom scrollbars use the `.md-scrollbar-track` class for styling. They auto-hide when not in use.
#verified 