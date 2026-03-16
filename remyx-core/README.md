![Remyx Editor](../docs/images/Remyx-Logo.svg)

# @remyx/core

Framework-agnostic core engine for the Remyx Editor. Provides the editor engine, commands, plugin system, utilities, and CSS themes — with zero framework dependencies.

Use this package to build Remyx Editor integrations for any framework (Vue, Svelte, Angular, vanilla JS) or for server-side processing. For React projects, use [`@remyx/react`](../remyx-react/), which includes this package plus React components and hooks.

## Table of Contents

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
  - [Blocks](#blocks)
  - [Fonts](#fonts)
  - [Media Embeds](#media-embeds)
  - [Find & Replace](#find--replace)
  - [Source Mode](#source-mode)
  - [Fullscreen](#fullscreen)
  - [Markdown Toggle](#markdown-toggle)
  - [Attachments](#attachments)
  - [Document Import](#document-import)
- [Plugin System](#plugin-system)
  - [Creating Plugins](#creating-plugins)
  - [Plugin API (Restricted)](#plugin-api-restricted)
  - [Built-in Plugins](#built-in-plugins)
- [Selection API](#selection-api)
- [History (Undo/Redo)](#history-undoredo)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Sanitizer](#sanitizer)
- [Utilities](#utilities)
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
  - [Theme Presets](#theme-presets)
  - [Custom Themes](#custom-themes)
- [Toolbar Configuration](#toolbar-configuration)
  - [Toolbar Presets](#toolbar-presets)
  - [Custom Toolbars](#custom-toolbars)
  - [Toolbar Item Theming](#toolbar-item-theming)
- [Configuration](#configuration)
  - [defineConfig](#defineconfig)
- [Constants](#constants)
- [Tree-Shaking](#tree-shaking)
- [CSS](#css)
- [Building Framework Wrappers](#building-framework-wrappers)
- [License](#license)

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

| Method | Returns | Description |
| --- | --- | --- |
| `init()` | `void` | Initialize the editor — binds event listeners, starts subsystems |
| `destroy()` | `void` | Clean up all listeners, disconnect observers, destroy plugins |
| `getHTML()` | `string` | Get sanitized HTML content |
| `setHTML(html)` | `void` | Set content (sanitized before insertion) |
| `getText()` | `string` | Get plain text content |
| `isEmpty()` | `boolean` | `true` when editor has no meaningful content |
| `focus()` | `void` | Focus the editor element |
| `blur()` | `void` | Blur the editor element |
| `executeCommand(name, ...args)` | `any` | Execute a registered command by name |
| `on(event, handler)` | `Function` | Subscribe to an event; returns an unsubscribe function |
| `off(event, handler)` | `void` | Unsubscribe from an event |
| `getWordCount()` | `number` | Current word count |
| `getCharCount()` | `number` | Current character count |

### Events

| Event | Data | Description |
| --- | --- | --- |
| `content:change` | — | Content was modified |
| `selection:change` | `ActiveFormats` | Selection or formatting state changed |
| `focus` | — | Editor received focus |
| `blur` | — | Editor lost focus |
| `command:executed` | `{ name, args, result }` | A command was executed |
| `paste` | `{ html, text }` | Paste occurred |
| `drop` | `{ files, html }` | Drop occurred |
| `upload:error` | `{ file, error }` | Upload handler rejected |
| `file:too-large` | `{ file, maxSize }` | Dropped/pasted file exceeded size limit |
| `editor:error` | `{ phase, error }` | Initialization error |
| `mode:change` | `{ sourceMode }` | Source mode toggled |
| `mode:change:markdown` | `{ markdownMode }` | Markdown mode toggled |
| `fullscreen:toggle` | `{ fullscreen }` | Fullscreen toggled |
| `find:results` | `{ total, current }` | Find/replace results updated |
| `history:undo` | — | Undo performed |
| `history:redo` | — | Redo performed |
| `plugin:registered` | `{ name }` | Plugin was registered |
| `plugin:error` | `{ name, error }` | Plugin init/destroy error |
| `wordcount:update` | `{ wordCount, charCount }` | Word/char count changed |

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

| Function | Commands Added |
| --- | --- |
| `registerFormattingCommands` | bold, italic, underline, strikethrough, subscript, superscript, removeFormat |
| `registerHeadingCommands` | heading, h1–h6, paragraph |
| `registerAlignmentCommands` | alignLeft, alignCenter, alignRight, alignJustify |
| `registerListCommands` | orderedList, unorderedList, taskList, indent, outdent |
| `registerLinkCommands` | insertLink, editLink, removeLink |
| `registerImageCommands` | insertImage, resizeImage, alignImage, removeImage |
| `registerTableCommands` | insertTable, addRowBefore, addRowAfter, addColBefore, addColAfter, deleteRow, deleteCol |
| `registerBlockCommands` | blockquote, codeBlock, horizontalRule |
| `registerFontCommands` | fontFamily, fontSize, foreColor, backColor |
| `registerMediaCommands` | embedMedia, removeEmbed |
| `registerFindReplaceCommands` | find, findNext, findPrev, replace, replaceAll |
| `registerSourceModeCommands` | sourceMode |
| `registerFullscreenCommands` | fullscreen |
| `registerMarkdownToggleCommands` | toggleMarkdown |
| `registerAttachmentCommands` | insertAttachment, removeAttachment |
| `registerImportDocumentCommands` | importDocument |

### Formatting

```js
registerFormattingCommands(engine);

engine.executeCommand('bold');          // Toggle bold (Mod+B)
engine.executeCommand('italic');        // Toggle italic (Mod+I)
engine.executeCommand('underline');     // Toggle underline (Mod+U)
engine.executeCommand('strikethrough'); // Toggle strikethrough (Mod+Shift+X)
engine.executeCommand('subscript');     // Toggle subscript (Mod+,)
engine.executeCommand('superscript');   // Toggle superscript (Mod+.)
engine.executeCommand('removeFormat');  // Strip all inline formatting
```

### Headings

```js
registerHeadingCommands(engine);

engine.executeCommand('heading', 1);   // Apply H1
engine.executeCommand('heading', 3);   // Apply H3
engine.executeCommand('heading', 'p'); // Reset to paragraph
engine.executeCommand('h2');           // Shorthand for heading level 2
engine.executeCommand('paragraph');    // Shorthand for normal text
```

If `baseHeadingLevel` is set in options, heading levels are offset. For example, with `baseHeadingLevel: 2`, `heading(1)` renders as `<h2>`.

### Lists

```js
registerListCommands(engine);

engine.executeCommand('orderedList');   // Toggle numbered list (Mod+Shift+7)
engine.executeCommand('unorderedList'); // Toggle bullet list (Mod+Shift+8)
engine.executeCommand('taskList');      // Toggle task list with checkboxes
engine.executeCommand('indent');        // Increase indentation
engine.executeCommand('outdent');       // Decrease indentation
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
  text: 'Example',           // optional — uses selection if omitted
  target: '_blank',           // optional
});

// Edit an existing link
engine.executeCommand('editLink', {
  href: 'https://new-url.com',
  text: 'New text',          // optional
  target: '_self',            // optional
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
  alt: 'A photo',            // optional
  width: 400,                // optional
  height: 300,               // optional
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

// Insert a 4x3 table
engine.executeCommand('insertTable', { rows: 4, cols: 3 });

// Row operations
engine.executeCommand('addRowBefore');
engine.executeCommand('addRowAfter');
engine.executeCommand('deleteRow');

// Column operations
engine.executeCommand('addColBefore');
engine.executeCommand('addColAfter');
engine.executeCommand('deleteCol');
```

### Blocks

```js
registerBlockCommands(engine);

engine.executeCommand('blockquote');    // Toggle blockquote (Mod+Shift+9)
engine.executeCommand('codeBlock');     // Toggle code block (Mod+Shift+C)
engine.executeCommand('horizontalRule'); // Insert <hr>
```

### Fonts

```js
registerFontCommands(engine);

engine.executeCommand('fontFamily', 'Georgia');
engine.executeCommand('fontSize', '18px');  // Accepts px, pt, em, rem, %
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
  caseSensitive: false,     // optional, default false
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
  filesize: '2.4 MB',       // optional, displayed in UI
});

engine.executeCommand('removeAttachment', { element: attachmentElement });
```

### Document Import

```js
registerImportDocumentCommands(engine);

// Opens a native file picker for supported formats
engine.executeCommand('importDocument');
```

## Plugin System

### Creating Plugins

```js
import { createPlugin } from '@remyx/core';

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
        return engine.selection.getActiveFormats().backColor === 'yellow';
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
      render: (engine) => engine.selection.getActiveFormats().backColor || 'none',
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

### Plugin API (Restricted)

Plugins without `requiresFullAccess` receive a sandboxed API:

| Property/Method | Description |
| --- | --- |
| `element` | Editor DOM element (read-only) |
| `options` | Engine options (read-only copy) |
| `executeCommand(name, ...args)` | Execute a command |
| `on(event, handler)` | Subscribe to events |
| `off(event, handler)` | Unsubscribe |
| `getSelection()` | Browser Selection object |
| `getRange()` | Current Range in editor |
| `getActiveFormats()` | Current formatting state |
| `getHTML()` | Get content as HTML |
| `getText()` | Get content as plain text |
| `isEmpty()` | Check if editor is empty |

### Built-in Plugins

**WordCountPlugin** — Emits `wordcount:update` with `{ wordCount, charCount }` on every content change.

```js
import { WordCountPlugin } from '@remyx/core';
engine.plugins.register(WordCountPlugin);
engine.on('wordcount:update', ({ wordCount, charCount }) => {
  document.querySelector('#count').textContent = `${wordCount} words`;
});
```

**AutolinkPlugin** — Automatically converts typed URLs into clickable links when the user presses Space or Enter.

```js
import { AutolinkPlugin } from '@remyx/core';
engine.plugins.register(AutolinkPlugin);
```

**PlaceholderPlugin** — Shows placeholder text when the editor is empty.

```js
import { PlaceholderPlugin } from '@remyx/core';
engine.plugins.register(PlaceholderPlugin('Start writing...'));
```

## Selection API

Access the selection subsystem via `engine.selection`:

```js
const sel = engine.selection;

// Read selection state
sel.isCollapsed();           // true if cursor (no range selected)
sel.getSelectedText();       // selected plain text
sel.getSelectedHTML();       // selected HTML fragment
sel.getBoundingRect();       // DOMRect for positioning floating UI

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
sel.getParentElement();      // nearest element containing cursor
sel.getParentBlock();        // nearest block element (div, p, li, etc.)
sel.getClosestElement('a');  // find ancestor by tag name

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
sel.collapse();              // collapse to start
sel.collapse(true);          // collapse to end
```

## History (Undo/Redo)

Access the history subsystem via `engine.history`:

```js
engine.history.undo();       // Undo last change
engine.history.redo();       // Redo
engine.history.canUndo();    // true if undo stack is not empty
engine.history.canRedo();    // true if redo stack is not empty
engine.history.snapshot();   // Force an immediate snapshot
engine.history.clear();      // Clear all history

// Events
engine.on('history:undo', () => updateUndoButton());
engine.on('history:redo', () => updateRedoButton());
```

History is configured via engine options:

```js
new EditorEngine(element, {
  history: {
    maxSize: 200,     // Keep up to 200 undo states (default: 100)
    debounceMs: 500,  // Wait 500ms of inactivity before snapshotting (default: 300)
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
engine.keyboard.getShortcutForCommand('bold');  // 'mod+b'
engine.keyboard.getShortcutLabel('mod+b');      // '⌘B' on Mac, 'Ctrl+B' on Windows
```

**Shortcut format:** Use `mod` for Ctrl (Windows/Linux) or Cmd (Mac). Combine with `shift`, `alt`, and a lowercase key: `'mod+shift+k'`.

**Default shortcuts:**

| Shortcut | Command |
| --- | --- |
| Mod+B | bold |
| Mod+I | italic |
| Mod+U | underline |
| Mod+Shift+X | strikethrough |
| Mod+, | subscript |
| Mod+. | superscript |
| Mod+K | insertLink |
| Mod+Shift+7 | orderedList |
| Mod+Shift+8 | unorderedList |
| Mod+Shift+9 | blockquote |
| Mod+Shift+C | codeBlock |
| Mod+F | find |
| Mod+Shift+U | sourceMode |
| Mod+Shift+F | fullscreen |
| Mod+Z | undo |
| Mod+Shift+Z | redo |

## Sanitizer

The sanitizer runs on every content read (`getHTML()`) and write (`setHTML()`), and on pasted/dropped content.

```js
// Default behavior — blocks dangerous content automatically
engine.getHTML(); // always sanitized

// Customize allowed tags and styles via engine options
new EditorEngine(element, {
  sanitize: {
    allowedTags: {
      // tag name → array of allowed attributes
      'div': ['class', 'id', 'style'],
      'span': ['class', 'style'],
      'a': ['href', 'target', 'rel', 'class'],
      'img': ['src', 'alt', 'width', 'height', 'class'],
      'mark': ['class'],
      // ... see schema.js for full defaults
    },
    allowedStyles: [
      'color', 'background-color', 'font-size', 'font-family',
      'text-align', 'text-decoration', 'font-weight', 'font-style',
      'margin', 'padding', 'border', 'width', 'height',
      // ... see schema.js for full defaults
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
- `contenteditable` attribute stripped
- SVG data URIs blocked in image sources

## Utilities

### Markdown Conversion

```js
import { htmlToMarkdown, markdownToHtml } from '@remyx/core';

const md = htmlToMarkdown('<h1>Hello</h1><p>World</p>');
// # Hello\n\nWorld

const html = markdownToHtml('# Hello\n\nWorld');
// <h1>Hello</h1><p>World</p>
```

Supports GitHub Flavored Markdown (GFM): headings, bold, italic, links, images, lists, task lists, tables, code blocks, blockquotes, and horizontal rules.

### Document Conversion

```js
import { convertDocument, isImportableFile, getSupportedExtensions } from '@remyx/core';

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
import { exportAsMarkdown, exportAsPDF, exportAsDocx } from '@remyx/core';

// Export as Markdown file download
exportAsMarkdown(engine.getHTML(), 'my-document');

// Export as PDF (opens print dialog)
exportAsPDF(engine.getHTML(), 'My Document');

// Export as DOCX file download
exportAsDocx(engine.getHTML(), 'my-document');
```

### Paste Cleaning

```js
import { cleanPastedHTML, looksLikeMarkdown } from '@remyx/core';

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
import { loadGoogleFonts, addFonts, removeFonts } from '@remyx/core';

// Load Google Fonts (injects <link> into <head>)
loadGoogleFonts(['Roboto', 'Open Sans', 'Merriweather']);

// Modify a font list
const fonts = ['Arial', 'Georgia', 'Times New Roman'];
const updated = addFonts(fonts, ['Roboto', 'Lato'], { position: 0 });
// ['Roboto', 'Lato', 'Arial', 'Georgia', 'Times New Roman']

const trimmed = removeFonts(updated, ['Times New Roman']);
// ['Roboto', 'Lato', 'Arial', 'Georgia']
```

### DOM Utilities

```js
import { closestBlock, closestTag, wrapInTag, unwrapTag, generateId, isBlockEmpty } from '@remyx/core';

closestBlock(node, editorElement);        // Nearest block ancestor
closestTag(node, 'a', editorElement);     // Nearest <a> ancestor
wrapInTag(range, 'mark', { class: 'hi' }); // Wrap range in element
unwrapTag(markElement);                   // Unwrap, keep children
generateId();                             // 'rmx-a1b2c3d4'
isBlockEmpty(paragraphElement);           // true if no meaningful content
```

### HTML Formatting

```js
import { formatHTML } from '@remyx/core';

const pretty = formatHTML('<div><p>Hello</p><p>World</p></div>');
// <div>
//   <p>Hello</p>
//   <p>World</p>
// </div>
```

### Platform Detection

```js
import { isMac, getModKey } from '@remyx/core';

isMac();      // true on macOS
getModKey();  // 'Cmd' on Mac, 'Ctrl' on Windows/Linux
```

## Theming

### Theme Variables

All styles use CSS custom properties with the `--rmx-` prefix. Override them in your CSS or use `createTheme` to generate overrides programmatically.

| Variable | Default (Light) | Description |
| --- | --- | --- |
| `--rmx-bg` | `#ffffff` | Editor background |
| `--rmx-text` | `#1a1a1a` | Text color |
| `--rmx-border` | `#e0e0e0` | Border color |
| `--rmx-toolbar-bg` | `#f8f9fa` | Toolbar background |
| `--rmx-toolbar-text` | `#374151` | Toolbar text color |
| `--rmx-toolbar-hover` | `#e9ecef` | Toolbar button hover |
| `--rmx-toolbar-active` | `#dee2e6` | Toolbar button active |
| `--rmx-primary` | `#3b82f6` | Primary accent color |
| `--rmx-primary-hover` | `#2563eb` | Primary hover |
| `--rmx-primary-text` | `#ffffff` | Text on primary |
| `--rmx-shadow` | `0 1px 3px ...` | Box shadow |
| `--rmx-radius` | `6px` | Border radius |
| `--rmx-font-family` | system-ui | Editor font |
| `--rmx-font-size` | `16px` | Editor font size |
| `--rmx-line-height` | `1.6` | Line height |

See `packages/remyx-core/src/themes/variables.css` for the full list of 40+ variables.

### Theme Presets

```js
import { THEME_PRESETS, createTheme } from '@remyx/core';

// Available presets: ocean, forest, sunset, rose
const oceanTheme = createTheme(THEME_PRESETS.ocean);
```

| Preset | Accent | Description |
| --- | --- | --- |
| `ocean` | Blue | Cool blue tones |
| `forest` | Green | Nature-inspired greens |
| `sunset` | Orange | Warm orange tones |
| `rose` | Pink | Soft pink theme |

### Custom Themes

```js
import { createTheme } from '@remyx/core';

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
import { TOOLBAR_PRESETS } from '@remyx/core';

// Available presets:
TOOLBAR_PRESETS.full;      // All available items
TOOLBAR_PRESETS.standard;  // Common editing features
TOOLBAR_PRESETS.minimal;   // Basic text formatting
TOOLBAR_PRESETS.bare;      // Bold, italic, underline only
```

Each preset is an array of arrays, where each inner array is a toolbar group (rendered with a separator between groups):

```js
[
  ['bold', 'italic', 'underline'],       // Group 1
  ['heading', 'orderedList', 'unorderedList'], // Group 2
  ['link', 'image'],                     // Group 3
]
```

### Custom Toolbars

```js
import { removeToolbarItems, addToolbarItems, createToolbar, TOOLBAR_PRESETS } from '@remyx/core';

// Start from a preset and customize
let toolbar = TOOLBAR_PRESETS.standard;

// Remove items
toolbar = removeToolbarItems(toolbar, ['strikethrough', 'subscript', 'superscript']);

// Add items to a specific group or position
toolbar = addToolbarItems(toolbar, ['codeBlock', 'blockquote'], {
  position: 'after',    // 'before' | 'after' | 'start' | 'end'
  relativeTo: 'link',   // existing item to position relative to
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
import { createToolbarItemTheme, resolveToolbarItemStyle } from '@remyx/core';

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
import { defineConfig } from '@remyx/core';

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

## Constants

```js
import {
  // Toolbar & menu defaults
  DEFAULT_TOOLBAR,      // Full toolbar configuration
  DEFAULT_MENU_BAR,     // Menu bar structure

  // Font & color defaults
  DEFAULT_FONTS,        // Array of font family names
  DEFAULT_FONT_SIZES,   // Array of size strings
  DEFAULT_COLORS,       // Color palette array

  // Keyboard
  DEFAULT_KEYBINDINGS,  // Map: command name → shortcut string

  // Heading options
  HEADING_OPTIONS,      // H1-H6 + paragraph

  // Security schema
  ALLOWED_TAGS,         // Tag → allowed attributes map
  ALLOWED_STYLES,       // Allowed CSS property names

  // Command metadata
  BUTTON_COMMANDS,      // Set of commands rendered as buttons
  TOOLTIP_MAP,          // Command → tooltip text
  SHORTCUT_MAP,         // Command → display shortcut
  MODAL_COMMANDS,       // Commands that open modals
  getShortcutLabel,     // (command) => platform-aware label string
  getCommandActiveState, // (command, selectionState, engine) => boolean
} from '@remyx/core';
```

## Tree-Shaking

`@remyx/core` is designed for tree-shaking. Import only what you need for the smallest possible bundle:

```js
// Minimal — only the engine and the commands you use
import { EditorEngine, registerFormattingCommands, registerListCommands } from '@remyx/core';
```

```js
// Full — pulls in everything (larger bundle)
import * as Remyx from '@remyx/core';
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
import '@remyx/core/style.css';
```

All styles use the `.rmx-` prefix and `--rmx-*` CSS custom properties. The stylesheet includes:

- **variables.css** — All CSS custom properties and their light-mode defaults
- **light.css** — Light theme (default, auto-applied)
- **dark.css** — Dark theme (applied via `.rmx-dark` class or `prefers-color-scheme: dark`)

To force dark mode regardless of system preference:

```css
.rmx-editor {
  color-scheme: dark;
}
```

Or add the `.rmx-dark` class to the editor wrapper.

## Building Framework Wrappers

When creating a wrapper for a new framework, your package should:

1. Depend on `@remyx/core` as a peer dependency
2. Import `EditorEngine` and register the commands you need
3. Create framework-native components for the toolbar, menu bar, modals, and status bar
4. Use `@remyx/core/style.css` for base theming and add component-specific CSS
5. Re-export `@remyx/core` for convenience so consumers don't need both packages

**Minimal Vue example:**

```js
// useRemyxEditor.js
import { EditorEngine, registerFormattingCommands, registerListCommands } from '@remyx/core';
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

See [`@remyx/react`](../remyx-react/) as the full reference implementation.

## License

MIT
