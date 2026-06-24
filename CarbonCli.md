# CARBON CLI v1.0 Documentation

Documentation for the Carbon CLI framework, providing tools for project assembly, file synchronization, and package management.

---

## 🛠 Command Hierarchy

Below is the structured list of all available commands categorized by their functional parents.

* **Build Commands**
    * `--carbon-framework --build`: Generate index.html with combining css,js in single file..
    * `--build-json`: Metadata generation (`combined.json`).
    * `--build-css`: CSS bundling (`bundle.css`).
    * `--build-js`: JavaScript bundling (`bundle.js`).
* **Sync Commands**
    * `--sync`: Physical file scanning and configuration updates.
* **Package Commands**
    * `--install --package`: Add new dependencies.
        * `--js <name>`: Target JavaScript packages.
        * `--css <name>`: Target CSS packages.
    * `--remove --package`: Delete existing dependencies.
        * `--js <name>`: Target JavaScript packages.
        * `--css <name>`: Target CSS packages.
* **Viewer Commands**
    * `--show-package`: View `Carbon.package`.
    * `--show-build`: View `Carbon.build`.
    * `--show-main`: View `Carbon.main`.

---

## 📖 Usage Examples

| Category | Command | Description |
| :--- | :--- | :--- |
| **Project Build** | `node CarbonCli.js --carbon-framework --build` | Executes the complete build pipeline for the framework. |
| **Asset Bundle** | `node CarbonCli.js --build-js` | Generates a single `bundle.js` from project assets. |
| **Synchronization** | `node CarbonCli.js --sync` | Syncs local folders with `Carbon.package` and `Carbon.build`. |
| **Add Package** | `node CarbonCli.js --install --package --js jquery` | Installs a JS package named "jquery" and updates the build. |
| **Remove Package** | `node CarbonCli.js --remove --package --css bootstrap` | Removes the "bootstrap" CSS package from the project. |
| **Inspection** | `node CarbonCli.js --show-package` | Prints the contents of the package configuration to the terminal. |
| **Help** | `node CarbonCli.js --help` | Displays the version info and command overview. |

---

## 📦 NPM Scripts

All scripts are namespaced under `carbon:` (except `start`) so they never collide with npm's own reserved/lifecycle script names. Scripts that take an argument (a view name or package name) need npm's `--` separator to forward it to `CarbonCli.js`.

| NPM Script | Underlying Command | Description |
| :--- | :--- | :--- |
| `npm start` | `npm run carbon:start` | Convenience alias — syncs the project, then launches `LiveServer.js`. |
| `npm run carbon:start` | `node CarbonCli.js --sync && node LiveServer.js` | Syncs the project, then launches `LiveServer.js`. |
| `npm run carbon:sync` | `node CarbonCli.js --sync` | Scans physical folders and updates `Carbon.package`, `Carbon.build`, `Carbon.main`. |
| `npm run carbon:build` | `node CarbonCli.js --carbon-framework --build` | Executes the complete build pipeline for the framework. |
| `npm run carbon:build:js` | `node CarbonCli.js --build-js` | Generates a combined `bundle.js`. |
| `npm run carbon:build:css` | `node CarbonCli.js --build-css` | Generates a combined `bundle.css`. |
| `npm run carbon:create-view -- <name>` | `node CarbonCli.js --create-view <name>` | Creates a new PageView (`.jsx` + `.js`), wires it into `MainView`, then auto-syncs. |
| `npm run carbon:remove-view -- <name>` | `node CarbonCli.js --remove-view <name>` | Deletes a PageView (`.jsx` + `.js`), unwires it from `MainView`, then auto-syncs. |
| `npm run carbon:install:js -- <name>` | `node CarbonCli.js --install --package --js <name>` | Installs a JS package and updates the build. |
| `npm run carbon:install:css -- <name>` | `node CarbonCli.js --install --package --css <name>` | Installs a CSS package and updates the build. |
| `npm run carbon:remove:js -- <name>` | `node CarbonCli.js --remove --package --js <name>` | Removes a JS package and updates the build. |
| `npm run carbon:remove:css -- <name>` | `node CarbonCli.js --remove --package --css <name>` | Removes a CSS package and updates the build. |
| `npm run carbon:show:package` | `node CarbonCli.js --show-package` | Prints the contents of `Carbon.package`. |
| `npm run carbon:show:build` | `node CarbonCli.js --show-build` | Prints the contents of `Carbon.build`. |
| `npm run carbon:show:main` | `node CarbonCli.js --show-main` | Prints the contents of `Carbon.main`. |

> [!TIP]
> The `--` is required whenever you pass an argument through `npm run`, e.g. `npm run carbon:create-view -- Profile`. Without it, npm will not forward `Profile` to `CarbonCli.js`.

---
## LiveServer
```js
node LiveServer.js
```

> [!TIP]
> Package commands (Install/Remove) trigger an **automatic build update** immediately after the package operation finishes to ensure your environment stays in sync.