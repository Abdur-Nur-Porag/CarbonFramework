# Fab (Floating Action Button)

FABs represent the primary action of a screen. This component supports expandable FABs with multiple sub-actions.

## Use Example
```jsx
<fab>
  <fabbutton><i>add</i></fabbutton>
  <fabitem data-action="camera"><i>photo_camera</i></fabitem>
  <fabitem data-action="gallery"><i>image</i></fabitem>
</fab>
```

## Structure Define:
1.  **fab** = The main container.
2.  **fabbutton** = The primary floating button.
3.  **fabitem** = Sub-action items that appear when the FAB is clicked.

## Attribute Define:
1.  **data-action** = Custom identifier for the action triggered by the sub-item.
