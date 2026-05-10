Carbon Build Api is one of the core framework of Carbon. Which handle all opration of `dom create/handle/event`.
This is `easy` then others dom framework.
## CoreConcept
	1. create(name)
	2.  $(#id/.calss/tag)
## Use of create()
`create()` use for creating any dom content. Like `button/text etc`.
```js
create("button")
.text("MyButton")
```
### Use of $()
This is short form of `document.getElementsById`
&&`document.getElementsByTagName`&& `document.getElementsByClassName`.

### Api
`create` and `$()` support same api.
```js
create(tagname).<apiName>(values)
//or
$(#id).<apiName>(values)
```

### ID Api

| Api Name             | Method       | Example           | Extra                              |
| -------------------- | ------------ | ----------------- | ---------------------------------- |
| Set id               | .id(id name) | .id("homeButton") | X                                  |
| Remove Id            | .removeId()  | .removeId()       | Automatic delete id from that tag. |
| Checking Id Is Exist | .isExistId() | .isExistId()      | Return `true`/`false`                  |
| Getting Id Name      | .getId()     | .getId()          | Return `value` of `id` attribute   |
|                      |              |                   |                                    |

### Class Api
| Api Name                 | Method                 | Example                       | Extra                                           |
| ------------------------ | ---------------------- | ----------------------------- | ----------------------------------------------- |
| Set class                | .class([values,..])    | .class(["link","LargeText"])  |                                                 |
| Append class             | .addClass([values,..]) | .addClass(["newClass","big"]) | This way append new class in existing class     |
| Remove Class             | .removeClass(name)     | .removeClass("newClass")      | This way remove a single class fron class array |
| Remove All Class         | .removeAllClass()      | .removeAllClass()             | Remove all class from tag                       |
| Check any class is exist | .isClassExist(name)    | .isClassExist("newClass")     | Return `true`/`false`                           |
| Get all  class           | .getAllClass()         | .getAllClass()                | Return a `array` with all class                   |
|                          |                        |                               |                                                 |
|                          |                        |                               |                                                 |

### Attributes Api

| Api Name               | Method                     | Example                                     | Extra                                         |
| ---------------------- | -------------------------- | ------------------------------------------- | --------------------------------------------- |
| Set Multiple Attrs     | .attrs({key: value})       | .attrs({type: "text", placeholder: "Name"}) | Same as .addAttr()                            |
| Add Attributes         | .addAttr({key: value})     | .addAttr({disabled: "true"})                |                                               |
| Remove Attributes      | .removeAttr(name/array)    | .removeAttr(["disabled", "placeholder"])    |                                               |
| Update Attribute Value | .updateAttrValue([k,v],..) | .updateAttrValue(["type", "password"])      |                                               |
| Get Attribute Value    | .getAttrValue(name)        | .getAttrValue("type")                       | Return the value of specific attribute        |
| Get All Attributes     | .getAllAttr()              | .getAllAttr()                               | Return an object with all attribute key-value |

### Style Api

| Api Name     | Method            | Example                          | Extra                                     |
| ------------ | ----------------- | -------------------------------- | ----------------------------------------- |
| Set Style    | .style({prop: v}) | .style({color: "red"})           | Same as .addStyle()                       |
| Add Style    | .addStyle({p: v}) | .addStyle({fontSize: "20px"})    |                                           |
| Remove Style | .removeStyle()    | .removeStyle()                   | Removes the entire style attribute        |
| Get Style    | .getStyle(prop)   | .getStyle("color")               | Return computed style value               |

### Event Api

| Api Name     | Method                  | Example                                  | Extra                                |
| ------------ | ----------------------- | ---------------------------------------- | ------------------------------------ |
| Add Event    | .event(name, fn, opt)   | .event("mouseover", () => {})            |                                      |
| Remove Event | .off(name, fn, opt)     | .off("click", myFunc)                    |                                      |
| On Click     | .onClick(fn)            | .onClick(() => console.log("hi"))        | Shortcut for .event("click", fn)     |
| Toggle Event | .toggleEvent({options}) | .toggleEvent({WhenTrue: f1, WhenFalse: f2}) | Custom toggle logic on event (default click) |

### Form Api

| Api Name      | Method           | Example         | Extra                                     |
| ------------- | ---------------- | --------------- | ----------------------------------------- |
| Check         | .check(bool)     | .check(true)    | For checkbox/radio                        |
| Uncheck       | .uncheck()       | .uncheck()      |                                           |
| Toggle Check  | .toggleCheck()   | .toggleCheck()  |                                           |
| Is Checked    | .isChecked()     | .isChecked()    | Returns boolean                           |
| Value         | .val(value)      | .val("Hello")   | Sets or gets (if no args) the input value |

### Content Api

| Api Name | Method      | Example           | Extra           |
| -------- | ----------- | ----------------- | --------------- |
| Set HTML | .html(html) | .html("<b>Hi</b>") | Sets innerHTML  |
| Set Text | .text(text) | .text("Hello")    | Sets innerText  |

### Tree Api

| Api Name        | Method            | Example                   | Extra                                         |
| --------------- | ----------------- | ------------------------- | --------------------------------------------- |
| Add to Target   | .add(target)      | .add("#container")        | Append current element to target              |
| Append To       | .appendTo(target) | .appendTo(otherEl)        | Same as .add()                                |
| Add Children    | .children(input)  | .children([child1, "Hi"]) | Accepts element, buildAPI, string, or array   |
| Remove Children | .removeChildren() | .removeChildren()         | Removes all child nodes                       |
| Clear           | .clear()          | .clear()                  | Same as .removeChildren()                     |

### Visibility Api

| Api Name | Method         | Example         | Extra                               |
| -------- | -------------- | --------------- | ----------------------------------- |
| Show     | .show(display) | .show("flex")   | Sets display (default "block")      |
| Hide     | .hide()        | .hide()         | Sets display to "none"              |
| Toggle   | .toggle(type)  | .toggle()       | Toggles between show and hide       |

### Utility & Plugin Api

| Api Name       | Method               | Example                              | Extra                                      |
| -------------- | -------------------- | ------------------------------------ | ------------------------------------------ |
| Use Plugin     | .use(fn)             | .use((api) => {})                    | Executes function with current API instance|
| Ripple Effect  | .ripple({options})   | .ripple({duration: 1000})            | Adds material ripple effect on click       |
| Set Background | .setBackground(url)  | .setBackground("img.png")            | Sets background image with cover fit       |
| Set Font       | .setFont(name, url)  | .setFont("Roboto", "google-font-url")| Sets font-family and optionally links font |
