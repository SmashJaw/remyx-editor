# Remyx Editor

A feature-rich WYSIWYG editor built on a framework-agnostic core with first-class React support. Configurable toolbar, menu bar, markdown support, theming, file uploads, and a plugin system.

## Packages

| Package | Version | Description |
| --- | --- | --- |
| [`@remyx/core`](../remyx-core/) | 0.23.0 | Framework-agnostic engine, commands, plugins, utilities, and CSS themes |
| [`@remyx/react`](../remyx-react/) | 0.23.0 | React components, hooks, and TypeScript declarations |
| [`remyx-editor`](./) | 0.23.0 | All-in-one React package (re-exports both) |

`remyx-editor` is the all-in-one package for React projects — it includes everything from `@remyx/core` plus the React integration layer. For modular installs, use `@remyx/core` + `@remyx/react`. Use `@remyx/core` directly if building a wrapper for another framework (Vue, Svelte, Angular, vanilla JS).

## Screenshots

### Light Theme

![Remyx Editor — Light Theme](screenshots/editor-light-theme.png)

### Dark Theme (Ocean)

![Remyx Editor — Dark Ocean Theme](screenshots/editor-dark-ocean.png)

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Features](#features)
- [Props](#props)
- [Config File](#config-file)
- [Toolbar](#toolbar)
  - [Custom Toolbar](#custom-toolbar-via-props)
  - [Presets](#toolbar-presets)
  - [Helper Functions](#toolbar-helper-functions)
  - [Available Items](#available-toolbar-items)
- [Menu Bar](#menu-bar)
- [Multiple Editors](#multiple-editors)
- [Fonts](#font-configuration)
- [Status Bar](#status-bar)
- [Theming](#theming)
  - [Custom Themes](#custom-themes)
  - [Theme Presets](#theme-presets)
  - [Theme Variables](#available-theme-variables)
  - [Per-Item Toolbar Theming](#per-item-toolbar-theming)
- [Paste Handling](#paste--auto-conversion)
- [File Uploads](#file-uploads)
- [Output Formats](#output-formats)
- [Attaching to Existing Elements](#attaching-to-existing-elements)
- [Plugins](#plugins)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Exports](#exports)
- [Using `@remyx/core` Directly](#using-remyxcore-directly)

## Installation

```bash
npm install remyx-editor
```

Import the stylesheet in your app entry point:

```js
import 'remyx-editor/style.css';
```

> **Using the core only?** If you're building a non-React integration, install `@remyx/core` instead — see [Using `@remyx/core` Directly](#using-remyxcore-directly).

## Quick Start

```jsx
import { RemyxEditor } from 'remyx-editor';
import 'remyx-editor/style.css';

function App() {
  const [content, setContent] = useState('');

  return (
    <RemyxEditor
      value={content}
      onChange={setContent}
      placeholder="Start typing..."
      height={400}
    />
  );
}
```

## Features

- **Rich text editing** — bold, italic, underline, strikethrough, subscript, superscript, headings, lists, blockquotes, code blocks, tables, and horizontal rules
- **Toolbar** — fully configurable with presets, helper functions, and per-item theming
- **Menu bar** — application-style menus (File, Edit, View, Insert, Format) with submenus and auto-deduplication
- **Markdown** — bidirectional HTML/Markdown conversion, toggle between modes, and auto-detection on paste
- **Theming** — light/dark mode, 4 built-in presets (Ocean, Forest, Sunset, Rose), full CSS variable customization
- **File uploads** — images and attachments via drag-and-drop, paste, or toolbar with pluggable upload handlers (S3, R2, GCS, custom)
- **Fonts** — custom font lists, Google Fonts auto-loading, and helper functions
- **Plugins** — `createPlugin()` API with hooks for commands, toolbar items, status bar items, and context menus
- **Config file** — centralized `defineConfig()` with named editor configurations and provider-based sharing
- **Multi-instance** — unlimited editors per page with full isolation (state, events, DOM, modals)
- **Import/Export** — PDF, DOCX, Markdown, CSV, and HTML
- **Paste cleaning** — intelligent cleanup from Word, Google Docs, LibreOffice, Pages, and raw markdown
- **Keyboard shortcuts** — customizable with sensible defaults
- **Accessibility** — semantic HTML, ARIA attributes, keyboard navigation, and focus management

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `config` | `string` | — | Named editor config from `defineConfig()` |
| `value` | `string` | — | Controlled content (HTML or Markdown) |
| `defaultValue` | `string` | — | Initial content for uncontrolled mode |
| `onChange` | `(content: string) => void` | — | Called when content changes |
| `outputFormat` | `'html' \| 'markdown'` | `'html'` | Format passed to `onChange` |
| `toolbar` | `string[][]` | Full toolbar | Custom toolbar layout |
| `menuBar` | `boolean \| MenuBarConfig[]` | — | Enable menu bar |
| `theme` | `'light' \| 'dark'` | `'light'` | Editor theme |
| `placeholder` | `string` | `''` | Placeholder text |
| `height` | `number` | `300` | Editor height in px |
| `minHeight` | `number` | — | Minimum height |
| `maxHeight` | `number` | — | Maximum height (scrolls) |
| `readOnly` | `boolean` | `false` | Disable editing |
| `fonts` | `string[]` | Built-in list | Custom font families |
| `googleFonts` | `string[]` | — | Google Font families to auto-load |
| `statusBar` | `'bottom' \| 'top' \| 'popup' \| false` | `'bottom'` | Word/character count position |
| `customTheme` | `object` | — | CSS variable overrides |
| `toolbarItemTheme` | `object` | — | Per-item toolbar styling |
| `floatingToolbar` | `boolean` | `true` | Show toolbar on text selection |
| `contextMenu` | `boolean` | `true` | Show right-click context menu |
| `plugins` | `Plugin[]` | — | Custom plugins |
| `uploadHandler` | `(file: File) => Promise<string>` | — | File upload handler |
| `shortcuts` | `object` | — | Keyboard shortcut overrides |
| `sanitize` | `object` | — | HTML sanitization options |
| `attachTo` | `React.RefObject` | — | Attach to an existing element |
| `onReady` | `(engine) => void` | — | Called when editor initializes |
| `onFocus` | `() => void` | — | Called on focus |
| `onBlur` | `() => void` | — | Called on blur |
| `className` | `string` | `''` | CSS class for wrapper |
| `style` | `object` | — | Inline styles for wrapper |

## Config File

Define shared defaults and named editor configurations in a centralized config file instead of repeating props.

**`remyx.config.js`**

```js
import { defineConfig } from 'remyx-editor';

export default defineConfig({
  theme: 'dark',
  placeholder: 'Start writing...',
  height: 400,

  editors: {
    minimal: {
      toolbar: [['bold', 'italic', 'underline'], ['link']],
      floatingToolbar: false,
      height: 200,
    },
    comments: {
      toolbar: [['bold', 'italic', 'strikethrough'], ['orderedList', 'unorderedList'], ['link']],
      statusBar: false,
      height: 150,
      placeholder: 'Write a comment...',
    },
  },
});
```

**Usage**

```jsx
import { RemyxEditor, RemyxConfigProvider } from 'remyx-editor';
import config from './remyx.config.js';

function App() {
  return (
    <RemyxConfigProvider config={config}>
      <RemyxEditor />                              {/* default config */}
      <RemyxEditor config="minimal" />             {/* named config */}
      <RemyxEditor config="minimal" theme="light" /> {/* prop overrides config */}
    </RemyxConfigProvider>
  );
}
```

### Config Resolution Priority

Values merge with this priority (highest first):

1. **Component props** — always win
2. **Named editor config** — `editors.minimal`, `editors.comments`, etc.
3. **Default config** — top-level keys in the config file
4. **Built-in defaults** — `theme: 'light'`, `height: 300`, etc.

Editors work identically without a `RemyxConfigProvider` — the provider is optional.

## Toolbar

### Default Toolbar

```js
[
  ['undo', 'redo'],
  ['headings', 'fontFamily', 'fontSize'],
  ['bold', 'italic', 'underline', 'strikethrough'],
  ['foreColor', 'backColor'],
  ['alignLeft', 'alignCenter', 'alignRight', 'alignJustify'],
  ['orderedList', 'unorderedList', 'taskList'],
  ['outdent', 'indent'],
  ['link', 'image', 'table', 'embedMedia', 'blockquote', 'codeBlock', 'horizontalRule'],
  ['subscript', 'superscript'],
  ['findReplace', 'toggleMarkdown', 'sourceMode', 'export', 'fullscreen'],
]
```

Each inner array is a visual group separated by a divider.

### Custom Toolbar via Props

```jsx
<RemyxEditor
  toolbar={[
    ['bold', 'italic', 'underline'],
    ['orderedList', 'unorderedList'],
    ['link', 'image'],
  ]}
/>
```

### Toolbar Presets

```jsx
import { RemyxEditor, TOOLBAR_PRESETS } from 'remyx-editor'

<RemyxEditor toolbar={TOOLBAR_PRESETS.full} />      // all items (default)
<RemyxEditor toolbar={TOOLBAR_PRESETS.standard} />   // no source/markdown/embed
<RemyxEditor toolbar={TOOLBAR_PRESETS.minimal} />    // headings, basics, lists, links, images
<RemyxEditor toolbar={TOOLBAR_PRESETS.bare} />       // bold, italic, underline only
```

### Toolbar Helper Functions

#### `removeToolbarItems(config, itemsToRemove)`

```jsx
import { DEFAULT_TOOLBAR, removeToolbarItems } from 'remyx-editor'

const toolbar = removeToolbarItems(DEFAULT_TOOLBAR, ['image', 'table', 'embedMedia', 'export'])
```

#### `addToolbarItems(config, items, options?)`

```jsx
import { TOOLBAR_PRESETS, addToolbarItems } from 'remyx-editor'

addToolbarItems(TOOLBAR_PRESETS.minimal, ['fullscreen'])              // append as new group
addToolbarItems(TOOLBAR_PRESETS.minimal, 'fullscreen', { group: -1 }) // add to last group
addToolbarItems(TOOLBAR_PRESETS.minimal, 'taskList', { after: 'unorderedList' })
addToolbarItems(TOOLBAR_PRESETS.minimal, 'strikethrough', { before: 'underline' })
```

#### `createToolbar(items)`

Build a toolbar from a flat list — items are auto-grouped by category:

```jsx
import { createToolbar } from 'remyx-editor'

const toolbar = createToolbar([
  'bold', 'italic', 'underline', 'headings',
  'link', 'image', 'orderedList', 'unorderedList', 'fullscreen',
])
// Groups by category: [['headings'], ['bold', 'italic', 'underline'], ['orderedList', 'unorderedList'], ['link', 'image'], ['fullscreen']]
```

### Available Toolbar Items

| Item | Type | Description |
| --- | --- | --- |
| `undo` | Button | Undo last action |
| `redo` | Button | Redo last action |
| `headings` | Dropdown | Block type (Normal, H1–H6) |
| `fontFamily` | Dropdown | Font family selector |
| `fontSize` | Dropdown | Font size selector |
| `bold` | Button | Bold |
| `italic` | Button | Italic |
| `underline` | Button | Underline |
| `strikethrough` | Button | Strikethrough |
| `subscript` | Button | Subscript |
| `superscript` | Button | Superscript |
| `foreColor` | Color Picker | Text color |
| `backColor` | Color Picker | Background color |
| `alignLeft` | Button | Align left |
| `alignCenter` | Button | Align center |
| `alignRight` | Button | Align right |
| `alignJustify` | Button | Justify |
| `orderedList` | Button | Numbered list |
| `unorderedList` | Button | Bulleted list |
| `taskList` | Button | Task/checkbox list |
| `indent` | Button | Increase indent |
| `outdent` | Button | Decrease indent |
| `link` | Button | Insert/edit link |
| `image` | Button | Insert image |
| `attachment` | Button | Attach file |
| `importDocument` | Button | Import (PDF, DOCX, MD, CSV) |
| `table` | Button | Insert table |
| `embedMedia` | Button | Embed video/media |
| `blockquote` | Button | Block quote |
| `codeBlock` | Button | Code block |
| `horizontalRule` | Button | Horizontal divider |
| `findReplace` | Button | Find and replace |
| `toggleMarkdown` | Button | Toggle markdown mode |
| `sourceMode` | Button | View/edit HTML source |
| `export` | Button | Export (PDF, MD, DOCX) |
| `fullscreen` | Button | Toggle fullscreen |

## Menu Bar

Add an application-style menu bar above the toolbar. When enabled, items in the menu bar are auto-removed from the toolbar to avoid duplication.

### Enable

```jsx
<RemyxEditor menuBar={true} />
```

**Default menus:**

| Menu | Items |
| --- | --- |
| **File** | Import Document, Export Document |
| **Edit** | Undo, Redo, Find & Replace |
| **View** | Fullscreen, Toggle Markdown, Source Mode |
| **Insert** | Link, Image, Table, Attachment, Embed Media, Blockquote, Code Block, Horizontal Rule |
| **Format** | Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Alignment, Lists, Colors |

### Custom Menu Bar

```jsx
<RemyxEditor
  menuBar={[
    { label: 'File', items: ['importDocument', 'export'] },
    { label: 'Edit', items: ['undo', 'redo', '---', 'findReplace'] },
    { label: 'Format', items: [
      'bold', 'italic', 'underline',
      '---',
      { label: 'Alignment', items: ['alignLeft', 'alignCenter', 'alignRight', 'alignJustify'] },
    ]},
  ]}
/>
```

Each menu object has a `label` (string) and `items` array of command names, `'---'` separators, or nested `{ label, items }` submenu objects. Any command from the [Available Toolbar Items](#available-toolbar-items) table works as a menu item.

### Menu Bar with Config File

```js
export default defineConfig({
  menuBar: true, // default menu bar for all editors
  editors: {
    full: { menuBar: true },
    minimal: {
      menuBar: [
        { label: 'Edit', items: ['undo', 'redo'] },
        { label: 'Format', items: ['bold', 'italic', 'underline'] },
      ],
      toolbar: [['headings', 'fontFamily', 'fontSize']],
    },
  },
});
```

### Toolbar Auto-Deduplication

When a menu bar is active and no explicit `toolbar` prop is passed, toolbar items already in the menu bar are automatically removed. To keep the full toolbar alongside a menu bar:

```jsx
import { DEFAULT_TOOLBAR } from 'remyx-editor';
<RemyxEditor menuBar={true} toolbar={DEFAULT_TOOLBAR} />
```

### Menu Bar Behavior

- **Click** a trigger to open, **hover** to switch between open menus
- **Escape** or click outside to close
- Submenus open on hover with a chevron (▸)
- Toggle commands show active state, modal commands open their dialogs
- Inherits the editor's theme and custom theme variables

## Multiple Editors

Multiple `<RemyxEditor />` instances work on the same page without any additional setup. Each editor is fully isolated.

### Basic Usage

```jsx
<RemyxEditor placeholder="Editor 1..." height={300} />
<RemyxEditor placeholder="Editor 2..." height={300} />
<RemyxEditor placeholder="Editor 3..." height={200} />
```

### What's Isolated Per Instance

| Feature | Isolation |
| --- | --- |
| **Content & state** | Separate undo/redo history, content, and selection |
| **Toolbar** | Independent dropdowns, color pickers, and active states |
| **Menu bar** | Menus open/close independently per editor |
| **Modals** | Each editor has its own modals (link, image, table, find/replace) |
| **Floating toolbar** | Appears only for the editor with an active selection |
| **Context menu** | Scoped to the clicked editor |
| **Fullscreen** | Each editor enters/exits fullscreen independently |
| **Plugins** | Per-editor plugin instances with separate state |
| **Events** | Separate `EventBus` per instance |
| **Keyboard shortcuts** | Fire only for the focused editor |

### Mixed Configurations

```jsx
<RemyxConfigProvider config={config}>
  <RemyxEditor menuBar={true} height={400} />
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
    <RemyxEditor config="minimal" />
    <RemyxEditor config="comments" />
  </div>
  <RemyxEditor theme="light" placeholder="Standalone editor" />
</RemyxConfigProvider>
```

No hard limit on editor count. Performance scales linearly. Editors in a `RemyxConfigProvider` share the config (read-only) but all runtime state is per-instance.

## Font Configuration

### Custom Font List

```jsx
<RemyxEditor fonts={['Arial', 'Georgia', 'Courier New', 'My Custom Font']} />
```

### Google Fonts

```jsx
<RemyxEditor googleFonts={['Roboto', 'Open Sans', 'Lato', 'Montserrat']} />

// With custom fonts
<RemyxEditor fonts={['Arial', 'Georgia']} googleFonts={['Poppins', 'Inter']} />

// Specific weights
<RemyxEditor googleFonts={['Roboto:wght@400;700']} />
```

Google Fonts are auto-loaded via CDN and merged into the font dropdown.

### Font Helper Functions

```jsx
import { DEFAULT_FONTS, removeFonts, addFonts, loadGoogleFonts } from 'remyx-editor'

// Remove fonts
const fonts = removeFonts(DEFAULT_FONTS, ['Comic Sans MS', 'Impact'])

// Add fonts (append by default, or { position: 'start' } to prepend)
const fonts = addFonts(DEFAULT_FONTS, ['My Custom Font'])

// Load Google Fonts programmatically
loadGoogleFonts(['Roboto', 'Lato'])
```

## Status Bar

The status bar displays word and character counts.

```jsx
<RemyxEditor statusBar="bottom" />  {/* below content (default) */}
<RemyxEditor statusBar="top" />     {/* above content */}
<RemyxEditor statusBar="popup" />   {/* toolbar button with popover */}
<RemyxEditor statusBar={false} />   {/* hidden */}
```

## Theming

```jsx
<RemyxEditor theme="light" />  // default
<RemyxEditor theme="dark" />
```

### Custom Themes

Override CSS variables using `createTheme()` or raw variable names. Custom themes layer on top of the base theme — only specify what you want to change.

```jsx
import { createTheme } from 'remyx-editor'

const brandTheme = createTheme({
  bg: '#1a1a2e',
  text: '#e0e0e0',
  primary: '#e94560',
  primaryHover: '#c81e45',
  toolbarBg: '#16213e',
  toolbarIcon: '#94a3b8',
  toolbarIconActive: '#e94560',
  radius: '12px',
  contentFontSize: '18px',
})

<RemyxEditor theme="dark" customTheme={brandTheme} />
```

Or pass raw CSS variables directly:

```jsx
<RemyxEditor customTheme={{ '--rmx-primary': '#e94560', '--rmx-bg': '#1a1a2e' }} />
```

### Theme Presets

```jsx
import { THEME_PRESETS } from 'remyx-editor'

<RemyxEditor theme="dark" customTheme={THEME_PRESETS.ocean} />
<RemyxEditor theme="dark" customTheme={THEME_PRESETS.forest} />
<RemyxEditor theme="dark" customTheme={THEME_PRESETS.sunset} />
<RemyxEditor theme="dark" customTheme={THEME_PRESETS.rose} />
```

### Available Theme Variables

| Key | CSS Variable | Description |
| --- | --- | --- |
| `bg` | `--rmx-bg` | Editor background |
| `text` | `--rmx-text` | Primary text color |
| `textSecondary` | `--rmx-text-secondary` | Muted text color |
| `border` | `--rmx-border` | Border color |
| `borderSubtle` | `--rmx-border-subtle` | Subtle border color |
| `toolbarBg` | `--rmx-toolbar-bg` | Toolbar background |
| `toolbarBorder` | `--rmx-toolbar-border` | Toolbar border |
| `toolbarButtonHover` | `--rmx-toolbar-button-hover` | Button hover background |
| `toolbarButtonActive` | `--rmx-toolbar-button-active` | Button active background |
| `toolbarIcon` | `--rmx-toolbar-icon` | Icon color |
| `toolbarIconActive` | `--rmx-toolbar-icon-active` | Active icon color |
| `primary` | `--rmx-primary` | Primary accent color |
| `primaryHover` | `--rmx-primary-hover` | Primary hover color |
| `primaryLight` | `--rmx-primary-light` | Light primary (backgrounds) |
| `focusRing` | `--rmx-focus-ring` | Focus outline color |
| `selection` | `--rmx-selection` | Text selection color |
| `danger` | `--rmx-danger` | Error/danger color |
| `dangerLight` | `--rmx-danger-light` | Light danger color |
| `placeholder` | `--rmx-placeholder` | Placeholder text color |
| `modalBg` | `--rmx-modal-bg` | Modal background |
| `modalOverlay` | `--rmx-modal-overlay` | Modal overlay |
| `statusbarBg` | `--rmx-statusbar-bg` | Status bar background |
| `statusbarText` | `--rmx-statusbar-text` | Status bar text |
| `fontFamily` | `--rmx-font-family` | UI font stack |
| `fontSize` | `--rmx-font-size` | UI font size |
| `contentFontSize` | `--rmx-content-font-size` | Content font size |
| `contentLineHeight` | `--rmx-content-line-height` | Content line height |
| `radius` | `--rmx-radius` | Border radius |
| `radiusSm` | `--rmx-radius-sm` | Small border radius |
| `spacingXs` | `--rmx-spacing-xs` | Extra small spacing |
| `spacingSm` | `--rmx-spacing-sm` | Small spacing |
| `spacingMd` | `--rmx-spacing-md` | Medium spacing |

### Per-Item Toolbar Theming

Style individual toolbar buttons independently using `toolbarItemTheme`.

```jsx
import { createToolbarItemTheme } from 'remyx-editor'

const itemTheme = createToolbarItemTheme({
  bold:      { color: '#e11d48', activeColor: '#be123c', activeBackground: '#ffe4e6', borderRadius: '50%' },
  italic:    { color: '#7c3aed', activeColor: '#6d28d9', activeBackground: '#ede9fe' },
  underline: { color: '#0891b2', activeColor: '#0e7490', activeBackground: '#cffafe' },
  _separator: { color: '#c4b5fd', width: '2px' },
})

<RemyxEditor toolbarItemTheme={itemTheme} />
```

Both `customTheme` and `toolbarItemTheme` can be used together — `customTheme` sets global styles, `toolbarItemTheme` overrides specific items.

**Per-item style properties:**

| Key | CSS Variable | Description |
| --- | --- | --- |
| `color` | `--rmx-tb-color` | Icon/text color |
| `background` | `--rmx-tb-bg` | Default background |
| `hoverColor` | `--rmx-tb-hover-color` | Color on hover |
| `hoverBackground` | `--rmx-tb-hover-bg` | Background on hover |
| `activeColor` | `--rmx-tb-active-color` | Color when active |
| `activeBackground` | `--rmx-tb-active-bg` | Background when active |
| `border` | `--rmx-tb-border` | Border shorthand |
| `borderRadius` | `--rmx-tb-radius` | Border radius |
| `size` | `--rmx-tb-size` | Button width & height |
| `iconSize` | `--rmx-tb-icon-size` | Icon size |
| `padding` | `--rmx-tb-padding` | Button padding |
| `opacity` | `--rmx-tb-opacity` | Button opacity |

**Separator properties** (via `_separator` key):

| Key | CSS Variable | Description |
| --- | --- | --- |
| `color` | `--rmx-tb-sep-color` | Separator color |
| `width` | `--rmx-tb-sep-width` | Separator width |
| `height` | `--rmx-tb-sep-height` | Separator height |
| `margin` | `--rmx-tb-sep-margin` | Separator margin |

## Paste & Auto-Conversion

The editor cleans and normalizes pasted content automatically.

| Source | Handling |
| --- | --- |
| **Microsoft Word** | Strips Office XML, `mso-*` styles, conditional comments. Converts Word-style lists to proper `<ul>`/`<ol>`. |
| **Google Docs** | Removes internal IDs/classes. Converts styled spans to semantic tags (`<strong>`, `<em>`, `<s>`). |
| **LibreOffice** | Strips namespace tags and auto-generated class names. |
| **Apple Pages** | Removes iWork-specific attributes. |
| **Markdown** | Auto-detects and converts to rich HTML (headings, lists, bold, links, code fences, etc.). |
| **Plain text** | Wraps in `<p>` tags with `<br>` for line breaks. |
| **Images** | Inserted as base64 data URIs, or uploaded via `uploadHandler` if configured. |

All paste paths (keyboard, drag-and-drop, context menu) share the same pipeline: HTML goes through `cleanPastedHTML()` then `Sanitizer.sanitize()`. Plain text is checked by `looksLikeMarkdown()` and converted if detected.

```js
import { cleanPastedHTML, looksLikeMarkdown } from 'remyx-editor';

const clean = cleanPastedHTML(dirtyHtml);
const isMarkdown = looksLikeMarkdown(text);
```

## File Uploads

The `uploadHandler` prop controls where images and file attachments are stored. It receives a `File` and returns a `Promise<string>` with the file URL.

Without an `uploadHandler`, images are inserted as base64 data URIs and the attachment upload tab is disabled.

### Custom Server

```jsx
<RemyxEditor
  uploadHandler={async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const { url } = await res.json();
    return url;
  }}
/>
```

### S3 / R2 / GCS (Pre-signed URL)

The same pattern works with any S3-compatible service:

```jsx
<RemyxEditor
  uploadHandler={async (file) => {
    const res = await fetch('/api/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    const { uploadUrl, publicUrl } = await res.json();
    await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    return publicUrl;
  }}
/>
```

### Upload Paths

The handler is called consistently across all upload surfaces:

| Path | Result |
| --- | --- |
| Image toolbar (Upload tab) | Inserted as `<img>` |
| Attachment toolbar (Upload tab) | Inserted as attachment chip |
| Drag & drop image/file | Image as `<img>`, others as attachment |
| Paste image/file | Same as drag & drop |

## Output Formats

```jsx
<RemyxEditor outputFormat="html" onChange={(html) => console.log(html)} />
<RemyxEditor outputFormat="markdown" onChange={(md) => console.log(md)} />
```

Conversion utilities for standalone use:

```js
import { htmlToMarkdown, markdownToHtml } from 'remyx-editor';

const md = htmlToMarkdown('<h1>Hello</h1><p>World</p>');
const html = markdownToHtml('# Hello\n\nWorld');
```

## Attaching to Existing Elements

Enhance an existing `<textarea>` or `<div>` with a full WYSIWYG editor.

### Textarea

```jsx
const textareaRef = useRef(null);

<textarea ref={textareaRef} defaultValue="Initial content" />
<RemyxEditor attachTo={textareaRef} outputFormat="markdown" height={400} />
```

The textarea is hidden and its value stays in sync for form submission.

### Div

```jsx
const divRef = useRef(null);

<div ref={divRef}>
  <h2>Existing content</h2>
  <p>This will become editable.</p>
</div>
<RemyxEditor attachTo={divRef} theme="dark" height={400} />
```

### `useRemyxEditor` Hook

For lower-level control:

```jsx
import { useRemyxEditor } from 'remyx-editor';

const targetRef = useRef(null);
const { engine, containerRef, editableRef, ready } = useRemyxEditor(targetRef, {
  onChange: (content) => console.log(content),
  placeholder: 'Type here...',
  theme: 'light',
  height: 400,
});

<textarea ref={targetRef} />;
```

Returns `engine` (EditorEngine), `containerRef`, `editableRef`, and `ready` (boolean).

## Plugins

### Built-in Plugins

Three plugins are active by default:

- **WordCountPlugin** — word/character counts in the status bar
- **PlaceholderPlugin** — placeholder text when empty
- **AutolinkPlugin** — auto-converts typed URLs to links

### Custom Plugins

```js
import { createPlugin } from 'remyx-editor';

const MyPlugin = createPlugin({
  name: 'my-plugin',
  init(engine) { /* editor initialized */ },
  destroy(engine) { /* cleanup */ },
  commands: [],
  toolbarItems: [],
  statusBarItems: [],
  contextMenuItems: [],
});
```

```jsx
<RemyxEditor plugins={[MyPlugin]} />
```

## Keyboard Shortcuts

`mod` = `Cmd` on Mac, `Ctrl` on Windows/Linux.

| Shortcut | Action |
| --- | --- |
| `mod+B` | Bold |
| `mod+I` | Italic |
| `mod+U` | Underline |
| `mod+Shift+X` | Strikethrough |
| `mod+Z` | Undo |
| `mod+Shift+Z` | Redo |
| `mod+K` | Insert link |
| `mod+F` | Find & replace |
| `mod+Shift+7` | Numbered list |
| `mod+Shift+8` | Bulleted list |
| `mod+Shift+9` | Blockquote |
| `mod+Shift+C` | Code block |
| `Tab` | Indent |
| `Shift+Tab` | Outdent |
| `mod+Shift+F` | Fullscreen |
| `mod+Shift+U` | Source mode |
| `mod+,` | Subscript |
| `mod+.` | Superscript |

## Exports

All exports are available from `remyx-editor`. Core-only exports are also available from `@remyx/core`. React components and hooks are also available from `@remyx/react`.

```js
// React components & hooks (remyx-editor or @remyx/react)
import { RemyxEditor, useRemyxEditor } from 'remyx-editor';
import { RemyxConfigProvider } from 'remyx-editor';

// Everything below is also available from '@remyx/core' or '@remyx/react'

// Toolbar
import { TOOLBAR_PRESETS, DEFAULT_TOOLBAR, removeToolbarItems, addToolbarItems, createToolbar } from 'remyx-editor';

// Defaults
import { DEFAULT_FONTS, DEFAULT_FONT_SIZES, DEFAULT_COLORS, DEFAULT_KEYBINDINGS, DEFAULT_MENU_BAR } from 'remyx-editor';

// Fonts
import { removeFonts, addFonts, loadGoogleFonts } from 'remyx-editor';

// Theming
import { createTheme, THEME_VARIABLES, THEME_PRESETS } from 'remyx-editor';
import { createToolbarItemTheme, resolveToolbarItemStyle, TOOLBAR_ITEM_STYLE_KEYS } from 'remyx-editor';

// Markdown & paste
import { htmlToMarkdown, markdownToHtml, cleanPastedHTML, looksLikeMarkdown } from 'remyx-editor';

// Plugins
import { createPlugin, WordCountPlugin, AutolinkPlugin, PlaceholderPlugin } from 'remyx-editor';

// Config
import { defineConfig } from 'remyx-editor';

// Core engine (advanced)
import { EditorEngine, EventBus, CommandRegistry, Selection, History } from 'remyx-editor';
```

## Using `@remyx/core` Directly

For non-React integrations (Vue, Svelte, Angular, vanilla JS, or Node.js), use the core package directly:

```bash
npm install @remyx/core
```

```js
import { EditorEngine, EventBus } from '@remyx/core';
import '@remyx/core/style.css';

// Create an editor on any DOM element
const element = document.querySelector('#editor');
const engine = new EditorEngine(element, { outputFormat: 'html' });

// Register commands
import { registerFormattingCommands, registerListCommands } from '@remyx/core';
registerFormattingCommands(engine);
registerListCommands(engine);

// Initialize
engine.init();

// Listen for changes
engine.on('content:change', () => {
  console.log(engine.getHTML());
});

// Cleanup
engine.destroy();
```

`@remyx/core` exports 80 named symbols — the full engine, all 16 command register functions, plugin system, utilities (markdown, paste cleaning, export, fonts, themes, toolbar config), constants, and `defineConfig()`. See the [core package README](../remyx-core/README.md) for the full API.

## License

MIT
