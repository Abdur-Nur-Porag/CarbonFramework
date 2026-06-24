# Carbon Compiler
### Do you know?
**what `transcompiler` Carbon Framework use?**
 Carbon Framework use own built in transcompiler names `CarbonCompiler`.
 This is based on `Lithium Compiler Project`.
 Currently CarbonCompiler use its `3.2v` for compiling and parsing.

 It has also support `CarbonFormat` which helps to render `js` any where inside html like `php`.
 It is simmilar to `JSX` -> 40-45%

CarbonCompiler is shipped as a single Node CLI file: `CarbonCli.js`. It is responsible for three different jobs:
1.  **CarbonFormat** — parses/stringifies the `Carbon.build`, `Carbon.package`, `Carbon.main` project-manifest files (a custom YAML-like format).
2.  **Lithium Engine** — turns your `.jsx` Views into raw HTML (no virtual DOM, no diffing).
3.  **Carbon CLI** — the `node CarbonCli.js <command>` tool that syncs your folders, builds `index.html`, bundles JS/CSS, scaffolds new pages, and optionally encrypts the output.

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

## Project Manifest Files (CarbonFormat)
Before compiling, CarbonCli reads three manifest files from the project root:

| File | Describes folder | Root key |
| :--- | :--- | :--- |
| `Carbon.build` | `Engine/` | `Engine` |
| `Carbon.package` | `Package/` | `Package` |
| `Carbon.main` | `Main/` | `Main` |

These use **CarbonFormat**, a small indentation-based syntax — not JSON:
- `:Name` starts a folder/section.
- `- file.js` lists a file inside the current section.
- `- *null` marks an intentionally empty folder.
- `//comment` is a comment line (ignored).
- Indentation (any consistent whitespace) defines nesting, the same way Python uses it.

Example (`Carbon.main`):
```txt
:Main
  :PreScript
    - Themes.js
  :Script
    - MainView.js
    - ActionSheetView.js
  :Style
    - MainStyle.css
  :Views
    - MainView.jsx
    - ActionSheetView.jsx
  :PostScript
    - PixelGrid.js
  :TopScript
    - top.js
  :BottomScript
    - bottom.js
```
Running `--build-json` (or any build command) converts all three manifests into a single `combined.json`, shaped as:
```json
{
  "Build":   { "Engine": { "...": "..." } },
  "Package": { "Package": { "...": "..." } },
  "Main":    { "Main": { "...": "..." } }
}
```
`combined.json` is what every later build step (`buildHTML`, bundling, encryption) actually reads from — it is the single source of truth for "where are my files."

## CLI Commands
Run with `node CarbonCli.js <command>`.

### Build Commands
| Command | What it does |
| :--- | :--- |
| `--carbon-framework --build` | Full build: regenerates `combined.json`, then compiles every View and writes `index.html`. |
| `--build-json` | Only regenerates `combined.json` from the three manifest files. |
| `--build-css` | Builds `combined.json`, then concatenates every CSS file (Engine → Prebuilt → Package → Main, in that order) into `bundle.css`. |
| `--build-js` | Builds `combined.json`, then concatenates every JS/JSX file (TopScript → Engine Core → Prebuilt → Engine Themes → Package Script → Main Themes → PreScript → Script → PostScript → BottomScript) into `bundle.js`. |

### Sync Command
| Command | What it does |
| :--- | :--- |
| `--sync` | Scans the physical `Package/`, `Engine/`, `Main/` folders on disk and merges any new/removed files back into `Carbon.package`, `Carbon.build`, `Carbon.main`. Existing manual file **order is preserved** — new files are appended at the bottom of their section, deleted files are dropped, and the rest stays exactly where you put it. |

### View Generator
| Command | What it does |
| :--- | :--- |
| `--create-view <Name>` | Scaffolds a new page: <br>• `Main/Views/<Name>.jsx` — a `PageView` boilerplate wrapped in `<App><AppBody><VCenter>...` <br>• `Main/Script/<Name>.js` — an empty `function <Name>(){ }` <br>• Injects `<<Name>/>` into `Main/Views/MainView.jsx` (right before its last `</div>`) <br>• Appends a `Carbon.PageView({ Name: "<Name>", Initial: false, OnScript(){ <Name>(); } })` registration into `Main/Script/MainView.js` <br>• Automatically runs `--sync` afterward so the manifests pick up the two new files. |

Name normalization rules:
- Non-alphanumeric characters are stripped.
- First letter is capitalized.
- A `View` suffix is appended automatically if missing (e.g. `--create-view profile` → `ProfileView`).
- If a view with that name already exists, the command aborts instead of overwriting it.

### Package Commands
| Command | What it does |
| :--- | :--- |
| `--install --package --js <name>` | Installs a JS package. |
| `--install --package --css <name>` | Installs a CSS package. |
| `--remove --package --js <name>` | Removes a JS package. |
| `--remove --package --css <name>` | Removes a CSS package. |

> ⚠️ **Known issue:** these commands call an internal `managePackage()` function that routes the action, but that function is **not currently defined** anywhere in `CarbonCli.js`. As shipped, running any `--package` command will crash with `ReferenceError: managePackage is not defined`. Until this is patched, manage packages manually by adding files under `Package/Script/<pkg>/` or `Package/Style/<pkg>/` and running `--sync`.

### Viewer Commands
| Command | What it does |
| :--- | :--- |
| `--show-package` | Prints the raw contents of `Carbon.package`. |
| `--show-build` | Prints the raw contents of `Carbon.build`. |
| `--show-main` | Prints the raw contents of `Carbon.main`. |

### Encryption Flag
| Flag | What it does |
| :--- | :--- |
| `--enc <key>` | Appended to a build command. After the normal build finishes, every output file (`index.html`, `combined.json`, `bundle.js`, `bundle.css`, and every individual file referenced in `combined.json`) is encrypted with **AES-256-CBC** using a SHA-256 hash of `<key>`, and reorganized into a `generated/` folder structure (see below). Omit `--enc` to get plain, unencrypted output. |

Example:
```bash
node CarbonCli.js --carbon-framework --build --enc MySecretKey
```

### Help
Running with no arguments, or `--help`, prints the full command list.

## `generated/` Output Structure (when `--enc` is used)
When a build command is combined with `--enc <key>`, CarbonCli creates:
```txt
generated/
├── index.main.cpk        (was index.html)
├── base.bundle.cf        (was combined.json)
├── lib/
│   ├── cni/               JS/JSX files  → libName.cso
│   ├── cnui/               CSS files    → libName.dso
│   ├── libindex.cni        (was bundle.js, if present)
│   └── libindex.cnui       (was bundle.css, if present)
└── Resources/              (copied recursively from /Resources)
```
Each file's payload is `iv:encryptedHex` (a random 16-byte IV, hex-encoded, joined with `:` to the AES-256-CBC ciphertext). The same `<key>` you encrypted with is required to decrypt later — CarbonCli does not currently ship a decrypt command, so keep the key safe.

## The Lithium Rendering Engine
This is the part that actually turns your `.jsx`-style Views into HTML. It runs entirely on string-rewriting (regex passes), not a virtual DOM — which is why the framework can run the exact same engine in Node (for static builds) and in the browser (for runtime/dev preview).

### Entry point
The engine looks for a component literally named `Main` or `HomeUi` among all `var X = (...)` declarations collected from your View files. Whichever one exists becomes the root that gets rendered. If neither exists, the engine gives up parsing and returns your raw source untouched (a safety fallback so plain JS files don't get mangled).

### What gets collected from your source before rendering
- **State variables** — `var x = {...}` / `var x = [...]` / `var x = "..."` are evaluated and stored in a shared `state` object.
- **Style objects** — a `var myStyle = { _h1: { color: 'red' } }` block is parsed into real CSS strings (camelCase keys become kebab-case).
- **Static components** — `var myView = ( <App>...</App> )` is stored under the name `myView`, ready to be inlined wherever `<myView/>` appears.
- **Function components** — 
  ```jsx
  function Card(props) {
    return (
      <div>{props.title}</div>
    )
  }
  ```
  is stored with its parameter name and body, ready to be inlined via `<Card config={{title: "Hi"}} />`.

### Render passes (repeated up to 25 times, until nothing changes)
1.  **Functional components** — `<Name config={{...}} />` tags are replaced with that function's body, with `{props.path}` placeholders substituted from the evaluated `config` object.
2.  **Static components** — any `<Name/>` self-closing tag matching a `var Name = (...)` declaration is replaced with that block's content.
3.  **Data injection** — `<$path.to.value/>` tags are replaced with the resolved value from state (supports dot/bracket paths, e.g. `<$info.ip/>`).
4.  **Expressions** — `{expr}` is resolved first against state (`{user.name}`), then, if it's a simple arithmetic/identifier expression, evaluated as JS (e.g. `{count + 1}`). Expressions containing `.map(...)` or referring to a style object are left alone for the next phase.
5.  **Inline style shorthand** — `style="${myStyle}"` converts a plain state object into a real `style="key: value; ..."` string.
6.  **Style injection** — `style={myStyle.someClass}` is replaced with the matching CSS string built from the style object collected earlier.

After the loop settles, every `id="..."` in the final HTML is checked for duplicates and automatically suffixed (`id="box"`, `id="box-2"`, `id="box-3"`, ...) so you never ship a document with clashing IDs.

## Server-Side `<?CarbonJS ?>` Tags
Separate from the Lithium `{}`/`<$/>`/component syntax above, CarbonCompiler also supports an embedded scripting tag — similar in spirit to PHP:
```txt
<?CarbonJS
  writeIt("Hello, " + store.user.name);
  writeUi("<strong>raw html is fine here</strong>");
?>
```
This block is executed in a sandboxed `Function(...)` with five things available inside it:
| Name | Purpose |
| :--- | :--- |
| `writeIt(content)` | Writes a value, **HTML-escaped** (safe for untrusted/dynamic text). |
| `writeUi(html)` | Writes a raw HTML string, **not escaped** (use for content you trust). |
| `include(filename)` | Reads another file via the resource manager and recursively compiles any `<?CarbonJS ?>` tags inside it before inlining the result. |
| `store` | The shared `CarbonStore` object (`user`, `theme`, `appVersion`, `data`). |
| `tools` | Small helpers: `tools.date()`, `tools.upper(str)`, `tools.uuid()`. |

If the code inside a `<?CarbonJS ?>` block throws, the tag is replaced with a visible `<div class="carbon-error-box">Runtime Exception: ...</div>` instead of crashing the whole build — same goes for a failed `include()`, which renders an `Include Failed: <filename>` box.

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

Use State & Expressions
```jsx
var user={
 name:"Rakib",
 age:24
}

var myView=(
 <App>
  <AppBody>
   <h2>Welcome, {user.name}</h2>
   <p>Next year you will be {user.age + 1}</p>
  </AppBody>
 </App>
)
```
> Note: `{expr}` only resolves simple state paths or basic arithmetic/identifier expressions (e.g. `{count + 1}`). It does **not** evaluate `.map()` or other array/loop expressions — those are intentionally skipped by the engine. For lists, use a `<?CarbonJS ?>` block (see below).

Use Function Components
```jsx
function Card(props){
 return(
  <div class="card">
   <h3>{props.title}</h3>
   <p>{props.body}</p>
  </div>
 )
}

var myView=(
 <App>
  <AppBody>
   <Card config={{title:"Hello", body:"This is a Carbon function component"}} />
   <Card config={{title:"Second Card", body:"Each call gets its own props"}} />
  </AppBody>
 </App>
)
```
> Note: the parameter name in `function Card(props)` must match what you reference inside the body, e.g. `{props.title}`. Function components currently take a **single** props parameter — destructured/multiple parameters are not supported.

## CarbonJS (`<?CarbonJS ?>`) Examples
`<?CarbonJS ?>` runs real, sandboxed JavaScript at compile time and writes directly into the HTML output using `writeIt()` (escaped) or `writeUi()` (raw HTML). This is separate from the `{}` / `<$/>` Lithium syntax above, and is the right tool whenever you need actual JS logic — loops, conditionals, calculations — rather than a single value lookup.

Basic output:
```jsx
var myView=(
 <App>
  <AppBody>
   <?CarbonJS
     writeIt("Rendered at: " + tools.date());
   ?>
  </AppBody>
 </App>
)
```

Using `store` (the shared `CarbonStore`):
```jsx
var myView=(
 <App>
  <AppBody>
   <?CarbonJS
     if(store.user.loggedIn){
       writeUi("<h2>Welcome back, " + store.user.name + "</h2>");
     } else {
       writeUi("<h2>Please log in</h2>");
     }
   ?>
  </AppBody>
 </App>
)
```

Looping to render a list (the only reliable way to do list-rendering in CarbonCompiler today, since `{items.map(...)}` is not evaluated):
```jsx
var myView=(
 <App>
  <AppBody>
   <ul>
    <?CarbonJS
      var fruits = ["Apple", "Banana", "Mango"];
      fruits.forEach(function(item){
        writeUi("<li>" + item + "</li>");
      });
    ?>
   </ul>
  </AppBody>
 </App>
)
```

Mixing `writeIt` (escaped) and `writeUi` (raw) safely in the same block:
```jsx
var myView=(
 <App>
  <AppBody>
   <?CarbonJS
     var comment = "<script>alert(1)</script>"; // untrusted input
     writeUi("<p>User said: ");
     writeIt(comment);           // escaped, safe to print as-is
     writeUi("</p>");
   ?>
  </AppBody>
 </App>
)
```

Including another file's compiled output:
```jsx
var myView=(
 <App>
  <AppBody>
   <?CarbonJS
     writeUi(include("Main/Views/Footer.jsx"));
   ?>
  </AppBody>
 </App>
)
```
> If the included file is missing, the tag is replaced with an `Include Failed: <filename>` notice instead of crashing the build.

Combined example — Carbon-style JSX + CarbonJS together:
```jsx
var settings={
 siteName:"My Carbon App",
 version:"1.0"
}

var myView=(
 <App>
  <AppBody>
   <h1>{settings.siteName}</h1>
   <p>Version: {settings.version}</p>

   <?CarbonJS
     var items = store.data.notifications || [];
     if(items.length === 0){
       writeUi("<p>No new notifications.</p>");
     } else {
       writeUi("<ul>");
       items.forEach(function(n){
         writeUi("<li>");
         writeIt(n);
         writeUi("</li>");
       });
       writeUi("</ul>");
     }
   ?>
  </AppBody>
 </App>
)
```

#verified
