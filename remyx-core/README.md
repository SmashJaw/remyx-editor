![Remyx Editor](../docs/screenshots/Remyx-Logo.svg)

# @remyxjs/core

Framework-agnostic core engine for the Remyx Editor. Provides the editor engine, commands, plugin system, utilities, and CSS themes — with zero framework dependencies.

Use this package to build Remyx Editor integrations for any framework (Vue, Svelte, Angular, vanilla JS) or for server-side processing. For React projects, use [`@remyxjs/react`](https://www.npmjs.com/package/@remyxjs/react), which includes this package plus React components and hooks.

## Table of Contents

- [@remyxjs/core](#remyxjscore)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [Architecture](#architecture)
  - [EditorEngine](#editorengine)
    - [Constructor Options](#constructor-options)
    - [Methods](#methods)
    - [Events](#events)
  - [Commands](#commands)
    - [Formatting](#formatting)
    - [Headings](#headings)
    - [Lists](#lists)
    - [Alignment](#alignment)
    - [Links](#links)
    - [Images](#images)
    - [Tables](#tables)
      - [Table command reference](#table-command-reference)
      - [Sort data types](#sort-data-types)
      - [Formulas](#formulas)
      - [Cell formatting](#cell-formatting)
      - [Clipboard interop](#clipboard-interop)
    - [Blocks](#blocks)
    - [Fonts](#fonts)
    - [Media Embeds](#media-embeds)
    - [Find \& Replace](#find--replace)
    - [Source Mode](#source-mode)
    - [Fullscreen](#fullscreen)
    - [Distraction-Free Mode](#distraction-free-mode)
    - [Split View](#split-view)
    - [Color Presets](#color-presets)
    - [Typography Controls](#typography-controls)
    - [Sticky Toolbar](#sticky-toolbar)
    - [Markdown Toggle](#markdown-toggle)
    - [Attachments](#attachments)
    - [Document Import](#document-import)
    - [Command Palette](#command-palette)
      - [Recently-used commands](#recently-used-commands)
      - [Custom command items](#custom-command-items)
  - [Autosave](#autosave)
    - [Storage Providers](#storage-providers)
    - [AutosaveManager API](#autosavemanager-api)
    - [Autosave Events](#autosave-events)
  - [Plugin System](#plugin-system)
    - [Creating Plugins](#creating-plugins)
    - [Lifecycle Hooks](#lifecycle-hooks)
    - [Plugin Dependencies](#plugin-dependencies)
    - [Scoped Plugin Settings](#scoped-plugin-settings)
    - [Plugin Registry](#plugin-registry)
    - [Plugin Metadata](#plugin-metadata)
    - [Plugin API (Restricted)](#plugin-api-restricted)
    - [Built-in Plugins](#built-in-plugins)
      - [Line numbers](#line-numbers)
      - [Copy-to-clipboard](#copy-to-clipboard)
      - [Inline code highlighting](#inline-code-highlighting)
      - [Custom language registration](#custom-language-registration)
  - [Selection API](#selection-api)
  - [History (Undo/Redo)](#history-undoredo)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
  - [Sanitizer](#sanitizer)
  - [Utilities](#utilities)
    - [HTML Helpers](#html-helpers)
    - [Markdown Conversion](#markdown-conversion)
    - [Document Conversion](#document-conversion)
    - [Export](#export)
    - [Paste Cleaning](#paste-cleaning)
    - [Font Management](#font-management)
    - [DOM Utilities](#dom-utilities)
    - [HTML Formatting](#html-formatting)
    - [Platform Detection](#platform-detection)
  - [Theming](#theming)
    - [Theme Variables](#theme-variables)
    - [Built-in Themes](#built-in-themes)
    - [Custom Themes](#custom-themes)
  - [Toolbar Configuration](#toolbar-configuration)
    - [Toolbar Presets](#toolbar-presets)
    - [Custom Toolbars](#custom-toolbars)
    - [Toolbar Item Theming](#toolbar-item-theming)
  - [Configuration](#configuration)
    - [defineConfig](#defineconfig)
    - [loadConfig](#loadconfig)
  - [Multi-Editor Support](#multi-editor-support)
    - [EditorBus](#editorbus)
    - [SharedResources](#sharedresources)
  - [Constants](#constants)
  - [Tree-Shaking](#tree-shaking)
  - [CSS](#css)
  - [Building Framework Wrappers](#building-framework-wrappers)
  - [License](#license)

## Installation

```bash
npm install @remyxjs/core
```

## Quick Start

```js
import { EditorEngine } from '@remyxjs/core';
import {
  registerFormattingCommands,
  registerHeadingCommands,
  registerListCommands,
  registerLinkCommands,
  registerImageCommands,
  registerTableCommands,
  registerBlockCommands,
} from '@remyxjs/core';
import '@remyxjs/core/style.css';

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
@remyxjs/core
  core/           EditorEngine, EventBus, CommandRegistry, Selection,
                  History, KeyboardManager, Sanitizer, Clipboard, DragDrop,
                  AutosaveManager, EditorBus.js, SharedResources.js, VirtualScroller.js
  commands/       20 register functions (formatting, headings, lists, slashCommands, etc.)
  plugins/        PluginManager, createPlugin, 17 built-in plugins
  workers/        WorkerPool for background thread offloading
  autosave/       5 storage providers (LocalStorage, SessionStorage, FileSystem, Cloud, Custom)
  i18n/           Translations and locale support
  utils/          markdown, paste cleaning, export, fonts, themes, toolbar, DOM,
                  documentConverter/ (per-format modules), escapeHTML.js,
                  insertPlainText.js, rtl.js, performance.js
  constants/      defaults, keybindings, schema, commands
  config/         defineConfig, loadConfig.js
  themes/         variables.css, light.css, dark.css, ocean.css, forest.css, sunset.css, rose.css
```

## EditorEngine

The central class. Takes a DOM element and manages all contenteditable editing, event handling, commands, history, and plugins.

### Constructor Options

```js
const engine = new EditorEngine(element, {
  outputFormat: 'html',       // 'html' or 'markdown'
  history: {
    maxSize: 100,             // Maximum undo states
    debounceMs: 300,          // Debounce interval for snapshots
  },
  sanitize: {
    allowedTags: { ... },     // Tag-to-attributes map (extends defaults)
    allowedStyles: [ ... ],   // Allowed CSS properties (extends defaults)
  },
  baseHeadingLevel: 1,        // Heading offset (2 renders H1 as <h2>)
  uploadHandler: async (file) => {
    // Return a URL string for the uploaded file
    const url = await myUploadService(file);
    return url;
  },
  maxFileSize: 10 * 1024 * 1024, // 10 MB (default)
});
```

### Methods

| Method                          | Returns    | Description                                                      |
| ------------------------------- | ---------- | ---------------------------------------------------------------- |
| `init()`                        | `void`     | Initialize the editor — binds event listeners, starts subsystems |
| `destroy()`                     | `void`     | Clean up all listeners, disconnect observers, destroy plugins    |
| `getHTML()`                     | `string`   | Get sanitized HTML content                                       |
| `setHTML(html)`                 | `void`     | Set content (sanitized before insertion)                         |
| `getText()`                     | `string`   | Get plain text content                                           |
| `isEmpty()`                     | `boolean`  | `true` when editor has no meaningful content                     |
| `focus()`                       | `void`     | Focus the editor element                                         |
| `blur()`                        | `void`     | Blur the editor element                                          |
| `executeCommand(name, ...args)` | `any`      | Execute a registered command by name                             |
| `on(event, handler)`            | `Function` | Subscribe to an event; returns an unsubscribe function           |
| `off(event, handler)`           | `void`     | Unsubscribe from an event                                        |
| `getWordCount()`                | `number`   | Current word count                                               |
| `getCharCount()`                | `number`   | Current character count                                          |

### Events

| Event                       | Data                              | Description                             |
| --------------------------- | --------------------------------- | --------------------------------------- |
| `content:change`            | —                                 | Content was modified                    |
| `selection:change`          | `ActiveFormats`                   | Selection or formatting state changed   |
| `focus`                     | —                                 | Editor received focus                   |
| `blur`                      | —                                 | Editor lost focus                       |
| `command:executed`          | `{ name, args, result }`          | A command was executed                  |
| `paste`                     | `{ html, text }`                  | Paste occurred                          |
| `drop`                      | `{ files, html }`                 | Drop occurred                           |
| `upload:error`              | `{ file, error }`                 | Upload handler rejected                 |
| `file:too-large`            | `{ file, maxSize }`               | Dropped/pasted file exceeded size limit |
| `editor:error`              | `{ phase, error }`                | Initialization error                    |
| `mode:change`               | `{ sourceMode }`                  | Source mode toggled                     |
| `mode:change:markdown`      | `{ markdownMode }`                | Markdown mode toggled                   |
| `fullscreen:toggle`         | `{ fullscreen }`                  | Fullscreen toggled                      |
| `find:results`              | `{ total, current }`              | Find/replace results updated            |
| `history:undo`              | —                                 | Undo performed                          |
| `history:redo`              | —                                 | Redo performed                          |
| `plugin:registered`         | `{ name }`                        | Plugin was registered                   |
| `plugin:error`              | `{ name, error }`                 | Plugin init/destroy error               |
| `codeblock:created`         | `{ element, language }`           | Code block was created                  |
| `codeblock:language-change` | `{ language, element }`           | Code block language was changed         |
| `wordcount:update`          | `{ wordCount, charCount }`        | Word/char count changed                 |
| `autosave:saving`           | —                                 | Autosave started                        |
| `autosave:saved`            | `{ timestamp }`                   | Autosave succeeded                      |
| `autosave:error`            | `{ error }`                       | Autosave failed                         |
| `autosave:recovered`        | `{ recoveredContent, timestamp }` | Recovery data found on init             |

**Example — listening to events:**

```js
engine.on('content:change', () => {
  saveToServer(engine.getHTML());
});

engine.on('selection:change', (formats) => {
  updateToolbarState(formats);
  // formats: { bold, italic, underline, heading, alignment, link, ... }
});

engine.on('upload:error', ({ file, error }) => {
  showNotification(`Upload failed: ${error.message}`);
});

// The return value is an unsubscribe function
const unsub = engine.on('focus', () => console.log('focused'));
unsub(); // stop listening
```

## Commands

Each register function adds commands to the engine. Call only the ones you need — unused commands are tree-shaken from the bundle.

| Function                          | Commands Added                                                                                                                                                                                                        |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `registerFormattingCommands`      | bold, italic, underline, strikethrough, subscript, superscript, removeFormat                                                                                                                                          |
| `registerHeadingCommands`         | heading, h1–h6, paragraph                                                                                                                                                                                             |
| `registerAlignmentCommands`       | alignLeft, alignCenter, alignRight, alignJustify                                                                                                                                                                      |
| `registerListCommands`            | orderedList, unorderedList, taskList, indent, outdent                                                                                                                                                                 |
| `registerLinkCommands`            | insertLink, editLink, removeLink                                                                                                                                                                                      |
| `registerImageCommands`           | insertImage, resizeImage, alignImage, removeImage                                                                                                                                                                     |
| `registerTableCommands`           | insertTable, addRowBefore, addRowAfter, addColBefore, addColAfter, deleteRow, deleteCol, deleteTable, mergeCells, splitCell, toggleHeaderRow, sortTable, filterTable, clearTableFilters, formatCell, evaluateFormulas |
| `registerBlockCommands`           | blockquote, codeBlock, horizontalRule                                                                                                                                                                                 |
| `registerFontCommands`            | fontFamily, fontSize, foreColor, backColor, lineHeight, letterSpacing, paragraphSpacing                                                                                                                               |
| `registerMediaCommands`           | embedMedia, removeEmbed                                                                                                                                                                                               |
| `registerFindReplaceCommands`     | find, findNext, findPrev, replace, replaceAll                                                                                                                                                                         |
| `registerSourceModeCommands`      | sourceMode                                                                                                                                                                                                            |
| `registerFullscreenCommands`      | fullscreen                                                                                                                                                                                                            |
| `registerDistractionFreeCommands` | distractionFree                                                                                                                                                                                                       |
| `registerSplitViewCommands`       | toggleSplitView                                                                                                                                                                                                       |
| `registerColorPresetCommands`     | saveColorPreset, loadColorPresets, deleteColorPreset                                                                                                                                                                  |
| `registerMarkdownToggleCommands`  | toggleMarkdown                                                                                                                                                                                                        |
| `registerAttachmentCommands`      | insertAttachment, removeAttachment                                                                                                                                                                                    |
| `registerImportDocumentCommands`  | importDocument                                                                                                                                                                                                        |

### Formatting

```js
registerFormattingCommands(engine);

engine.executeCommand('bold'); // Toggle bold (Mod+B)
engine.executeCommand('italic'); // Toggle italic (Mod+I)
engine.executeCommand('underline'); // Toggle underline (Mod+U)
engine.executeCommand('strikethrough'); // Toggle strikethrough (Mod+Shift+X)
engine.executeCommand('subscript'); // Toggle subscript (Mod+,)
engine.executeCommand('superscript'); // Toggle superscript (Mod+.)
engine.executeCommand('removeFormat'); // Strip all inline formatting
```

### Headings

```js
registerHeadingCommands(engine);

engine.executeCommand('heading', 1); // Apply H1
engine.executeCommand('heading', 3); // Apply H3
engine.executeCommand('heading', 'p'); // Reset to paragraph
engine.executeCommand('h2'); // Shorthand for heading level 2
engine.executeCommand('paragraph'); // Shorthand for normal text
```

If `baseHeadingLevel` is set in options, heading levels are offset. For example, with `baseHeadingLevel: 2`, `heading(1)` renders as `<h2>`.

### Lists

```js
registerListCommands(engine);

engine.executeCommand('orderedList'); // Toggle numbered list (Mod+Shift+7)
engine.executeCommand('unorderedList'); // Toggle bullet list (Mod+Shift+8)
engine.executeCommand('taskList'); // Toggle task list with checkboxes
engine.executeCommand('indent'); // Increase indentation
engine.executeCommand('outdent'); // Decrease indentation
```

### Alignment

```js
registerAlignmentCommands(engine);

engine.executeCommand('alignLeft');
engine.executeCommand('alignCenter');
engine.executeCommand('alignRight');
engine.executeCommand('alignJustify');
```

### Links

```js
registerLinkCommands(engine);

// Insert a new link (Mod+K)
engine.executeCommand('insertLink', {
  href: 'https://example.com',
  text: 'Example', // optional — uses selection if omitted
  target: '_blank', // optional
});

// Edit an existing link
engine.executeCommand('editLink', {
  href: 'https://new-url.com',
  text: 'New text', // optional
  target: '_self', // optional
});

// Remove link, keep text
engine.executeCommand('removeLink');
```

### Images

```js
registerImageCommands(engine);

// Insert image
engine.executeCommand('insertImage', {
  src: 'https://example.com/photo.jpg',
  alt: 'A photo', // optional
  width: 400, // optional
  height: 300, // optional
});

// Resize an existing image
engine.executeCommand('resizeImage', {
  element: imgElement,
  width: 200,
  height: 150,
});

// Align image
engine.executeCommand('alignImage', {
  element: imgElement,
  alignment: 'center', // 'left', 'right', 'center'
});

// Remove image
engine.executeCommand('removeImage', { element: imgElement });
```

### Tables

```js
registerTableCommands(engine);

// Insert a 4x3 table (first row is <thead> with <th> cells)
engine.executeCommand('insertTable', { rows: 4, cols: 3 });

// Row operations
engine.executeCommand('addRowBefore');
engine.executeCommand('addRowAfter');
engine.executeCommand('deleteRow');

// Column operations
engine.executeCommand('addColBefore');
engine.executeCommand('addColAfter');
engine.executeCommand('deleteCol');

// Toggle header row (convert first row to/from <thead>)
engine.executeCommand('toggleHeaderRow');

// Sort by column (physically reorders rows, sets data-sort-dir on <th>)
engine.executeCommand('sortTable', {
  columnIndex: 0,
  direction: 'asc',
});
engine.executeCommand('sortTable', {
  columnIndex: 0,
  direction: 'desc',
  dataType: 'numeric',
});

// Multi-column sort
engine.executeCommand('sortTable', {
  keys: [
    { columnIndex: 0, direction: 'asc' },
    { columnIndex: 1, direction: 'desc', dataType: 'numeric' },
  ],
});

// Filter rows (non-destructive, hides non-matching rows)
engine.executeCommand('filterTable', {
  columnIndex: 0,
  filterValue: 'search term',
});
engine.executeCommand('clearTableFilters');

// Cell formatting (stores raw value in data-raw-value, displays formatted)
engine.executeCommand('formatCell', { format: 'number' });
engine.executeCommand('formatCell', {
  format: 'currency',
  options: { currency: 'EUR' },
});
engine.executeCommand('formatCell', { format: 'percentage' });
engine.executeCommand('formatCell', {
  format: 'date',
  options: { dateStyle: 'long' },
});

// Formula evaluation (cells with data-formula attribute)
engine.executeCommand('evaluateFormulas');

// Merge and split
engine.executeCommand('mergeCells', { cells: [cell1, cell2] });
engine.executeCommand('splitCell');
```

#### Table command reference

| Command             | Arguments                                                   | Description                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `insertTable`       | `{ rows, cols }`                                            | Insert a table with `<thead>` header row. Default 3x3.                                                                                                              |
| `addRowBefore`      | —                                                           | Insert a row above the current cell                                                                                                                                 |
| `addRowAfter`       | —                                                           | Insert a row below the current cell                                                                                                                                 |
| `addColBefore`      | —                                                           | Insert a column to the left                                                                                                                                         |
| `addColAfter`       | —                                                           | Insert a column to the right                                                                                                                                        |
| `deleteRow`         | —                                                           | Delete the current row (removes table if last row)                                                                                                                  |
| `deleteCol`         | —                                                           | Delete the current column (removes table if last column)                                                                                                            |
| `deleteTable`       | —                                                           | Delete the entire table                                                                                                                                             |
| `mergeCells`        | `{ cells: [el, el, ...] }`                                  | Merge an array of cell elements                                                                                                                                     |
| `splitCell`         | —                                                           | Split a merged cell back into individual cells                                                                                                                      |
| `toggleHeaderRow`   | —                                                           | Convert first row to/from `<thead>` with `<th>` cells                                                                                                               |
| `sortTable`         | `{ columnIndex, direction, dataType }` or `{ keys: [...] }` | Sort rows. Direction: `'asc'` or `'desc'`. DataType: `'alphabetical'`, `'numeric'`, or `'date'` (auto-detected if omitted). Use `keys` array for multi-column sort. |
| `filterTable`       | `{ columnIndex, filterValue }`                              | Hide rows where the cell at `columnIndex` doesn't contain `filterValue` (case-insensitive substring match). Pass empty string to clear a single column filter.      |
| `clearTableFilters` | —                                                           | Remove all column filters and show all rows                                                                                                                         |
| `formatCell`        | `{ format, options }`                                       | Format the focused cell. Format: `'number'`, `'currency'`, `'percentage'`, `'date'`. Options: `{ decimals, currency, dateStyle }`.                                  |
| `evaluateFormulas`  | —                                                           | Re-evaluate all formula cells in the focused table                                                                                                                  |

#### Sort data types

The sort command auto-detects the data type of a column by sampling its values:

- **numeric** — if >70% of values parse as numbers
- **date** — if >70% of values parse as valid dates
- **alphabetical** — default, uses locale-aware `localeCompare`

You can override auto-detection by passing `dataType` explicitly, or provide a global custom comparator via `engine.options.tableSortComparator`:

```js
engine.options.tableSortComparator = (
  a,
  b,
  dataType,
  columnIndex,
) => {
  // Custom comparison — return negative, zero, or positive
  return a.localeCompare(b, 'de'); // German locale sort
};
```

#### Formulas

Cells starting with `=` are treated as formulas when the `TablePlugin` is active. On plugin initialization, cells with `=` prefix text are automatically detected and converted to formula cells (the `data-formula` attribute is added automatically — you do not need to set it manually in your HTML). The leading `=` is stripped before evaluation, and numeric results are rounded to 10 decimal places to avoid floating point display artifacts (e.g., `249.95` instead of `249.95000000000002`). On focus, the formula text is shown for editing; on blur, it is re-evaluated.

**Supported functions:**

| Function  | Description               | Example                     |
| --------- | ------------------------- | --------------------------- |
| `SUM`     | Sum all values in a range | `=SUM(A1:A10)`              |
| `AVERAGE` | Arithmetic mean of values | `=AVERAGE(B2:B8)`           |
| `COUNT`   | Count non-empty cells     | `=COUNT(A1:A20)`            |
| `MIN`     | Smallest value in a range | `=MIN(C1:C5)`               |
| `MAX`     | Largest value in a range  | `=MAX(C1:C5)`               |
| `IF`      | Conditional value         | `=IF(A1>10, "high", "low")` |
| `CONCAT`  | Join values into a string | `=CONCAT(A1, " ", B1)`      |

**Cell references:** A1 notation (e.g., `A1`, `B3`, `AA1`), ranges (e.g., `A1:A5`, `B2:D4`)

**Operators:** `+`, `-`, `*`, `/`, `>`, `<`, `>=`, `<=`, `==`

**Formula examples:**

```
=SUM(A2:A10)           Sum of column A, rows 2-10
=AVERAGE(B2:B8)        Average of column B, rows 2-8
=A1+B1*2               Arithmetic with cell references
=IF(A1>100, "over", "under")   Conditional logic
=MAX(A1:A5)-MIN(A1:A5)         Range (max minus min)
=CONCAT(A1, " - ", B1)         String concatenation
=COUNT(A1:D1)          Count non-empty cells in a row
```

**Circular reference detection:** If cell A1 references B1, and B1 references A1, both cells display `#CIRC!`.

**Programmatic evaluation:** Call `evaluateTableFormulas(tableElement)` to re-evaluate all formula cells in a specific table element without needing selection context.

```js
import { evaluateTableFormulas } from '@remyxjs/core';

const table = document.querySelector('table.rmx-table');
evaluateTableFormulas(table);
```

#### Cell formatting

The `formatCell` command uses the browser's built-in `Intl` APIs for locale-aware formatting:

```js
// Number: "1,234.50"
engine.executeCommand('formatCell', {
  format: 'number',
  options: { decimals: 2 },
});

// Currency: "$1,234.50" (or locale equivalent)
engine.executeCommand('formatCell', {
  format: 'currency',
  options: { currency: 'USD' },
});

// Euro: "1.234,50 €"
engine.executeCommand('formatCell', {
  format: 'currency',
  options: { currency: 'EUR' },
});

// Percentage: "75.0%" (raw value 0.75 × 100)
engine.executeCommand('formatCell', {
  format: 'percentage',
  options: { decimals: 1 },
});

// Date: locale-formatted date
engine.executeCommand('formatCell', {
  format: 'date',
  options: { dateStyle: 'long' },
});
```

The raw value is preserved in the `data-raw-value` attribute so it can be used for sorting and formula calculations even after formatting.

#### Clipboard interop

When copying from a Remyx table, the clipboard contains both:

- `text/html` — clean `<table>` markup
- `text/plain` — TSV (tab-separated values) for pasting into spreadsheets

When pasting into a table cell:

- **TSV data** (from Excel, Sheets, or tab-separated text) is detected and inserted into the grid starting at the caret cell
- **HTML tables** (from Excel or Sheets) are converted to TSV and inserted the same way
- Rows and columns are automatically added if the pasted data exceeds the current table dimensions

Google Sheets `<google-sheets-html-origin>` tags and Excel `mso-*` styles are automatically stripped during paste.

### Blocks

```js
registerBlockCommands(engine);

engine.executeCommand('blockquote'); // Toggle blockquote (Mod+Shift+9)
engine.executeCommand('codeBlock'); // Toggle code block (Mod+Shift+C)
engine.executeCommand('codeBlock', { language: 'javascript' }); // Code block with language
engine.executeCommand('horizontalRule'); // Insert <hr>
```

### Fonts

```js
registerFontCommands(engine);

engine.executeCommand('fontFamily', 'Georgia');
engine.executeCommand('fontSize', '18px'); // Accepts px, pt, em, rem, %
engine.executeCommand('foreColor', '#ff0000');
engine.executeCommand('backColor', '#ffff00');
```

### Media Embeds

```js
registerMediaCommands(engine);

// Embed a YouTube, Vimeo, or Dailymotion video
engine.executeCommand('embedMedia', {
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
});

// Remove an embed
engine.executeCommand('removeEmbed', { element: embedElement });
```

### Find & Replace

```js
registerFindReplaceCommands(engine);

// Search (Mod+F)
engine.executeCommand('find', {
  text: 'hello',
  caseSensitive: false, // optional, default false
});

engine.executeCommand('findNext');
engine.executeCommand('findPrev');

// Replace current match
engine.executeCommand('replace', { replaceText: 'world' });

// Replace all matches
engine.executeCommand('replaceAll', {
  searchText: 'hello',
  replaceText: 'world',
});

// Listen for results
engine.on('find:results', ({ total, current }) => {
  console.log(`Match ${current + 1} of ${total}`);
});
```

### Source Mode

```js
registerSourceModeCommands(engine);

// Toggle HTML source view (Mod+Shift+U)
engine.executeCommand('sourceMode');

engine.on('mode:change', ({ sourceMode }) => {
  console.log('Source mode:', sourceMode);
});
```

### Fullscreen

```js
registerFullscreenCommands(engine);

// Toggle fullscreen (Mod+Shift+F)
engine.executeCommand('fullscreen');

engine.on('fullscreen:toggle', ({ fullscreen }) => {
  console.log('Fullscreen:', fullscreen);
});
```

### Distraction-Free Mode

```js
registerDistractionFreeCommands(engine);

// Toggle distraction-free mode (Mod+Shift+D)
engine.executeCommand('distractionFree');
```

Hides toolbar, status bar, and menu bar. Chrome reappears on mouse movement and auto-hides after 3 seconds of inactivity. Adds `.rmx-distraction-free` class to the editor root.

### Split View

```js
registerSplitViewCommands(engine);

// Toggle split view (Mod+Shift+V)
engine.executeCommand('toggleSplitView');
```

Opens a side-by-side preview pane showing rendered HTML or markdown output. Adds `.rmx-split-view` class to the editor root.

### Color Presets

```js
registerColorPresetCommands(engine);

// Save a named color preset (persisted in localStorage)
engine.executeCommand('saveColorPreset', {
  name: 'Brand',
  colors: ['#e11d48', '#3b82f6', '#22c55e'],
});

// Load all saved presets
const presets = engine.executeCommand('loadColorPresets');

// Delete a preset
engine.executeCommand('deleteColorPreset', 'Brand');
```

### Typography Controls

```js
// Line height (applied as inline style to selected text)
engine.executeCommand('lineHeight', '1.8');

// Letter spacing
engine.executeCommand('letterSpacing', '0.05em');

// Paragraph spacing (margin-bottom on block elements)
engine.executeCommand('paragraphSpacing', '1.5em');
```

These commands are registered by `registerFontCommands(engine)`. A `typography` toolbar dropdown provides UI access to all three.

### Sticky Toolbar

The toolbar uses `position: sticky; top: 0` by default, remaining visible when scrolling long documents. No configuration needed.

### Markdown Toggle

```js
registerMarkdownToggleCommands(engine);

// Toggle between rich-text and markdown editing
engine.executeCommand('toggleMarkdown');

engine.on('mode:change:markdown', ({ markdownMode }) => {
  console.log('Markdown mode:', markdownMode);
});
```

### Attachments

```js
registerAttachmentCommands(engine);

engine.executeCommand('insertAttachment', {
  url: 'https://example.com/report.pdf',
  filename: 'report.pdf',
  filesize: '2.4 MB', // optional, displayed in UI
});

engine.executeCommand('removeAttachment', {
  element: attachmentElement,
});
```

### Document Import

```js
registerImportDocumentCommands(engine);

// Opens a native file picker for supported formats
engine.executeCommand('importDocument');
```

### Command Palette

The command palette provides a searchable overlay listing all available editor commands. It is a React-layer feature (see `@remyxjs/react`), but the command catalog and filter logic live in `@remyxjs/core`:

```js
import { SLASH_COMMAND_ITEMS, filterSlashItems } from '@remyxjs/core';

// Default catalog of ~30 command items across 6 categories:
// Text, Lists, Media, Layout, Insert, Advanced
// Insert category includes plugin commands: Callout, Math Equation,
// Table of Contents, Bookmark, Merge Tag, Comment
console.log(SLASH_COMMAND_ITEMS);

// Filter items by query (fuzzy substring match on label, description, keywords)
const matches = filterSlashItems(SLASH_COMMAND_ITEMS, 'head');
// → [{ id: 'heading1', label: 'Heading 1', ... }, { id: 'heading2', ... }, ...]
```

Each item has the shape `{ id, label, description, icon, keywords, category, action }`. The `action` function receives `(engine, openModal?)` and executes the command.

#### Recently-used commands

The last 5 executed commands are tracked in `localStorage` and pinned to the top of the palette under a "Recent" category when no search query is active:

```js
import {
  getRecentCommands,
  recordRecentCommand,
  clearRecentCommands,
} from '@remyxjs/core';

// Commands are recorded automatically when executed via the palette.
// You can also record manually:
recordRecentCommand('heading1');

// Read the recent list (most recent first, max 5)
getRecentCommands(); // → ['heading1']

// Clear the history
clearRecentCommands();

// filterSlashItems pins recent items by default (disable with { pinRecent: false })
filterSlashItems(SLASH_COMMAND_ITEMS, ''); // recent items at top
filterSlashItems(SLASH_COMMAND_ITEMS, '', { pinRecent: false }); // no pinning
```

#### Custom command items

Register custom command items that appear alongside built-in commands in the palette:

```js
import {
  registerCommandItems,
  unregisterCommandItem,
  getCustomCommandItems,
} from '@remyxjs/core';

// Register a single item
registerCommandItems({
  id: 'insertSignature',
  label: 'Insert Signature',
  description: 'Add your email signature',
  icon: '✍️',
  keywords: ['signature', 'sign', 'email'],
  category: 'Custom',
  action: (engine) =>
    engine.executeCommand('insertHTML', '<p>— John Doe</p>'),
});

// Register multiple items at once
registerCommandItems([
  {
    id: 'draft',
    label: 'Save Draft',
    description: 'Save as draft',
    icon: '💾',
    keywords: ['save', 'draft'],
    category: 'Custom',
    action: (engine) => saveDraft(engine.getHTML()),
  },
  {
    id: 'publish',
    label: 'Publish',
    description: 'Publish document',
    icon: '🚀',
    keywords: ['publish', 'post'],
    category: 'Custom',
    action: (engine) => publish(engine.getHTML()),
  },
]);

// Re-registering the same id replaces the previous item
registerCommandItems({
  id: 'insertSignature',
  label: 'Insert Sig (updated)' /* ... */,
});

// Remove a custom item
unregisterCommandItem('insertSignature');

// Get all registered custom items
getCustomCommandItems(); // → [{ id: 'draft', ... }, { id: 'publish', ... }]
```

## Autosave

Framework-agnostic autosave engine with pluggable storage providers. Debounces saves after content changes, runs periodic interval saves, and detects recoverable content on startup.

### Storage Providers

Five built-in providers cover browser storage, filesystem, cloud, and custom backends:

```js
import {
  LocalStorageProvider,
  SessionStorageProvider,
  FileSystemProvider,
  CloudProvider,
  CustomProvider,
  createStorageProvider,
} from '@remyxjs/core';
```

| Provider                 | Use Case                  | Config Shorthand                |
| ------------------------ | ------------------------- | ------------------------------- |
| `LocalStorageProvider`   | Browser apps (default)    | `'localStorage'` or omit        |
| `SessionStorageProvider` | Tab-scoped saves          | `'sessionStorage'`              |
| `FileSystemProvider`     | Node / Electron / Tauri   | `{ writeFn, readFn, deleteFn }` |
| `CloudProvider`          | AWS S3, GCP, any HTTP API | `{ endpoint, headers, ... }`    |
| `CustomProvider`         | Full consumer control     | `{ save, load, clear }`         |

Each provider implements `save(key, content)`, `load(key)`, and `clear(key)`. Content is wrapped in a JSON envelope with `{ content, timestamp, version }`.

**Factory function** — `createStorageProvider(config)` resolves shorthand strings or objects into provider instances:

```js
const local = createStorageProvider(); // LocalStorageProvider
const session = createStorageProvider('sessionStorage'); // SessionStorageProvider
const cloud = createStorageProvider({
  // CloudProvider
  endpoint: 'https://api.example.com/autosave',
  headers: { Authorization: 'Bearer token123' },
});
const fs = createStorageProvider({
  // FileSystemProvider
  writeFn: async (key, data) => writeFile(`/saves/${key}.json`, data),
  readFn: async (key) => readFile(`/saves/${key}.json`),
  deleteFn: async (key) => unlink(`/saves/${key}.json`),
});
```

**CloudProvider options** for AWS S3 / GCP / custom APIs:

```js
const s3Provider = new CloudProvider({
  endpoint: 'https://my-bucket.s3.amazonaws.com',
  buildUrl: (key) => getPresignedUploadUrl(key), // S3 presigned URL
  buildLoadUrl: (key) => getPresignedDownloadUrl(key),
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  fetchFn: fetch, // optional custom fetch
});
```

### AutosaveManager API

```js
import { AutosaveManager } from '@remyxjs/core';

const manager = new AutosaveManager(engine, {
  provider: 'localStorage', // or any provider config
  key: 'doc-123', // storage key (default: 'rmx-default')
  interval: 30000, // periodic save interval in ms (default: 30s)
  debounce: 2000, // debounce delay after content change (default: 2s)
  enabled: true, // toggle on/off (default: true)
});

manager.init(); // start listening to content:change

await manager.save(); // force an immediate save
await manager.checkRecovery(engine.getHTML()); // check for recoverable content
await manager.clearRecovery(); // clear stored recovery data

manager.destroy(); // cleanup timers, listeners, final save
```

### Autosave Events

```js
engine.eventBus.on('autosave:saving', () => {
  console.log('Saving...');
});

engine.eventBus.on('autosave:saved', ({ timestamp }) => {
  console.log(`Saved at ${new Date(timestamp).toLocaleTimeString()}`);
});

engine.eventBus.on('autosave:error', ({ error }) => {
  console.error('Autosave failed:', error.message);
});

engine.eventBus.on(
  'autosave:recovered',
  ({ recoveredContent, timestamp }) => {
    if (confirm('Unsaved changes found. Restore?')) {
      engine.setHTML(recoveredContent);
    }
  },
);
```

## Plugin System

### Creating Plugins

```js
import { createPlugin } from '@remyxjs/core';

const HighlightPlugin = createPlugin({
  name: 'highlight',

  init(api) {
    // api is a restricted PluginAPI (see below)
    api.on('selection:change', (formats) => {
      // React to selection changes
    });
  },

  destroy(api) {
    // Cleanup (event listeners registered via api.on are auto-cleaned)
  },

  // Optional: add commands
  commands: [
    {
      name: 'highlight',
      execute(engine) {
        document.execCommand('hiliteColor', false, 'yellow');
      },
      isActive(engine) {
        return (
          engine.selection.getActiveFormats().backColor === 'yellow'
        );
      },
      shortcut: 'mod+shift+h',
    },
  ],

  // Optional: add toolbar buttons
  toolbarItems: [
    {
      name: 'highlight',
      command: 'highlight',
      icon: '🖍',
      tooltip: 'Highlight',
      group: 'formatting',
    },
  ],

  // Optional: add status bar items
  statusBarItems: [
    {
      name: 'highlight-status',
      render: (engine) =>
        engine.selection.getActiveFormats().backColor || 'none',
    },
  ],

  // Optional: add context menu items
  contextMenuItems: [
    {
      name: 'highlight-menu',
      label: 'Highlight selection',
      command: 'highlight',
    },
  ],
});

// Register the plugin
engine.plugins.register(HighlightPlugin);
```

**Full engine access:** By default, plugins receive a restricted API. If your plugin needs direct engine access, set `requiresFullAccess: true`:

```js
const AdvancedPlugin = createPlugin({
  name: 'advanced',
  requiresFullAccess: true,
  init(engine) {
    // Full EditorEngine instance — use with care
    engine.element.addEventListener('dblclick', handleDblClick);
  },
  destroy(engine) {
    engine.element.removeEventListener('dblclick', handleDblClick);
  },
});
```

### Lifecycle Hooks

Beyond `init`/`destroy`, plugins can declare `onContentChange` and `onSelectionChange` callbacks that are automatically wired to engine events:

```js
const AnalyticsPlugin = createPlugin({
  name: 'analytics',
  onContentChange(api) {
    // Called on every content:change event
    trackEvent('content_edit', { length: api.getText().length });
  },
  onSelectionChange(api) {
    // Called on every selectionchange event
    const formats = api.getActiveFormats();
    updateToolbarState(formats);
  },
});
```

Each lifecycle callback is sandboxed — if it throws, the error is caught, logged, and emitted as a `plugin:error` event without affecting other plugins.

### Plugin Dependencies

Declare dependencies to control initialization order:

```js
const BasePlugin = createPlugin({
  name: 'base',
  init() {
    /* ... */
  },
});

const ExtensionPlugin = createPlugin({
  name: 'extension',
  dependencies: ['base'], // initialized after 'base'
  init(api) {
    /* can safely use base's commands */
  },
});
```

Dependencies are resolved using topological sort. Circular dependencies are detected and reported via `plugin:circularDependency` events. Missing dependencies are silently skipped.

### Scoped Plugin Settings

Plugins can define a settings schema with type validation:

```js
const ThemePlugin = createPlugin({
  name: 'custom-theme',
  settingsSchema: [
    {
      key: 'fontSize',
      type: 'number',
      label: 'Font Size',
      defaultValue: 16,
      validate: (v) => v >= 8 && v <= 72,
    },
    {
      key: 'fontFamily',
      type: 'string',
      label: 'Font Family',
      defaultValue: 'sans-serif',
    },
    {
      key: 'mode',
      type: 'select',
      label: 'Mode',
      defaultValue: 'light',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
      ],
    },
  ],
  defaultSettings: {
    fontSize: 16,
    fontFamily: 'sans-serif',
    mode: 'light',
  },
  init(api) {
    const size = api.getSetting('fontSize');
    api.element.style.fontSize = `${size}px`;
  },
});

// Settings are accessible from outside the plugin:
engine.plugins.getPluginSetting('custom-theme', 'fontSize'); // 16
engine.plugins.setPluginSetting('custom-theme', 'fontSize', 18); // validates + emits event
engine.plugins.getPluginSettings('custom-theme'); // { fontSize: 18, fontFamily: 'sans-serif', mode: 'light' }
```

### Plugin Registry

A global registry for plugin discovery and marketplace concepts:

```js
import {
  registerPluginInRegistry,
  searchPluginRegistry,
  listRegisteredPlugins,
} from '@remyxjs/core';

// Register a plugin for discovery
registerPluginInRegistry({
  name: 'math-equations',
  version: '1.2.0',
  description: 'LaTeX/KaTeX math rendering',
  author: 'Community',
  tags: ['math', 'latex', 'katex', 'equations'],
  factory: () => MathPlugin(),
});

// Search the registry
searchPluginRegistry('math'); // → [{ name: 'math-equations', ... }]
searchPluginRegistry('latex'); // → [{ name: 'math-equations', ... }] (matches tags)
listRegisteredPlugins(); // → all registered entries

// Install from registry
const entry = searchPluginRegistry('math')[0];
engine.plugins.register(entry.factory());
```

### Plugin Metadata

Plugins can include metadata for documentation and registry integration:

```js
const MyPlugin = createPlugin({
  name: 'my-plugin',
  version: '2.1.0',
  description: 'Adds custom formatting options',
  author: 'Your Name',
  // ... rest of plugin definition
});
```

### Plugin API (Restricted)

Plugins without `requiresFullAccess` receive a sandboxed API:

| Property/Method                 | Description                                         |
| ------------------------------- | --------------------------------------------------- |
| `element`                       | Editor DOM element (read-only)                      |
| `options`                       | Engine options (read-only copy)                     |
| `executeCommand(name, ...args)` | Execute a command                                   |
| `on(event, handler)`            | Subscribe to events                                 |
| `off(event, handler)`           | Unsubscribe                                         |
| `getSelection()`                | Browser Selection object                            |
| `getRange()`                    | Current Range in editor                             |
| `getActiveFormats()`            | Current formatting state                            |
| `getHTML()`                     | Get content as HTML                                 |
| `getText()`                     | Get content as plain text                           |
| `isEmpty()`                     | Check if editor is empty                            |
| `getSetting(key)`               | Get a plugin-scoped setting value                   |
| `setSetting(key, value)`        | Set a plugin-scoped setting value (with validation) |

### Built-in Plugins

**WordCountPlugin** — Emits `wordcount:update` with `{ wordCount, charCount }` on every content change.

```js
import { WordCountPlugin } from '@remyxjs/core';
engine.plugins.register(WordCountPlugin);
engine.on('wordcount:update', ({ wordCount, charCount }) => {
  document.querySelector('#count').textContent = `${wordCount} words`;
});
```

**AutolinkPlugin** — Automatically converts typed URLs into clickable links when the user presses Space or Enter.

```js
import { AutolinkPlugin } from '@remyxjs/core';
engine.plugins.register(AutolinkPlugin);
```

**PlaceholderPlugin** — Shows placeholder text when the editor is empty.

```js
import { PlaceholderPlugin } from '@remyxjs/core';
engine.plugins.register(PlaceholderPlugin('Start writing...'));
```

**SyntaxHighlightPlugin** — Automatic syntax highlighting for `<pre><code>` blocks. Detects language from `data-language` attribute or auto-detects from content. Highlights using `.rmx-syn-*` CSS classes that adapt to all built-in themes. Includes line numbers toggle, copy-to-clipboard button, inline code highlighting, and an extensible language registry.

```js
import {
  SyntaxHighlightPlugin,
  SUPPORTED_LANGUAGES,
  detectLanguage,
  tokenize,
  registerLanguage,
  unregisterLanguage,
  runRules,
} from '@remyxjs/core';

// Register the plugin
engine.plugins.register(SyntaxHighlightPlugin());

// Set language on the focused code block
engine.executeCommand('setCodeLanguage', { language: 'python' });

// Get language of the focused code block
const lang = engine.executeCommand('getCodeLanguage'); // 'python' or null

// Toggle line numbers on the focused code block
engine.executeCommand('toggleLineNumbers');

// Available languages (for building UI dropdowns)
console.log(SUPPORTED_LANGUAGES);
// [{ id: 'javascript', label: 'JavaScript' }, { id: 'python', label: 'Python' }, ...]

// Auto-detect language from code content
const detected = detectLanguage('def hello():\n    print("hi")');
// 'python'

// Tokenize code programmatically
const tokens = tokenize('const x = 42', 'javascript');
// [{ type: 'keyword', value: 'const' }, { type: 'plain', value: ' x ' }, ...]
```

**Supported languages:** JavaScript/TypeScript, Python, CSS, SQL, JSON, Bash/Shell, Rust, Go, Java, HTML/XML. Language aliases are supported (e.g., `js`, `ts`, `tsx`, `py`, `sh`, `rs`, `golang`).

#### Line numbers

Add the `data-line-numbers` attribute to any `<pre>` element (or use the `toggleLineNumbers` command) to show a line number gutter. Line numbers update automatically when the code content changes.

```js
engine.executeCommand('toggleLineNumbers'); // Toggle on the focused code block
```

#### Copy-to-clipboard

Every code block automatically gets a copy button (top-right corner, visible on hover). The button uses the async Clipboard API with an `execCommand('copy')` fallback for insecure contexts. A ✓ checkmark appears briefly after a successful copy.

#### Inline code highlighting

Add a `data-language` attribute to inline `<code>` elements (not inside `<pre>`) for mini syntax highlighting:

```html
<code data-language="js">const x = 42</code>
```

The inline code element will be tokenized with the same `rmx-syn-*` classes used by code blocks.

#### Custom language registration

Register custom language tokenizers at runtime. The new language immediately becomes available for highlighting and appears in `SUPPORTED_LANGUAGES`.

```js
import {
  registerLanguage,
  unregisterLanguage,
  runRules,
} from '@remyxjs/core';

// Define tokenizer rules (same format used by all built-in tokenizers)
const RUBY_RULES = [
  [/#[^\n]*/g, 'rmx-syn-comment'],
  [/"(?:[^"\\]|\\.)*"/g, 'rmx-syn-string'],
  [/'(?:[^'\\]|\\.)*'/g, 'rmx-syn-string'],
  [
    /\b(?:def|end|class|module|if|else|elsif|unless|do|while|for|return|yield|begin|rescue|ensure)\b/g,
    'rmx-syn-keyword',
  ],
  [
    /\b(?:puts|print|require|include|attr_accessor|attr_reader)\b/g,
    'rmx-syn-builtin',
  ],
  [/:\w+/g, 'rmx-syn-entity'],
  [/\b\d[\d_.]*\b/g, 'rmx-syn-number'],
];

// Register with the built-in rule engine
registerLanguage(
  'ruby',
  'Ruby',
  (code) => runRules(code, RUBY_RULES),
  ['rb'],
);

// Now works everywhere
tokenize('puts "hello"', 'ruby'); // tokenize API
tokenize('puts "hello"', 'rb'); // alias works too
engine.executeCommand('setCodeLanguage', { language: 'ruby' }); // in editor

// Remove later if needed
unregisterLanguage('ruby', ['rb']);
```

**TablePlugin** — Enhanced table features including column/row resize handles, click-to-sort on header cells (single + multi-column with Shift), filterable rows with per-column dropdown UI, inline cell formulas with a recursive-descent expression engine, cell formatting (number, currency, percentage, date), and sticky header rows. Uses MutationObserver to auto-detect tables and attach functionality.

```js
import { TablePlugin, evaluateTableFormulas } from '@remyxjs/core';

// Register the plugin
engine.plugins.register(TablePlugin());

// The plugin automatically:
// - Attaches resize handles to table column/row borders
// - Makes <th> cells clickable for sorting (Shift+click for multi-sort)
// - Injects filter buttons into header cells
// - Evaluates formulas on cell blur (cells starting with '=')
// - Re-evaluates all formulas on content change (debounced)

// Programmatically evaluate all formulas in a table
evaluateTableFormulas(tableElement);
```

**CommentsPlugin** — Inline comment threads with @mention parsing, resolved/unresolved state, reply threads, comment-only mode, import/export, and DOM synchronization.

```js
import { CommentsPlugin, parseMentions } from '@remyxjs/core';

// Register the plugin
engine.plugins.register(
  CommentsPlugin({
    onComment: (thread) => saveToServer(thread),
    onResolve: ({ thread, resolved }) => updateServer(thread),
    onDelete: (thread) => deleteFromServer(thread),
    onReply: ({ thread, reply }) => saveReply(thread.id, reply),
    mentionUsers: ['alice', 'bob', 'charlie'],
    commentOnly: false, // true = read-only editor with comment support
  }),
);

// The plugin exposes engine._comments API:
engine._comments.addComment({
  author: 'Alice',
  body: 'This needs clarification @bob',
});
engine._comments.resolveComment(threadId, true);
engine._comments.replyToComment(threadId, {
  author: 'Bob',
  body: 'Fixed!',
});
engine._comments.deleteComment(threadId);
engine._comments.navigateToComment(threadId); // scroll to + select
engine._comments.getAllThreads(); // all threads (newest first)
engine._comments.getUnresolvedThreads();
engine._comments.getResolvedThreads();
engine._comments.exportThreads(); // JSON-serializable array
engine._comments.importThreads(data); // load from server

// Parse @mentions from text
parseMentions('Hello @alice and @bob'); // → ['alice', 'bob']
```

**CalloutPlugin** — Styled callout/alert/admonition blocks with 7 built-in types, custom type registration, collapsible toggle, nested content, and GitHub-flavored alert syntax auto-conversion.

```js
import {
  CalloutPlugin,
  registerCalloutType,
  getCalloutTypes,
  parseGFMAlert,
} from '@remyxjs/core';

// Register the plugin
engine.plugins.register(CalloutPlugin());

// Insert a callout at the cursor
engine.executeCommand('insertCallout', { type: 'warning' });
engine.executeCommand('insertCallout', {
  type: 'tip',
  collapsible: true,
  title: 'Pro tip',
});
engine.executeCommand('insertCallout', {
  type: 'info',
  content: '<p>Custom HTML content</p>',
});

// Change type of the focused callout
engine.executeCommand('changeCalloutType', 'error');

// Toggle collapse on the focused callout
engine.executeCommand('toggleCalloutCollapse');

// Remove a callout (unwrap its content back into the editor)
engine.executeCommand('removeCallout');

// Register a custom callout type
registerCalloutType({
  type: 'security',
  label: 'Security',
  icon: '🔒',
  color: '#dc2626',
});

// List all types
getCalloutTypes(); // → [{ type: 'info', ... }, { type: 'warning', ... }, ..., { type: 'security', ... }]

// GFM alert parsing (auto-converts blockquotes like "> [!NOTE]\nText")
parseGFMAlert('[!WARNING]\nBe careful'); // → { type: 'warning', body: 'Be careful' }
```

**LinkPlugin** — Link previews, broken link detection, auto-linking, click analytics, bookmark anchors, and internal link suggestions.

```js
import { LinkPlugin, detectLinks, slugify } from '@remyxjs/core';

engine.plugins.register(
  LinkPlugin({
    onLinkClick: ({ href, text, timestamp }) => trackClick(href),
    onUnfurl: async (url) => {
      const res = await fetch(
        `/api/unfurl?url=${encodeURIComponent(url)}`,
      );
      return res.json(); // { title, description, image }
    },
    validateLink: async (url) => {
      const res = await fetch(url, { method: 'HEAD' });
      return res.ok;
    },
    onBrokenLink: (url, el) => console.warn('Broken:', url),
    autoLink: true, // auto-convert URLs/emails/phones on Space/Enter
    showPreviews: true, // hover tooltips on links
    scanInterval: 60000, // broken link scan interval (ms)
  }),
);

// Bookmark anchors for intra-document linking
engine.executeCommand('insertBookmark', {
  name: 'Introduction',
  id: 'intro',
});
engine.executeCommand('linkToBookmark', 'intro'); // link selected text to #intro
engine.executeCommand('getBookmarks'); // → [{ id, name, element }]
engine.executeCommand('scanBrokenLinks'); // manual scan

// Utility functions
detectLinks('Visit https://example.com or email alice@test.com');
// → [{ type: 'url', value: '...', index: 6 }, { type: 'email', value: '...', index: 36 }]
slugify('Section #1: Overview!'); // → 'section-1-overview'
```

**TemplatePlugin** — Merge tags, conditional blocks, repeatable sections, live preview, and pre-built template library.

```js
import {
  TemplatePlugin,
  renderTemplate,
  extractTags,
  getTemplateLibrary,
} from '@remyxjs/core';

engine.plugins.register(TemplatePlugin());

// Insert a merge tag chip at the cursor
engine.executeCommand('insertMergeTag', 'recipient_name');

// Load a pre-built template
engine.executeCommand('loadTemplate', 'email');

// Preview with sample data (read-only mode)
engine.executeCommand('previewTemplate', {
  recipient_name: 'Alice',
  body: 'Welcome!',
});
engine.executeCommand('exitPreview');

// Export as JSON
const exported = engine.executeCommand('exportTemplate');
// → { html: '...{{recipient_name}}...', tags: ['recipient_name', 'body'], sampleData: {...} }

// Render template string with data
renderTemplate('Hello {{name}}!', { name: 'World' }); // → 'Hello World!'
renderTemplate('{{#if show}}visible{{/if}}', { show: true }); // → 'visible'
renderTemplate('{{#each items}}{{name}} {{/each}}', {
  items: [{ name: 'A' }, { name: 'B' }],
}); // → 'A B '
```

**KeyboardPlugin** — Vim/Emacs modes, auto-pairing, multi-cursor, jump-to-heading.

```js
import { KeyboardPlugin, getHeadings } from '@remyxjs/core';

// Vim mode
engine.plugins.register(KeyboardPlugin({ mode: 'vim' }));

// Emacs mode
engine.plugins.register(KeyboardPlugin({ mode: 'emacs' }));

// Default with auto-pair and custom bindings
engine.plugins.register(
  KeyboardPlugin({
    autoPair: true,
    keyBindings: { 'ctrl+shift+l': 'insertLink' },
  }),
);

// Multi-cursor: Cmd+D selects next occurrence
// Jump-to-heading: Cmd+Shift+G
// Get all headings: engine.executeCommand('getHeadings')
```

**DragDropPlugin** — Drop zones, cross-editor drag, file drops, block reorder with ghost preview. **Note:** This plugin is required for block drag handles to appear on hover. If using `BlockTemplatePlugin` for block-based editing, add `DragDropPlugin` alongside it for drag-to-reorder support.

```js
import { DragDropPlugin } from '@remyxjs/core';

engine.plugins.register(
  DragDropPlugin({
    onDrop: (event, data) => console.log('Dropped:', data.type),
    onFileDrop: (files) => uploadFiles(files),
    allowExternalDrop: true,
    showDropZone: true,
    enableReorder: true,
  }),
);

// Keyboard shortcuts for block reorder
engine.executeCommand('moveBlockUp'); // Cmd+Shift+ArrowUp
engine.executeCommand('moveBlockDown'); // Cmd+Shift+ArrowDown
```

**MathPlugin** — LaTeX/KaTeX math rendering with inline and block equations, symbol palette, equation numbering, and MathML export.

```js
import {
  MathPlugin,
  getSymbolPalette,
  parseMathExpressions,
  latexToMathML,
} from '@remyxjs/core';

engine.plugins.register(
  MathPlugin({
    renderMath: (latex, displayMode) =>
      katex.renderToString(latex, { displayMode }), // plug in KaTeX
  }),
);

// Insert inline math
engine.executeCommand('insertMath', {
  latex: 'E = mc^2',
  displayMode: false,
});

// Insert block equation (auto-numbered)
engine.executeCommand('insertMath', {
  latex: '\\sum_{i=1}^{n} x_i',
  displayMode: true,
});

// Symbol palette for building UIs
getSymbolPalette(); // → [{ category: 'Greek', symbols: [{ label: 'α', latex: '\\alpha' }, ...] }, ...]

// Parse math from text
parseMathExpressions('Inline $x^2$ and block $$y^2$$');
// → [{ type: 'block', src: 'y^2', ... }, { type: 'inline', src: 'x^2', ... }]

// Convert to MathML
latexToMathML('\\frac{a}{b}'); // → '<math ...><mfrac>...</mfrac></math>'
```

**TocPlugin** — Auto-generated table of contents, document outline, heading validation, and click-to-scroll navigation.

```js
import {
  TocPlugin,
  buildOutline,
  flattenOutline,
  renderTocHTML,
  validateHeadingHierarchy,
} from '@remyxjs/core';

engine.plugins.register(
  TocPlugin({
    numbering: true,
    onOutlineChange: (outline) => updateSidebar(outline),
  }),
);

// Insert a rendered TOC into the document
engine.executeCommand('insertToc');

// Get the outline programmatically
engine.executeCommand('getOutline'); // → [{ id, text, level, number, children: [...] }]

// Scroll to a heading
engine.executeCommand('scrollToHeading', 'chapter-1');

// Validate heading hierarchy (detect H1→H3 skips)
engine.executeCommand('validateHeadings');
// → [{ message: 'Heading level skipped: H1 → H3', element }]
```

**AnalyticsPlugin** — Readability scores, reading time, vocabulary level, sentence warnings, goal tracking, keyword density, and SEO hints.

```js
import {
  AnalyticsPlugin,
  analyzeContent,
  keywordDensity,
  seoAnalysis,
} from '@remyxjs/core';

engine.plugins.register(
  AnalyticsPlugin({
    wordsPerMinute: 200,
    targetWordCount: 1000,
    maxSentenceLength: 30,
    onAnalytics: (stats) => updateDashboard(stats),
  }),
);

// Toggle analytics panel visibility (emits 'analytics:toggle' event)
engine.executeCommand('toggleAnalytics');
// Available in toolbar, View menu, and command palette

// Get analytics
engine.executeCommand('getAnalytics');
// → { wordCount, charCount, sentenceCount, paragraphCount,
//     readability: { fleschKincaid, fleschReadingEase, gunningFog, colemanLiau, vocabularyLevel },
//     readingTime: { minutes, seconds, wordsPerMinute },
//     warnings: { longSentences, longParagraphs },
//     goalProgress: { target, current, percentage } }

// SEO analysis
engine.executeCommand('getSeoAnalysis', 'react');
// → { wordCount, headingCount, h1Count, keywordInfo: { count, density, positions }, hints: [...] }

// Keyword density
engine.executeCommand('getKeywordDensity', 'editor');
// → { count: 5, density: 2.3, positions: [12, 45, 78, 102, 150] }
```

**SpellcheckPlugin** — Spelling & grammar checking with inline underlines, writing-style presets, custom service integration, and persistent dictionary.

```js
import {
  SpellcheckPlugin,
  analyzeGrammar,
  STYLE_PRESETS,
} from '@remyxjs/core';

engine.plugins.register(
  SpellcheckPlugin({
    language: 'en-US', // BCP 47 language tag
    enabled: true, // enable on init
    grammarRules: true, // enable built-in grammar checking
    stylePreset: 'formal', // 'formal'|'casual'|'technical'|'academic'
    customService: {
      // optional external service
      check: async (text) => [...suggestions],
    },
    dictionary: ['Remyx', 'WYSIWYG'], // custom words to ignore
    persistent: true, // persist dictionary in localStorage
    onError: (errors) => {},
    onCorrection: ({ original, replacement }) => {},
  }),
);

// Toggle spellcheck on/off
engine.executeCommand('toggleSpellcheck');

// Run grammar check
engine.executeCommand('checkGrammar');

// Add word to dictionary
engine.executeCommand('addToDictionary', 'Remyx');

// Ignore a word for this session
engine.executeCommand('ignoreWord', 'colour');

// Change writing style preset
engine.executeCommand('setWritingStyle', 'casual');

// Get spellcheck stats
engine.executeCommand('getSpellcheckStats');
// → { total, grammar, style, byRule, enabled, stylePreset, language, dictionarySize, ignoredCount }

// Style presets control which rules fire:
// formal:    passive voice + wordiness + cliches + punctuation (all rules)
// casual:    cliches + punctuation only (relaxed grammar)
// technical: passive voice + punctuation (jargon OK, skip cliches)
// academic:  passive voice + wordiness + punctuation (citation-aware)
```

**Token types:** `comment`, `keyword`, `string`, `number`, `function`, `operator`, `punctuation`, `builtin`, `property`, `regex`, `decorator`, `type`, `tag`, `attr-name`, `attr-value`, `entity`.

**CollaborationPlugin** — Real-time collaborative editing with CRDT-based conflict resolution, live cursors, presence awareness, and configurable transport.

```js
import { CollaborationPlugin } from '@remyxjs/core';

engine.plugins.register(
  CollaborationPlugin({
    serverUrl: 'wss://signal.example.com',
    roomId: 'my-document-123',
    userName: 'Alice',
    userColor: '#6366f1',
    autoConnect: true, // connect on init (default: true)
    transport: 'websocket', // 'websocket' | 'webrtc' | custom transport
    offlineQueue: true, // queue changes while disconnected (default: true)
    awarenessTimeout: 30000, // ms before marking a peer as inactive
    onPeerJoined: (peer) => console.log(`${peer.name} joined`),
    onPeerLeft: (peer) => console.log(`${peer.name} left`),
    onSync: () => console.log('Document synced'),
    onError: (err) => console.error('Collaboration error:', err),
  }),
);

// Connect / disconnect manually (when autoConnect is false)
engine.executeCommand('collaborationConnect', {
  serverUrl: 'wss://signal.example.com',
  roomId: 'room-1',
  userName: 'Bob',
});
engine.executeCommand('collaborationDisconnect');

// Query state
engine.executeCommand('collaborationGetStatus');
// → 'connected' | 'disconnected' | 'connecting' | 'error'

engine.executeCommand('collaborationGetPeers');
// → [{ id, name, color, cursor, isActive }]
```

**Events:**

| Event                        | Payload              | When                           |
| ---------------------------- | -------------------- | ------------------------------ |
| `collaboration:connected`    | `{ roomId, peerId }` | Successfully connected to room |
| `collaboration:disconnected` | `{ reason }`         | Disconnected from room         |
| `collaboration:peer-joined`  | `{ peer }`           | A new peer joined the room     |
| `collaboration:peer-left`    | `{ peer }`           | A peer left the room           |
| `collaboration:sync`         | `{ documentState }`  | Document state synchronized    |
| `collaboration:error`        | `{ error, code }`    | Connection or sync error       |

**Custom transport interface:**

```js
const myTransport = {
  connect(roomId, handlers) {
    // handlers.onMessage(data) — call when receiving data
    // handlers.onConnect() — call when connected
    // handlers.onDisconnect(reason) — call when disconnected
    // Return a connection object with send(data) and close() methods
    return {
      send(data) {
        /* ... */
      },
      close() {
        /* ... */
      },
    };
  },
};

engine.plugins.register(
  CollaborationPlugin({
    transport: myTransport,
    roomId: 'room-1',
    userName: 'Charlie',
  }),
);
```

## Selection API

Access the selection subsystem via `engine.selection`:

```js
const sel = engine.selection;

// Read selection state
sel.isCollapsed(); // true if cursor (no range selected)
sel.getSelectedText(); // selected plain text
sel.getSelectedHTML(); // selected HTML fragment
sel.getBoundingRect(); // DOMRect for positioning floating UI

// Inspect formatting at cursor
const formats = sel.getActiveFormats();
// {
//   bold: true, italic: false, underline: false,
//   strikethrough: false, subscript: false, superscript: false,
//   heading: 'h2',
//   alignment: 'left',
//   orderedList: false, unorderedList: true,
//   blockquote: false, codeBlock: false,
//   link: { href: 'https://...', text: '...', target: '_blank' },
//   fontFamily: 'Georgia', fontSize: '16px',
//   foreColor: '#333', backColor: null,
// }

// Navigate the DOM
sel.getParentElement(); // nearest element containing cursor
sel.getParentBlock(); // nearest block element (div, p, li, etc.)
sel.getClosestElement('a'); // find ancestor by tag name

// Manipulate content at cursor
sel.insertHTML('<strong>injected</strong>');
sel.insertNode(document.createElement('hr'));
sel.wrapWith('mark', { class: 'highlight' });
sel.unwrap('mark');

// Save and restore position (survives DOM mutations)
const bookmark = sel.save();
// ... modify DOM ...
sel.restore(bookmark);

// Collapse cursor
sel.collapse(); // collapse to start
sel.collapse(true); // collapse to end
```

## History (Undo/Redo)

Access the history subsystem via `engine.history`:

```js
engine.history.undo(); // Undo last change
engine.history.redo(); // Redo
engine.history.canUndo(); // true if undo stack is not empty
engine.history.canRedo(); // true if redo stack is not empty
engine.history.snapshot(); // Force an immediate snapshot
engine.history.clear(); // Clear all history

// Events
engine.on('history:undo', () => updateUndoButton());
engine.on('history:redo', () => updateRedoButton());
```

History is configured via engine options:

```js
new EditorEngine(element, {
  history: {
    maxSize: 200, // Keep up to 200 undo states (default: 100)
    debounceMs: 500, // Wait 500ms of inactivity before snapshotting (default: 300)
  },
});
```

The history system uses a `MutationObserver` to detect changes and debounces snapshots to avoid capturing every keystroke. When undoing/redoing, the observer is disconnected to prevent re-recording the restoration.

## Keyboard Shortcuts

Access the keyboard subsystem via `engine.keyboard`:

```js
// Register custom shortcuts
engine.keyboard.register('mod+shift+h', 'highlight');
engine.keyboard.unregister('mod+shift+h');

// Look up shortcuts
engine.keyboard.getShortcutForCommand('bold'); // 'mod+b'
engine.keyboard.getShortcutLabel('mod+b'); // '⌘B' on Mac, 'Ctrl+B' on Windows
```

**Shortcut format:** Use `mod` for Ctrl (Windows/Linux) or Cmd (Mac). Combine with `shift`, `alt`, and a lowercase key: `'mod+shift+k'`.

**Default shortcuts:**

| Shortcut    | Command        |
| ----------- | -------------- |
| Mod+B       | bold           |
| Mod+I       | italic         |
| Mod+U       | underline      |
| Mod+Shift+X | strikethrough  |
| Mod+,       | subscript      |
| Mod+.       | superscript    |
| Mod+K       | insertLink     |
| Mod+Shift+7 | orderedList    |
| Mod+Shift+8 | unorderedList  |
| Mod+Shift+9 | blockquote     |
| Mod+Shift+C | codeBlock      |
| Mod+F       | find           |
| Mod+Shift+U | sourceMode     |
| Mod+Shift+F | fullscreen     |
| Mod+Z       | undo           |
| Mod+Shift+Z | redo           |
| Mod+Shift+P | commandPalette |

## Sanitizer

The sanitizer runs on every content read (`getHTML()`) and write (`setHTML()`), and on pasted/dropped content.

```js
// Default behavior — blocks dangerous content automatically
engine.getHTML(); // always sanitized

// Customize allowed tags, styles, and iframe domains via engine options
new EditorEngine(element, {
  sanitize: {
    allowedTags: {
      // tag name → array of allowed attributes
      div: ['class', 'id', 'style'],
      span: ['class', 'style'],
      a: ['href', 'target', 'rel', 'class'],
      img: ['src', 'alt', 'width', 'height', 'class'],
      mark: ['class'],
      // ... see schema.js for full defaults
    },
    allowedStyles: [
      'color',
      'background-color',
      'font-size',
      'font-family',
      'text-align',
      'text-decoration',
      'font-weight',
      'font-style',
      'margin',
      'padding',
      'border',
      'width',
      'height',
      // ... see schema.js for full defaults
    ],
    // Restrict which domains can be embedded via iframe
    iframeAllowedDomains: [
      'www.youtube.com',
      'youtube.com',
      'www.youtube-nocookie.com',
      'player.vimeo.com',
      'www.dailymotion.com',
      // Add your own domains here
    ],
  },
});
```

**Security protections:**

- Dangerous tags removed with children: `script`, `style`, `svg`, `math`, `form`, `object`, `embed`, `applet`, `template`
- All `on*` event handler attributes blocked
- `javascript:` and `vbscript:` URLs blocked
- CSS injection blocked: `expression()`, `@import`, `behavior:`, `javascript:`
- `<input>` restricted to `type="checkbox"` only
- `<iframe>` src restricted to allowed domains only (YouTube, Vimeo, Dailymotion by default; HTTPS only)
- `contenteditable` attribute stripped
- SVG data URIs blocked in image sources
- CSP-compatible: zero `document.execCommand` or `document.write` calls in source code
- SRI hash support for `loadGoogleFonts()` to verify CDN asset integrity

## Utilities

### HTML Helpers

```js
import {
  escapeHTML,
  escapeHTMLAttr,
  insertPlainText,
} from '@remyxjs/core';

// Escape HTML entities for safe insertion
escapeHTML('<script>alert("xss")</script>');
// '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

// Escape for use in HTML attributes (also escapes quotes)
escapeHTMLAttr('value with "quotes" & <brackets>');
// 'value with &quot;quotes&quot; &amp; &lt;brackets&gt;'

// Insert plain text into the editor (handles paragraphs and line breaks)
insertPlainText(engine, 'Line 1\n\nLine 2\nLine 3');
// Inserts: <p>Line 1</p><p>Line 2<br>Line 3</p>
```

### Markdown Conversion

```js
import { htmlToMarkdown, markdownToHtml } from '@remyxjs/core';

const md = htmlToMarkdown('<h1>Hello</h1><p>World</p>');
// # Hello\n\nWorld

const html = markdownToHtml('# Hello\n\nWorld');
// <h1>Hello</h1><p>World</p>
```

Supports GitHub Flavored Markdown (GFM): headings, bold, italic, links, images, lists, task lists, tables, code blocks (with language identifiers preserved), blockquotes, and horizontal rules.

### Document Conversion

```js
import {
  convertDocument,
  isImportableFile,
  getSupportedExtensions,
} from '@remyxjs/core';

// Check if a file can be imported
if (isImportableFile(file)) {
  const html = await convertDocument(file);
  engine.setHTML(html);
}

// Supported extensions string (for file input accept attribute)
const accept = getSupportedExtensions();
// '.pdf,.docx,.md,.html,.htm,.txt,.csv,.tsv,.rtf'
```

**Supported formats:** PDF (requires `pdfjs-dist`), DOCX (requires `mammoth`), Markdown, HTML, TXT, CSV, TSV, RTF.

PDF and DOCX converters use dynamic imports — the heavy libraries are only loaded when a file of that type is imported.

### Export

```js
import {
  exportAsMarkdown,
  exportAsPDF,
  exportAsDocx,
} from '@remyxjs/core';

// Export as Markdown file download
exportAsMarkdown(engine.getHTML(), 'my-document');

// Export as PDF (opens print dialog)
exportAsPDF(engine.getHTML(), 'My Document');

// Export as DOCX file download
exportAsDocx(engine.getHTML(), 'my-document');
```

### Paste Cleaning

```js
import { cleanPastedHTML, looksLikeMarkdown } from '@remyxjs/core';

// Remove source-specific markup (Word, Google Docs, LibreOffice, Apple Pages)
const cleaned = cleanPastedHTML(rawHTML);

// Detect if pasted text is markdown
if (looksLikeMarkdown(text)) {
  const html = markdownToHtml(text);
}
```

The paste cleaner auto-detects the source application and applies format-specific cleanup: removing Word XML namespaces, Google Docs wrapper elements, LibreOffice meta tags, and Apple Pages-specific styling.

### Font Management

```js
import {
  loadGoogleFonts,
  addFonts,
  removeFonts,
} from '@remyxjs/core';

// Load Google Fonts (injects <link> into <head>)
loadGoogleFonts(['Roboto', 'Open Sans', 'Merriweather']);

// With Subresource Integrity (SRI) hash for security
loadGoogleFonts(['Roboto'], {
  integrity: 'sha384-abc123...', // pre-computed hash of the stylesheet
  crossOrigin: 'anonymous', // required for SRI (default)
});

// Modify a font list
const fonts = ['Arial', 'Georgia', 'Times New Roman'];
const updated = addFonts(fonts, ['Roboto', 'Lato'], { position: 0 });
// ['Roboto', 'Lato', 'Arial', 'Georgia', 'Times New Roman']

const trimmed = removeFonts(updated, ['Times New Roman']);
// ['Roboto', 'Lato', 'Arial', 'Georgia']
```

### DOM Utilities

```js
import {
  closestBlock,
  closestTag,
  wrapInTag,
  unwrapTag,
  generateId,
  isBlockEmpty,
} from '@remyxjs/core';

closestBlock(node, editorElement); // Nearest block ancestor
closestTag(node, 'a', editorElement); // Nearest <a> ancestor
wrapInTag(range, 'mark', { class: 'hi' }); // Wrap range in element
unwrapTag(markElement); // Unwrap, keep children
generateId(); // 'rmx-a1b2c3d4'
isBlockEmpty(paragraphElement); // true if no meaningful content
```

### HTML Formatting

```js
import { formatHTML } from '@remyxjs/core';

const pretty = formatHTML('<div><p>Hello</p><p>World</p></div>');
// <div>
//   <p>Hello</p>
//   <p>World</p>
// </div>
```

### Platform Detection

```js
import { isMac, getModKey } from '@remyxjs/core';

isMac(); // true on macOS
getModKey(); // 'Cmd' on Mac, 'Ctrl' on Windows/Linux
```

## Theming

### Theme Variables

All styles use CSS custom properties with the `--rmx-` prefix. Override them in your CSS or use `createTheme` to generate overrides programmatically.

| Variable               | Default (Light) | Description           |
| ---------------------- | --------------- | --------------------- |
| `--rmx-bg`             | `#ffffff`       | Editor background     |
| `--rmx-text`           | `#1a1a1a`       | Text color            |
| `--rmx-border`         | `#e0e0e0`       | Border color          |
| `--rmx-toolbar-bg`     | `#f8f9fa`       | Toolbar background    |
| `--rmx-toolbar-text`   | `#374151`       | Toolbar text color    |
| `--rmx-toolbar-hover`  | `#e9ecef`       | Toolbar button hover  |
| `--rmx-toolbar-active` | `#dee2e6`       | Toolbar button active |
| `--rmx-primary`        | `#3b82f6`       | Primary accent color  |
| `--rmx-primary-hover`  | `#2563eb`       | Primary hover         |
| `--rmx-primary-text`   | `#ffffff`       | Text on primary       |
| `--rmx-shadow`         | `0 1px 3px ...` | Box shadow            |
| `--rmx-radius`         | `6px`           | Border radius         |
| `--rmx-font-family`    | system-ui       | Editor font           |
| `--rmx-font-size`      | `16px`          | Editor font size      |
| `--rmx-line-height`    | `1.6`           | Line height           |

See `packages/remyx-core/src/themes/variables.css` for the full list of 40+ variables.

### Built-in Themes

Six built-in themes are available via CSS classes (applied automatically by `@remyxjs/react`'s `theme` prop, or manually via `.rmx-theme-{name}`):

| Theme    | Class               | Description               |
| -------- | ------------------- | ------------------------- |
| `light`  | `.rmx-theme-light`  | Clean white (default)     |
| `dark`   | `.rmx-theme-dark`   | Neutral dark              |
| `ocean`  | `.rmx-theme-ocean`  | Deep blue palette         |
| `forest` | `.rmx-theme-forest` | Green earth-tone palette  |
| `sunset` | `.rmx-theme-sunset` | Warm orange/amber palette |
| `rose`   | `.rmx-theme-rose`   | Soft pink palette         |

For vanilla JS usage, add the class to the editor wrapper:

```js
document
  .querySelector('.rmx-editor')
  .classList.add('rmx-theme-ocean');
```

The `THEME_PRESETS` export is still available for programmatic overrides via `customTheme`:

```js
import { THEME_PRESETS, createTheme } from '@remyxjs/core';
// Override a single variable on top of ocean
const modified = {
  ...THEME_PRESETS.ocean,
  ...createTheme({ primary: '#ff6b6b' }),
};
```

### Custom Themes

```js
import { createTheme } from '@remyxjs/core';

// Use camelCase keys (automatically mapped to --rmx-* CSS vars)
const theme = createTheme({
  bg: '#1e1e2e',
  text: '#cdd6f4',
  border: '#45475a',
  toolbarBg: '#181825',
  toolbarText: '#cdd6f4',
  primary: '#89b4fa',
  radius: '8px',
});

// Apply to an editor wrapper element
Object.entries(theme).forEach(([prop, value]) => {
  editorWrapper.style.setProperty(prop, value);
});
```

You can also pass raw CSS variable names:

```js
const theme = createTheme({
  '--rmx-bg': '#1e1e2e',
  '--rmx-text': '#cdd6f4',
});
```

## Toolbar Configuration

### Toolbar Presets

```js
import { TOOLBAR_PRESETS } from '@remyxjs/core';

// Available presets:
TOOLBAR_PRESETS.full; // All available items including plugin commands
TOOLBAR_PRESETS.rich; // All features with plugin toolbar items (callout, math, toc, bookmark, merge tag)
TOOLBAR_PRESETS.standard; // Common editing features without plugins
TOOLBAR_PRESETS.minimal; // Basic text formatting
TOOLBAR_PRESETS.bare; // Bold, italic, underline only
```

Each preset is an array of arrays, where each inner array is a toolbar group (rendered with a separator between groups):

```js
[
  ['bold', 'italic', 'underline'], // Group 1
  ['heading', 'orderedList', 'unorderedList'], // Group 2
  ['link', 'image'], // Group 3
];
```

### Custom Toolbars

```js
import {
  removeToolbarItems,
  addToolbarItems,
  createToolbar,
  TOOLBAR_PRESETS,
} from '@remyxjs/core';

// Start from a preset and customize
let toolbar = TOOLBAR_PRESETS.standard;

// Remove items
toolbar = removeToolbarItems(toolbar, [
  'strikethrough',
  'subscript',
  'superscript',
]);

// Add items to a specific group or position
toolbar = addToolbarItems(toolbar, ['codeBlock', 'blockquote'], {
  position: 'after', // 'before' | 'after' | 'start' | 'end'
  relativeTo: 'link', // existing item to position relative to
});

// Or build from scratch
const myToolbar = createToolbar([
  ['bold', 'italic', 'underline'],
  ['heading'],
  ['orderedList', 'unorderedList'],
  ['link'],
  ['undo', 'redo'],
]);
```

### Toolbar Item Theming

Style individual toolbar items differently:

```js
import {
  createToolbarItemTheme,
  resolveToolbarItemStyle,
} from '@remyxjs/core';

const itemTheme = createToolbarItemTheme({
  bold: {
    color: '#e74c3c',
    activeBackground: '#fce4ec',
  },
  heading: {
    fontSize: '14px',
    fontWeight: '600',
  },
});
```

## Configuration

### defineConfig

Create reusable, named editor configurations:

```js
import { defineConfig } from '@remyxjs/core';

const config = defineConfig({
  // Shared defaults for all editors
  toolbar: TOOLBAR_PRESETS.standard,
  theme: THEME_PRESETS.ocean,

  // Named editor variants
  editors: {
    blog: {
      toolbar: TOOLBAR_PRESETS.full,
      outputFormat: 'html',
    },
    comments: {
      toolbar: TOOLBAR_PRESETS.minimal,
      outputFormat: 'markdown',
      history: { maxSize: 50 },
    },
  },
});
```

### loadConfig

Load editor configuration from an external JSON or YAML URL:

```js
import { loadConfig } from '@remyxjs/core';

// JSON config
const config = await loadConfig(
  'https://cdn.example.com/editor-config.json',
);

// YAML config (detected by .yml/.yaml extension)
const config = await loadConfig('/configs/editor.yaml');

// Environment-based merging
const config = await loadConfig('/config.json', {
  env: 'production',
});

// Custom headers (e.g., authenticated endpoints)
const config = await loadConfig('/api/editor-config', {
  headers: { Authorization: 'Bearer token123' },
});

// Cancellation
const controller = new AbortController();
const config = await loadConfig('/config.json', {
  signal: controller.signal,
});
```

**Config file format with environment overrides:**

```json
{
  "theme": "light",
  "height": 300,
  "toolbar": [["bold", "italic"], ["heading"], ["link"]],
  "menuBar": true,
  "env": {
    "production": {
      "height": 600,
      "readOnly": false
    },
    "development": {
      "height": 400
    }
  }
}
```

When `env` is provided, the matching override is deep-merged onto the base config and the `env` key is stripped from the result. Arrays in env overrides replace (not merge) the base array.

**YAML support:**

```yaml
theme: ocean
height: 500
toolbar: [bold, italic, underline, heading, link]
menuBar: true
autosave:
  enabled: true
  interval: 30000
```

The built-in YAML parser handles simple key-value pairs, nested objects, inline arrays, booleans, numbers, null, and quoted strings. For complex YAML with anchors, multi-line blocks, or flow mappings, use the `js-yaml` library and pass the result to `defineConfig()`.

| Parameter         | Type                     | Description                          |
| ----------------- | ------------------------ | ------------------------------------ |
| `url`             | `string`                 | URL or path to JSON/YAML config file |
| `options.env`     | `string`                 | Environment name for config merging  |
| `options.headers` | `Record<string, string>` | Custom fetch headers                 |
| `options.signal`  | `AbortSignal`            | Cancellation signal                  |

## Multi-Editor Support

When running multiple `EditorEngine` instances on a single page, two singletons help them work together efficiently.

### EditorBus

A process-wide pub/sub bus for inter-editor communication. Use it to sync content between linked editors (e.g., source + preview), broadcast theme changes, or coordinate save operations.

```js
import { EditorBus } from '@remyxjs/core';

// Register editors so they can be looked up by ID
EditorBus.register('source', sourceEngine);
EditorBus.register('preview', previewEngine);

// Editor A broadcasts content on every change
sourceEngine.on('content:change', () => {
  EditorBus.emit('sync:content', {
    id: 'source',
    html: sourceEngine.getHTML(),
  });
});

// Editor B listens for updates
EditorBus.on('sync:content', ({ id, html }) => {
  if (id !== 'preview') {
    previewEngine.setHTML(html);
  }
});

// Broadcast a theme change into every editor's local event loop
EditorBus.broadcast('theme:change', { theme: 'dark' });

// Broadcast to all except the sender
EditorBus.broadcast('sync:content', { html }, { exclude: 'source' });

// Look up a registered editor
const engine = EditorBus.getEditor('preview');

// List all registered IDs
console.log(EditorBus.getEditorIds()); // ['source', 'preview']

// Unregister on destroy
EditorBus.unregister('source');
```

| Method                         | Description                                  |
| ------------------------------ | -------------------------------------------- |
| `register(id, engine)`         | Register an engine by ID                     |
| `unregister(id)`               | Remove a registered engine                   |
| `getEditor(id)`                | Get an engine by ID                          |
| `getEditorIds()`               | List all registered IDs                      |
| `editorCount`                  | Number of registered editors                 |
| `on(event, handler)`           | Subscribe to a global event                  |
| `off(event, handler)`          | Unsubscribe                                  |
| `once(event, handler)`         | Subscribe once                               |
| `emit(event, data)`            | Emit to global subscribers                   |
| `broadcast(event, data, opts)` | Emit into each editor's local `eventBus`     |
| `reset()`                      | Clear all listeners and registry (for tests) |

### SharedResources

A lazily-initialized singleton that provides deeply-frozen copies of large, immutable data structures (sanitizer schema, toolbar presets, defaults, keybindings, command metadata). When running 10+ editors, all instances reference the same frozen objects instead of creating independent copies.

```js
import { SharedResources } from '@remyxjs/core';

// Shared, frozen sanitizer schema
const { allowedTags, allowedStyles } =
  SharedResources.sanitizerSchema;

// Shared toolbar presets
const fullToolbar = SharedResources.toolbarPresets.full;

// Shared defaults (toolbar, menuBar, fonts, fontSizes, colors, headingOptions)
const defaultFonts = SharedResources.defaults.fonts;

// Shared keybinding table
const keybindings = SharedResources.keybindings;

// Shared command metadata (buttons, tooltips, shortcuts, modals)
const tooltips = SharedResources.commands.tooltips;

// Register a custom icon once, available to all editors
SharedResources.registerIcon(
  'myAction',
  '<svg viewBox="0 0 24 24">...</svg>',
);
SharedResources.getIcon('myAction'); // '<svg ...>'
SharedResources.getIconNames(); // ['myAction']
SharedResources.unregisterIcon('myAction');

// Stats
SharedResources.stats; // { registeredIcons: 0, frozenSchemas: true }
```

## Constants

```js
import {
  // Toolbar & menu defaults
  DEFAULT_TOOLBAR, // Full toolbar configuration
  DEFAULT_MENU_BAR, // Menu bar structure

  // Font & color defaults
  DEFAULT_FONTS, // Array of font family names
  DEFAULT_FONT_SIZES, // Array of size strings
  DEFAULT_COLORS, // Color palette array

  // Keyboard
  DEFAULT_KEYBINDINGS, // Map: command name → shortcut string

  // Heading options
  HEADING_OPTIONS, // H1-H6 + paragraph

  // Security schema
  ALLOWED_TAGS, // Tag → allowed attributes map
  ALLOWED_STYLES, // Allowed CSS property names

  // Command metadata
  BUTTON_COMMANDS, // Set of commands rendered as buttons
  TOOLTIP_MAP, // Command → tooltip text
  SHORTCUT_MAP, // Command → display shortcut
  MODAL_COMMANDS, // Commands that open modals
  getShortcutLabel, // (command) => platform-aware label string
  getCommandActiveState, // (command, selectionState, engine) => boolean

  // Command palette
  SLASH_COMMAND_ITEMS, // Default catalog of command palette items
  filterSlashItems, // (items, query, options?) => filtered items (pinRecent: true by default)
  getRecentCommands, // () => string[] — last 5 executed command IDs
  recordRecentCommand, // (id) => void — record a command execution
  clearRecentCommands, // () => void — clear recent history
  registerCommandItems, // (items) => void — add custom items to the palette
  unregisterCommandItem, // (id) => boolean — remove a custom item
  getCustomCommandItems, // () => SlashCommandItem[] — get all custom items

  // Comments & Annotations
  CommentsPlugin, // Inline comment threads plugin
  parseMentions, // (text) => string[] — extract @mentions from text

  // Callouts & Alerts
  CalloutPlugin, // Styled callout blocks plugin
  registerCalloutType, // (typeDef) => void — register custom callout type
  unregisterCalloutType, // (type) => boolean — remove a callout type
  getCalloutTypes, // () => CalloutType[] — all registered types
  getCalloutType, // (type) => CalloutType — get a type definition
  parseGFMAlert, // (text) => { type, body } — parse GFM alert syntax

  // Advanced Link Management
  LinkPlugin, // Link previews, broken links, auto-link, bookmarks
  detectLinks, // (text) => Array<{ type, value, index }>
  slugify, // (text) => URL-safe slug string

  // Template System
  TemplatePlugin, // Merge tags, conditionals, loops, preview, library
  renderTemplate, // (template, data) => rendered string
  extractTags, // (template) => string[] — unique tag names
  registerTemplate, // Add custom template to library
  unregisterTemplate, // Remove template from library
  getTemplateLibrary, // () => all templates
  getTemplate, // (id) => template by ID

  // Keyboard-First Editing
  KeyboardPlugin, // Vim/Emacs modes, auto-pair, multi-cursor
  getHeadings, // (element) => heading list with level/text/element
  selectNextOccurrence, // (element) => add next match to selection

  // Drag & Drop
  DragDropPlugin, // Drop zones, cross-editor, file drops, reorder

  // Math & Equations
  MathPlugin, // LaTeX math rendering, symbol palette, numbering
  getSymbolPalette, // () => categorized symbol array
  parseMathExpressions, // (text) => Array<{ type, src, index }>
  latexToMathML, // (latex) => MathML string

  // Table of Contents
  TocPlugin, // Auto-generated TOC, outline, heading validation
  buildOutline, // (element) => hierarchical outline tree
  flattenOutline, // (outline) => flat item list
  renderTocHTML, // (outline) => HTML nav string
  validateHeadingHierarchy, // (flatItems) => warnings array

  // Content Analytics
  AnalyticsPlugin, // Readability, reading time, SEO, goals
  analyzeContent, // (text, options) => comprehensive stats
  countSyllables, // (word) => number
  splitSentences, // (text) => string[]
  fleschKincaid, // (stats) => grade level
  fleschReadingEase, // (stats) => 0-100 score
  gunningFog, // (stats) => fog index
  colemanLiau, // (stats) => index
  vocabularyLevel, // (gradeLevel) => 'basic'|'intermediate'|'advanced'
  keywordDensity, // (text, keyword) => { count, density, positions }
  seoAnalysis, // (text, element, keyword) => { hints, ... }

  // Spelling & Grammar
  SpellcheckPlugin, // Spellcheck + grammar checking with inline underlines
  analyzeGrammar, // (text, options) => issues array
  summarizeIssues, // (issues) => { total, grammar, style, byRule }
  detectPassiveVoice, // (text) => issues
  detectWordiness, // (text) => issues
  detectCliches, // (text) => issues
  detectPunctuationIssues, // (text) => issues
  STYLE_PRESETS, // { formal, casual, technical, academic }

  // Real-time Collaboration
  CollaborationPlugin, // CRDT co-editing, live cursors, presence, transport

  // Plugin registry
  registerPluginInRegistry, // Register a plugin for discovery
  unregisterPluginFromRegistry, // Remove from registry
  listRegisteredPlugins, // () => PluginRegistryEntry[] — all registered
  searchPluginRegistry, // (query) => PluginRegistryEntry[] — search by name/desc/tags
} from '@remyxjs/core';
```

## Tree-Shaking

`@remyxjs/core` is designed for tree-shaking. Import only what you need for the smallest possible bundle:

```js
// Minimal — only the engine and the commands you use
import {
  EditorEngine,
  registerFormattingCommands,
  registerListCommands,
} from '@remyxjs/core';
```

```js
// Full — pulls in everything (larger bundle)
import * as Remyx from '@remyxjs/core';
```

**Optional heavy dependencies:** `mammoth` (DOCX import) and `pdfjs-dist` (PDF import) are optional peer dependencies. Only install them if you need document import:

```bash
# Only if you need DOCX/PDF import
npm install mammoth pdfjs-dist
```

**Theme modules are tree-shakeable:** Importing `createTheme` does not pull in `THEME_PRESETS` or the toolbar item theming utilities. These are separate modules that your bundler will exclude if unused.

## CSS

Import the stylesheet for editor theming (light/dark modes, CSS custom properties):

```js
import '@remyxjs/core/style.css';
```

All styles use the `.rmx-` prefix and `--rmx-*` CSS custom properties. The stylesheet includes:

- **variables.css** — All CSS custom properties and their light-mode defaults
- **light.css** — Light theme (default, auto-applied)
- **dark.css** — Dark theme
- **ocean.css** — Deep blue palette
- **forest.css** — Green earth-tone palette
- **sunset.css** — Warm orange/amber palette
- **rose.css** — Soft pink palette

Each theme is a self-contained `.rmx-theme-{name}` class with complete variable overrides, content styles, code editor colors, and syntax token palettes. Apply a theme by adding the class to the editor wrapper or using `@remyxjs/react`'s `theme` prop.

## Building Framework Wrappers

When creating a wrapper for a new framework, your package should:

1. Depend on `@remyxjs/core` as a peer dependency
2. Import `EditorEngine` and register the commands you need
3. Create framework-native components for the toolbar, menu bar, modals, and status bar
4. Use `@remyxjs/core/style.css` for base theming and add component-specific CSS
5. Re-export `@remyxjs/core` for convenience so consumers don't need both packages

**Minimal Vue example:**

```js
// useRemyxEditor.js
import {
  EditorEngine,
  registerFormattingCommands,
  registerListCommands,
} from '@remyxjs/core';
import { ref, onMounted, onUnmounted } from 'vue';

export function useRemyxEditor(elementRef, options = {}) {
  const engine = ref(null);

  onMounted(() => {
    engine.value = new EditorEngine(elementRef.value, options);
    registerFormattingCommands(engine.value);
    registerListCommands(engine.value);
    engine.value.init();
  });

  onUnmounted(() => {
    engine.value?.destroy();
  });

  return { engine };
}
```

See [`@remyxjs/react`](../remyx-react/) as the full reference implementation.

## License

MIT
