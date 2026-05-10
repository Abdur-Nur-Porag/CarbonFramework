# CarbonFramework

Carbon Framework is a UI library designed for Android App Development, providing a vast collection of prebuilt components, themes, and Material Design 3 widgets. It aims to simplify the development process by offering ready-to-use components that follow modern design principles.

## 🚀 Key Features

- **Large Collection of Prebuilt Components**: Includes ActionSheets, Alerts, DatePickers, Drawers, and more.
- **Material Design 3**: Built with MD3 guidelines in mind for a modern look and feel.
- **Theming Support**: Easy to customize and apply different themes to your application.
- **Carbon Build API**: A powerful core API for efficient DOM manipulation and component creation.
- **CLI Tools**: Built-in CLI for project management, bundling, and package installation.

## 📁 Project Structure

- <add file tree here of project with Engine,Main,Package>
Add say user will write there code 
For jsx write Main/Views and Write Script in Script.js(generaly) script folder must contain pageview(link)render code of your view. Also there is files for TopScript,BottomScript,PostScript,PreScript for various perpose.
TopScript means this execute at start of page. BottomScript execute after end of code. Prescript means runs before all views set. Postscript means this run after all execute of Script folder script. Themes folder contain themes js,style provide styling of user.

And a caution user ony access to edit in Main folder (except:PixelGrid.js,Themes.js,Carbon.Material.Themes.js,MainView.js,MainView.jsx,HomeView.jsx)[add documention for it after read this file]. These file are not access to delete if deleted may suffer from ui or otuers problem. And say Engine is only access maintained by owner. If you modified project may break down. And Package folder need manage by cli(unless may break) dependency Main.build,Engine.build,Package.build auto update with change by cli no need manual(use manual as you own risk).(Tutorial for manual use)
## 🛠 Getting Started (CLI Usage)

The Carbon CLI provides tools for project assembly and package management.
//<say require node js>
//must remember any file change(add,remove,change name,..new package,delete package)..or every time before build or live server run command --sync (link it as most important.)
// run node LiveServer.js

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
