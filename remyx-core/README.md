# @remyx/core

Framework-agnostic core engine for the [Remyx Editor](../remyx-editor/). Provides the editor engine, commands, plugin system, utilities, and CSS themes — with zero framework dependencies.

Use this package to build Remyx Editor integrations for any framework (Vue, Svelte, Angular, vanilla JS) or for server-side processing. For React projects, use [`@remyx/react`](../remyx-react/) (or the all-in-one [`remyx-editor`](../remyx-editor/)), which includes this package plus React components and hooks.

## Installation

```bash
npm install @remyx/core
```

## Quick Start

```js
import { EditorEngine } from '@remyx/core';
import {
  registerFormattingCommands,
  registerHeadingCommands,
  registerListCommands,
  registerLinkCommands,
  registerImageCommands,
  registerTableCommands,
  registerBlockCommands,
} from '@remyx/core';
import '@remyx/core/style.css';

const element = document.querySelector('#editor');
const engine = new EditorEngine(element, { outputFormat: 'html' });

// Register the commands you need
registerFormattingCommands(engine);
registerHeadingCommands(engine);
registerListCommands(engine);
registerLinkCommands(engine);
registerImageCommands(engine);
registerTableCommands(engine);
registerBlockCommands(engine);

// Initialize
engine.init();

// Listen for changes
engine.on('content:change', () => {
  console.log(engine.getHTML());
});

// Execute commands
engine.executeCommand('bold');
engine.executeCommand('heading', 2);

// Cleanup when done
engine.destroy();
```

## Architecture

```
@remyx/core
  core/           EditorEngine, EventBus, CommandRegistry, Selection,
                  History, KeyboardManager, Sanitizer, Clipboard, DragDrop
  commands/       16 register functions (formatting, headings, lists, etc.)
  plugins/        PluginManager, createPlugin, 3 built-in plugins
  utils/          markdown, paste cleaning, export, fonts, themes, toolbar, DOM
  constants/      defaults, keybindings, schema, commands
  config/         defineConfig
  themes/         variables.css, light.css, dark.css
```

## API

### EditorEngine

The central class. Takes a DOM element and manages contenteditable editing.

```js
const engine = new EditorEngine(element, options);
engine.init();

engine.getHTML();            // sanitized HTML content
engine.setHTML(html);        // set content
engine.getText();            // plain text
engine.isEmpty();            // check if empty
engine.focus();
engine.blur();
engine.executeCommand(name, ...args);
engine.getWordCount();
engine.getCharCount();

engine.on('content:change', callback);
engine.on('selection:change', callback);
engine.on('focus', callback);
engine.on('blur', callback);
engine.off(event, callback);

engine.destroy();            // cleanup all listeners
```

### Commands

Each register function adds commands to the engine. Call only the ones you need:

| Function | Commands Added |
| --- | --- |
| `registerFormattingCommands` | bold, italic, underline, strikethrough, subscript, superscript |
| `registerHeadingCommands` | heading (H1-H6, paragraph) |
| `registerAlignmentCommands` | alignLeft, alignCenter, alignRight, alignJustify |
| `registerListCommands` | orderedList, unorderedList, taskList |
| `registerLinkCommands` | link, unlink |
| `registerImageCommands` | image |
| `registerTableCommands` | table, addRow, addColumn, deleteRow, deleteColumn, deleteTable |
| `registerBlockCommands` | blockquote, codeBlock, horizontalRule |
| `registerFontCommands` | fontFamily, fontSize, foreColor, backColor |
| `registerMediaCommands` | embedMedia |
| `registerFindReplaceCommands` | findReplace |
| `registerSourceModeCommands` | sourceMode |
| `registerFullscreenCommands` | fullscreen |
| `registerMarkdownToggleCommands` | toggleMarkdown |
| `registerAttachmentCommands` | attachment |
| `registerImportDocumentCommands` | importDocument |

### Plugins

```js
import { createPlugin } from '@remyx/core';

const MyPlugin = createPlugin({
  name: 'my-plugin',
  init(engine) { /* engine ready */ },
  destroy(engine) { /* cleanup */ },
  commands: [],
  toolbarItems: [],
  statusBarItems: [],
  contextMenuItems: [],
});

engine.plugins.register(MyPlugin);
```

Built-in plugins: `WordCountPlugin`, `AutolinkPlugin`, `PlaceholderPlugin`.

### Utilities

```js
import {
  // Markdown
  htmlToMarkdown, markdownToHtml,

  // Paste cleaning
  cleanPastedHTML, looksLikeMarkdown,

  // Document conversion
  convertDocument, isImportableFile, getSupportedExtensions,

  // Export
  exportAsPDF, exportAsDocx, exportAsMarkdown,

  // Fonts
  loadGoogleFonts, removeFonts, addFonts,

  // Theming
  createTheme, THEME_VARIABLES, THEME_PRESETS,
  createToolbarItemTheme, resolveToolbarItemStyle,

  // Toolbar config
  TOOLBAR_PRESETS, removeToolbarItems, addToolbarItems, createToolbar,

  // Config
  defineConfig,
} from '@remyx/core';
```

### Constants

```js
import {
  DEFAULT_TOOLBAR, DEFAULT_MENU_BAR, DEFAULT_FONTS,
  DEFAULT_FONT_SIZES, DEFAULT_COLORS, DEFAULT_KEYBINDINGS,
  HEADING_OPTIONS, ALLOWED_TAGS, ALLOWED_STYLES,
  BUTTON_COMMANDS, TOOLTIP_MAP, SHORTCUT_MAP, MODAL_COMMANDS,
} from '@remyx/core';
```

## CSS

Import the stylesheet for editor theming (light/dark modes, CSS custom properties):

```js
import '@remyx/core/style.css';
```

All styles use the `.rmx-` prefix and `--rmx-*` CSS custom properties. See the [theme variables table](../remyx-editor/README.md#available-theme-variables) for the full list.

## Building Framework Wrappers

When creating a wrapper for a new framework, your package should:

1. Depend on `@remyx/core` as a peer dependency
2. Import `EditorEngine` and register the commands you need
3. Create framework-native components for the toolbar, menu bar, modals, and status bar
4. Use `@remyx/core/style.css` for base theming and add component-specific CSS
5. Re-export `@remyx/core` for convenience so consumers don't need both packages

See [`@remyx/react`](../remyx-react/) as the reference implementation.

## License

MIT
