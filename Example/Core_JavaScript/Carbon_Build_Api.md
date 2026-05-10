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
