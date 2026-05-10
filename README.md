# CarbonFramework

Carbon Framework is a UI library designed for Android App Development, providing a vast collection of prebuilt components, themes, and Material Design 3 widgets. It aims to simplify the development process by offering ready-to-use components that follow modern design principles.

## 🚀 Key Features

- **Large Collection of Prebuilt Components**: Includes ActionSheets, Alerts, DatePickers, Drawers, and more.
- **Material Design 3**: Built with MD3 guidelines in mind for a modern look and feel.
- **Theming Support**: Easy to customize and apply different themes to your application.
- **Carbon Build API**: A powerful core API for efficient DOM manipulation and component creation.
- **CLI Tools**: Built-in CLI for project management, bundling, and package installation.

## 📁 Project Structure

- `Engine/`: Core framework logic, including the Build API, themes, and styles.
- `Doc/`: Comprehensive documentation for prebuilt components.
- `Example/`: Practical examples and tutorials for using various components.
- `Package/`: Dependencies and package management.
- `CarbonCli.js`: Command-line interface for managing Carbon projects.

## 🛠 Getting Started (CLI Usage)

The Carbon CLI provides tools for project assembly and package management.

### Build Commands
- **Full Build**: `node CarbonCli.js --carbon-framework --build`
- **JS Bundling**: `node CarbonCli.js --build-js`
- **CSS Bundling**: `node CarbonCli.js --build-css`

### Package Management
- **Install JS Package**: `node CarbonCli.js --install --package --js <name>`
- **Remove CSS Package**: `node CarbonCli.js --remove --package --css <name>`

For more detailed CLI information, see [CarbonCli.md](CarbonCli.md).

## 📖 Component Documentation

Explore our prebuilt components:

- [ActionSheet](Doc/Prebuilt/ActionSheet.md)
- [Alert](Doc/Prebuilt/Alert.md)
- [CodeHighlighter](Doc/Prebuilt/CodeHighlighter.md)
- [DatePicker](Doc/Prebuilt/DatePicker.md)
- [Divider](Doc/Prebuilt/Divider.md)
- [Drawer](Doc/Prebuilt/Drawer.md)
- [Elasticity](Doc/Prebuilt/Elasticity.md)
- [Fab](Doc/Prebuilt/Fab.md)
- [Gesture](Doc/Prebuilt/Grasture.md)
- [GridView](Doc/Prebuilt/GridView.md)
- [Layout](Doc/Prebuilt/Layout.md)
- [PageView](Doc/Prebuilt/PageView.md)
- [PixelEngine](Doc/Prebuilt/PixelEngine.md)
- [Scroll](Doc/Prebuilt/Scroll.md)
- [Select](Doc/Prebuilt/Select.md)
- [TimePicker](Doc/Prebuilt/TimePicker.md)

## 📚 Tutorials & Examples

- [Core Build API Tutorial](Example/Core_JavaScript/Carbon_Build_Api.md)
- [NativeToast Example](Example/NativeToast/md/NativeToast.md)
- [Svg Example](Example/Svg/md/Svg.md)

## 📄 Release History

Check out the latest updates in [Release.md](Release.md).
