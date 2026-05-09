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
## LiveServer
```js
node LiveServer.js
```

> [!TIP]
> Package commands (Install/Remove) trigger an **automatic build update** immediately after the package operation finishes to ensure your environment stays in sync.