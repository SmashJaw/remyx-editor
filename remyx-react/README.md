![Remyx Editor](../docs/images/Remyx-Logo.svg)

# @remyx/react

A feature-rich WYSIWYG editor for React, built on the framework-agnostic [`@remyx/core`](../remyx-core/) engine. Configurable toolbar, menu bar, markdown support, theming, file uploads, and a plugin system.

## Packages

| Package | Version | Description |
| --- | --- | --- |
| [`@remyx/core`](../remyx-core/) | 0.24.0 | Framework-agnostic engine, commands, plugins, utilities, and CSS themes |
| [`@remyx/react`](./) | 0.24.0 | React components, hooks, and TypeScript declarations |

Use `@remyx/core` directly if building a wrapper for another framework (Vue, Svelte, Angular, vanilla JS).

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
- [Read-Only Mode](#read-only-mode)
- [Error Handling](#error-handling)
- [Engine Access](#engine-access)
- [Import & Export Documents](#import--export-documents)
- [Sanitization](#sanitization)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Heading Level Offset](#heading-level-offset)
- [Floating Toolbar & Context Menu](#floating-toolbar--context-menu)
- [Autosave](#autosave)
- [Form Integration](#form-integration)
- [Exports](#exports)
- [TypeScript](#typescript)
- [Using `@remyx/core` Directly](#using-remyxcore-directly)

## Installation

```bash
npm install @remyx/core @remyx/react
```

Import both stylesheets in your app entry point:

```js
import '@remyx/core/style.css';   // theme variables, light/dark themes
import '@remyx/react/style.css';  // component styles (toolbar, modals, etc.)
```

## Quick Start

```jsx
import { useState } from 'react';
import { RemyxEditor } from '@remyx/react';
import '@remyx/core/style.css';
import '@remyx/react/style.css';

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

### Uncontrolled Mode

```jsx
<RemyxEditor
  defaultValue="<p>Initial content</p>"
  onChange={(html) => console.log(html)}
/>
```

### Markdown Mode

```jsx
const [markdown, setMarkdown] = useState('# Hello\n\nStart typing...');

<RemyxEditor
  value={markdown}
  onChange={setMarkdown}
  outputFormat="markdown"
/>
```

### With Upload Handler

```jsx
<RemyxEditor
  value={content}
  onChange={setContent}
  uploadHandler={async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const { url } = await res.json();
    return url;
  }}
/>
```

### Dark Theme with Google Fonts

```jsx
<RemyxEditor
  theme="dark"
  googleFonts={['Inter', 'Fira Code', 'Merriweather']}
  height={500}
/>
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
- **Command palette** — searchable overlay with all editor commands, opened via `Mod+Shift+P` or toolbar button
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
| `theme` | `'light' \| 'dark' \| 'ocean' \| 'forest' \| 'sunset' \| 'rose'` | `'light'` | Editor theme |
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
| `commandPalette` | `boolean` | `true` | Enable command palette (Mod+Shift+P or toolbar button) |
| `autosave` | `boolean \| AutosaveConfig` | `false` | Enable autosave with optional config (storage provider, interval, key) |
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
import { defineConfig } from '@remyx/react';

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
import { RemyxEditor, RemyxConfigProvider } from '@remyx/react';
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
import { TOOLBAR_PRESETS } from '@remyx/react';

<RemyxEditor toolbar={TOOLBAR_PRESETS.full} />      // all items (default)
<RemyxEditor toolbar={TOOLBAR_PRESETS.standard} />   // no source/markdown/embed
<RemyxEditor toolbar={TOOLBAR_PRESETS.minimal} />    // headings, basics, lists, links, images
<RemyxEditor toolbar={TOOLBAR_PRESETS.bare} />       // bold, italic, underline only
```

### Toolbar Helper Functions

#### `removeToolbarItems(config, itemsToRemove)`

```jsx
import { DEFAULT_TOOLBAR, removeToolbarItems } from '@remyx/react';

const toolbar = removeToolbarItems(DEFAULT_TOOLBAR, ['image', 'table', 'embedMedia', 'export']);
```

#### `addToolbarItems(config, items, options?)`

```jsx
import { TOOLBAR_PRESETS, addToolbarItems } from '@remyx/react';

addToolbarItems(TOOLBAR_PRESETS.minimal, ['fullscreen'])              // append as new group
addToolbarItems(TOOLBAR_PRESETS.minimal, 'fullscreen', { group: -1 }) // add to last group
addToolbarItems(TOOLBAR_PRESETS.minimal, 'taskList', { after: 'unorderedList' })
addToolbarItems(TOOLBAR_PRESETS.minimal, 'strikethrough', { before: 'underline' })
```

#### `createToolbar(items)`

Build a toolbar from a flat list — items are auto-grouped by category:

```jsx
import { createToolbar } from '@remyx/react';

const toolbar = createToolbar([
  'bold', 'italic', 'underline', 'headings',
  'link', 'image', 'orderedList', 'unorderedList', 'fullscreen',
]);
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
| `commandPalette` | Button | Open command palette |
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
  menuBar: true,
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
import { DEFAULT_TOOLBAR } from '@remyx/react';
<RemyxEditor menuBar={true} toolbar={DEFAULT_TOOLBAR} />
```

### Menu Bar Behavior

- **Click** a trigger to open, **hover** to switch between open menus
- **Escape** or click outside to close
- Submenus open on hover with a chevron
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
import { DEFAULT_FONTS, removeFonts, addFonts, loadGoogleFonts } from '@remyx/react';

// Remove fonts
const fonts = removeFonts(DEFAULT_FONTS, ['Comic Sans MS', 'Impact']);

// Add fonts (append by default, or { position: 'start' } to prepend)
const fonts = addFonts(DEFAULT_FONTS, ['My Custom Font']);

// Load Google Fonts programmatically
loadGoogleFonts(['Roboto', 'Lato']);
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
import { createTheme } from '@remyx/react';

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
});

<RemyxEditor theme="dark" customTheme={brandTheme} />
```

Or pass raw CSS variables directly:

```jsx
<RemyxEditor customTheme={{ '--rmx-primary': '#e94560', '--rmx-bg': '#1a1a2e' }} />
```

### Theme Presets

All 6 built-in themes are available via the `theme` prop:

```jsx
<RemyxEditor theme="light" />   {/* Default — clean white */}
<RemyxEditor theme="dark" />    {/* Neutral dark */}
<RemyxEditor theme="ocean" />   {/* Deep blue */}
<RemyxEditor theme="forest" />  {/* Green earth-tone */}
<RemyxEditor theme="sunset" />  {/* Warm orange/amber */}
<RemyxEditor theme="rose" />    {/* Soft pink */}
```

Override individual variables on top of any theme with `customTheme`:

```jsx
import { createTheme } from '@remyx/react';

<RemyxEditor theme="ocean" customTheme={createTheme({ primary: '#ff6b6b' })} />
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
import { createToolbarItemTheme } from '@remyx/react';

const itemTheme = createToolbarItemTheme({
  bold:      { color: '#e11d48', activeColor: '#be123c', activeBackground: '#ffe4e6', borderRadius: '50%' },
  italic:    { color: '#7c3aed', activeColor: '#6d28d9', activeBackground: '#ede9fe' },
  underline: { color: '#0891b2', activeColor: '#0e7490', activeBackground: '#cffafe' },
  _separator: { color: '#c4b5fd', width: '2px' },
});

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
import { cleanPastedHTML, looksLikeMarkdown } from '@remyx/react';

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
import { htmlToMarkdown, markdownToHtml } from '@remyx/react';

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
import { useRemyxEditor } from '@remyx/react';

function MyEditor() {
  const targetRef = useRef(null);
  const { engine, containerRef, editableRef, ready } = useRemyxEditor(targetRef, {
    onChange: (content) => console.log(content),
    placeholder: 'Type here...',
    theme: 'light',
    height: 400,
  });

  return <textarea ref={targetRef} />;
}
```

Returns `engine` (EditorEngine), `containerRef`, `editableRef`, and `ready` (boolean).

### `useEditorEngine` Hook

The lowest-level hook — manages just the engine lifecycle:

```jsx
import { useEditorEngine } from '@remyx/react';

function CustomEditor() {
  const editorRef = useRef(null);
  const engine = useEditorEngine(editorRef, {
    outputFormat: 'html',
    plugins: [],
  });

  return <div ref={editorRef} contentEditable />;
}
```

## Plugins

### Built-in Plugins

Three plugins are active by default:

- **WordCountPlugin** — word/character counts in the status bar
- **PlaceholderPlugin** — placeholder text when empty
- **AutolinkPlugin** — auto-converts typed URLs to links

### Custom Plugins

```js
import { createPlugin } from '@remyx/react';

const MyPlugin = createPlugin({
  name: 'my-plugin',
  init(engine) {
    // Called when the editor initializes
    engine.on('content:change', () => {
      console.log('Content changed:', engine.getHTML());
    });
  },
  destroy(engine) {
    // Called when the editor is destroyed — clean up listeners
  },
});
```

```jsx
<RemyxEditor plugins={[MyPlugin]} />
```

### Plugin with Custom Commands

```js
const HighlightPlugin = createPlugin({
  name: 'highlight',
  init(engine) {
    engine.executeCommand('highlight');
  },
  commands: [
    {
      name: 'highlight',
      execute(eng) {
        document.execCommand('backColor', false, '#ffeb3b');
      },
    },
  ],
});
```

## Read-Only Mode

Disable editing while keeping the full rendered output visible.

```jsx
<RemyxEditor value={content} readOnly={true} />
```

Combine with a toggle for preview mode:

```jsx
const [editing, setEditing] = useState(true);

<button onClick={() => setEditing(!editing)}>
  {editing ? 'Preview' : 'Edit'}
</button>
<RemyxEditor value={content} onChange={setContent} readOnly={!editing} />
```

## Error Handling

### onError Callback

Catch errors from plugins, the engine, and file uploads without crashing the app:

```jsx
<RemyxEditor
  onError={(error, info) => {
    if (info.source === 'plugin') {
      console.warn(`Plugin "${info.pluginName}" failed:`, error);
    } else if (info.source === 'upload') {
      alert(`Upload failed: ${error.message}`);
    } else if (info.source === 'engine') {
      console.error(`Engine error in ${info.phase}:`, error);
    }
  }}
/>
```

Error sources:

| Source | Info Fields | Description |
|---|---|---|
| `'plugin'` | `pluginName` | Plugin init/destroy failure |
| `'engine'` | `phase` | Engine initialization error |
| `'upload'` | `file` | Upload handler rejection |

### Custom Error Fallback

Replace the default error UI with your own component:

```jsx
<RemyxEditor
  errorFallback={
    <div className="editor-error">
      <p>Something went wrong. Please refresh.</p>
    </div>
  }
/>
```

## Engine Access

Use the `onReady` callback to access the `EditorEngine` instance for programmatic control.

### Execute Commands

```jsx
function App() {
  const engineRef = useRef(null);

  return (
    <>
      <button onClick={() => engineRef.current?.executeCommand('bold')}>
        Bold
      </button>
      <button onClick={() => engineRef.current?.executeCommand('insertLink', 'https://example.com')}>
        Insert Link
      </button>
      <RemyxEditor onReady={(engine) => { engineRef.current = engine }} />
    </>
  );
}
```

### Listen to Events

```jsx
<RemyxEditor
  onReady={(engine) => {
    engine.on('selection:change', ({ formats }) => {
      console.log('Active formats:', formats); // { bold: true, italic: false, ... }
    });

    engine.on('command:executed', ({ name }) => {
      console.log('Command run:', name);
    });
  }}
  onFocus={() => console.log('Editor focused')}
  onBlur={() => console.log('Editor blurred')}
/>
```

### Read Content Programmatically

```jsx
<RemyxEditor
  onReady={(engine) => {
    // HTML content
    const html = engine.getHTML();

    // Plain text
    const text = engine.getText();

    // Stats
    const words = engine.getWordCount();
    const chars = engine.getCharCount();
    const empty = engine.isEmpty();
  }}
/>
```

### Engine Methods

| Method | Returns | Description |
|---|---|---|
| `getHTML()` | `string` | Sanitized HTML content |
| `setHTML(html)` | `void` | Set editor content |
| `getText()` | `string` | Plain text content |
| `isEmpty()` | `boolean` | True if no meaningful text |
| `focus()` | `void` | Focus the editor |
| `blur()` | `void` | Blur the editor |
| `executeCommand(name, ...args)` | `any` | Execute a registered command |
| `on(event, handler)` | `Function` | Subscribe (returns unsubscribe fn) |
| `off(event, handler)` | `void` | Unsubscribe from event |
| `getWordCount()` | `number` | Word count |
| `getCharCount()` | `number` | Character count |
| `destroy()` | `void` | Clean up the engine |

### Engine Events

| Event | Payload | When |
|---|---|---|
| `'content:change'` | — | Content was modified |
| `'selection:change'` | `{ formats }` | Selection or formatting changed |
| `'focus'` | — | Editor gained focus |
| `'blur'` | — | Editor lost focus |
| `'mode:change'` | — | Switched markdown/source mode |
| `'command:executed'` | `{ name }` | After a command runs |
| `'plugin:error'` | `{ name, error }` | Plugin failed |
| `'editor:error'` | `{ phase, error }` | Engine error |
| `'upload:error'` | `{ file, error }` | Upload failed |

## Import & Export Documents

### Programmatic Export

```jsx
import { exportAsPDF, exportAsDocx, exportAsMarkdown } from '@remyx/react';

function ExportButtons({ content }) {
  return (
    <>
      <button onClick={() => exportAsPDF(content, 'My Document')}>
        Export PDF
      </button>
      <button onClick={() => exportAsDocx(content, 'document.doc')}>
        Export Word
      </button>
      <button onClick={() => exportAsMarkdown(content, 'document.md')}>
        Export Markdown
      </button>
    </>
  );
}
```

PDF export opens the browser print dialog. Word and Markdown exports trigger file downloads.

### Programmatic Import

```jsx
import { convertDocument, isImportableFile } from '@remyx/react';

async function handleFileSelect(file, engine) {
  if (!isImportableFile(file)) {
    alert('Unsupported format');
    return;
  }
  const html = await convertDocument(file);

  // Insert at cursor
  engine.executeCommand('importDocument', { html, mode: 'insert' });

  // Or replace entire content
  engine.executeCommand('importDocument', { html, mode: 'replace' });
}
```

Supported import formats: PDF, DOCX, Markdown, HTML, TXT, CSV, TSV, RTF.

### Toolbar Export & Import

The editor ships with built-in toolbar buttons for both:

```jsx
<RemyxEditor
  toolbar={[
    ['bold', 'italic', 'underline'],
    ['importDocument', 'export'],  // import & export buttons
  ]}
/>
```

The `importDocument` button opens a modal for file selection. The `export` button opens a modal with format options.

## Sanitization

Control which HTML tags, attributes, and CSS properties are allowed in editor content.

### Custom Allowlists

```jsx
<RemyxEditor
  sanitize={{
    allowedTags: {
      // Tag name → array of allowed attributes
      p: ['class', 'style'],
      strong: [],
      em: [],
      a: ['href', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'width', 'height'],
      h1: ['class'], h2: ['class'], h3: ['class'],
      ul: [], ol: [], li: [],
      blockquote: ['class'],
      code: ['class'],
      pre: ['class'],
    },
    allowedStyles: [
      'color', 'background-color', 'font-size', 'text-align',
      'font-weight', 'font-style',
    ],
  }}
/>
```

### Default Security

Without custom sanitization, the editor applies these protections by default:

- Strips `<script>`, `<style>`, `<svg>`, `<math>`, `<form>`, `<object>`, `<embed>` tags entirely
- Blocks all `on*` event handler attributes (e.g., `onclick`, `onerror`)
- Validates URL protocols — blocks `javascript:`, `vbscript:`, `data:text/html`
- Blocks CSS injection (`expression()`, `@import`, `behavior:`)
- Restricts `<input>` to `type="checkbox"` only
- Sandboxes `<iframe>` elements

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
| `mod+Shift+P` | Command palette |
| `mod+,` | Subscript |
| `mod+.` | Superscript |

### Custom Shortcuts

Override default shortcuts by passing a `shortcuts` object:

```jsx
<RemyxEditor
  shortcuts={{
    bold: 'mod+shift+b',      // remap bold
    insertLink: 'mod+l',      // remap link
  }}
/>
```

Register shortcuts programmatically via the engine:

```jsx
<RemyxEditor
  onReady={(engine) => {
    engine.keyboard.register('mod+shift+h', 'highlight');

    // Get platform-specific label for display
    const label = engine.keyboard.getShortcutLabel('mod+b');
    // → '⌘B' on Mac, 'Ctrl+B' on Windows
  }}
/>
```

## Heading Level Offset

When embedding the editor in a page that already has an `<h1>`, use `baseHeadingLevel` to offset heading levels so the editor's headings fit the page hierarchy:

```jsx
// Page has its own <h1>, so editor H1 renders as <h2>
<h1>My Page Title</h1>
<RemyxEditor baseHeadingLevel={2} />
```

| `baseHeadingLevel` | Editor H1 | Editor H2 | Editor H3 |
|---|---|---|---|
| `1` (default) | `<h1>` | `<h2>` | `<h3>` |
| `2` | `<h2>` | `<h3>` | `<h4>` |
| `3` | `<h3>` | `<h4>` | `<h5>` |

All heading levels are clamped to a maximum of `<h6>`.

## Floating Toolbar & Context Menu

### Floating Toolbar

A compact toolbar appears when text is selected, providing quick access to formatting:

```jsx
<RemyxEditor floatingToolbar={true} />   {/* enabled (default) */}
<RemyxEditor floatingToolbar={false} />  {/* disabled */}
```

The floating toolbar shows bold, italic, underline, strikethrough, link, highlight, and heading options near the selection.

### Context Menu

Right-click on the editor content to access a context menu with relevant actions:

```jsx
<RemyxEditor contextMenu={true} />   {/* enabled (default) */}
<RemyxEditor contextMenu={false} />  {/* disabled */}
```

The context menu adapts to the clicked element — links show edit/remove options, images show resize options, tables show row/column operations.

### Combining with Minimal Toolbar

For a clean writing experience, hide the main toolbar and rely on the floating toolbar and context menu:

```jsx
<RemyxEditor
  toolbar={[]}
  floatingToolbar={true}
  contextMenu={true}
  menuBar={false}
  statusBar={false}
  placeholder="Just start writing..."
  height={500}
/>
```

## Command Palette

The command palette provides a searchable overlay listing all available editor commands. Open it via the toolbar button or `Mod+Shift+P` (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows/Linux).

```jsx
<RemyxEditor commandPalette={true} />   {/* enabled (default) */}
<RemyxEditor commandPalette={false} />  {/* disabled */}
```

Commands are organized by category (Text, Lists, Media, Layout, Advanced, Commands) and support fuzzy search. The palette includes all built-in commands plus any registered via the engine's command registry.

To add the command palette button to a custom toolbar:

```jsx
<RemyxEditor
  toolbar={[
    ['bold', 'italic', 'underline'],
    ['commandPalette'],
  ]}
/>
```

## Autosave

Enable autosave with the `autosave` prop. Pass `true` for localStorage defaults, or an object for full control.

### Basic (localStorage)

```jsx
<RemyxEditor value={content} onChange={setContent} autosave />
```

This saves to `localStorage` every 30 seconds and 2 seconds after each content change. A save-status indicator appears in the status bar (Saved / Saving... / Unsaved / Save failed), and a recovery banner appears on reload if unsaved content is detected.

### Cloud Storage (AWS S3 / GCP / custom API)

```jsx
<RemyxEditor
  value={content}
  onChange={setContent}
  autosave={{
    provider: {
      endpoint: 'https://api.example.com/autosave',
      headers: { Authorization: `Bearer ${token}` },
    },
    key: 'doc-123',
    interval: 60000,       // save every 60s
    debounce: 3000,        // 3s after last edit
  }}
/>
```

For S3 presigned URLs or GCP signed URLs, use `buildUrl`:

```jsx
autosave={{
  provider: {
    endpoint: 'https://my-bucket.s3.amazonaws.com',
    buildUrl: (key) => getPresignedUrl(key),
    method: 'PUT',
  },
  key: `user-${userId}/draft`,
}}
```

### Filesystem (Electron / Tauri / Node)

```jsx
autosave={{
  provider: {
    writeFn: async (key, data) => window.electron.writeFile(`/saves/${key}.json`, data),
    readFn: async (key) => window.electron.readFile(`/saves/${key}.json`),
    deleteFn: async (key) => window.electron.deleteFile(`/saves/${key}.json`),
  },
  key: 'my-document',
}}
```

### Custom Provider

```jsx
autosave={{
  provider: {
    save: async (key, content, metadata) => { /* your save logic */ },
    load: async (key) => { /* return { content, timestamp } or null */ },
    clear: async (key) => { /* your delete logic */ },
  },
}}
```

### AutosaveConfig Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | Toggle autosave on/off |
| `interval` | `number` | `30000` | Periodic save interval in ms |
| `debounce` | `number` | `2000` | Debounce delay after content change in ms |
| `provider` | `string \| object` | `'localStorage'` | Storage provider config |
| `key` | `string` | `'rmx-default'` | Storage key for this editor instance |
| `onRecover` | `(data) => void` | — | Callback when recovery data is found |
| `showRecoveryBanner` | `boolean` | `true` | Show the recovery banner UI |
| `showSaveStatus` | `boolean` | `true` | Show save status in the status bar |

### useAutosave Hook

For custom UIs, use the `useAutosave` hook directly:

```jsx
import { useAutosave } from '@remyx/react';

function MyEditor({ engine }) {
  const { saveStatus, lastSaved, recoveryData, recoverContent, dismissRecovery } =
    useAutosave(engine, { enabled: true, key: 'doc-123' });

  return (
    <div>
      <span>Status: {saveStatus}</span>
      {recoveryData && (
        <div>
          <button onClick={recoverContent}>Restore</button>
          <button onClick={dismissRecovery}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
```

## Form Integration

### Next.js / Remix Form

```jsx
function ArticleForm() {
  const [content, setContent] = useState('');

  return (
    <form method="post" action="/api/articles">
      <input type="text" name="title" placeholder="Title" />
      <RemyxEditor value={content} onChange={setContent} height={400} />
      <input type="hidden" name="body" value={content} />
      <button type="submit">Publish</button>
    </form>
  );
}
```

### Textarea Sync

Attach to a `<textarea>` for native form submission — the textarea value stays in sync automatically:

```jsx
function CommentForm() {
  const textareaRef = useRef(null);

  return (
    <form onSubmit={handleSubmit}>
      <textarea ref={textareaRef} name="comment" hidden />
      <RemyxEditor
        attachTo={textareaRef}
        toolbar={[['bold', 'italic', 'link']]}
        statusBar={false}
        height={150}
        placeholder="Write a comment..."
      />
      <button type="submit">Post</button>
    </form>
  );
}
```

### Controlled with Validation

```jsx
function ValidatedEditor() {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const engineRef = useRef(null);

  const validate = () => {
    const words = engineRef.current?.getWordCount() || 0;
    if (words < 10) {
      setError('Please write at least 10 words');
      return false;
    }
    if (words > 5000) {
      setError('Maximum 5000 words allowed');
      return false;
    }
    setError('');
    return true;
  };

  return (
    <div>
      <RemyxEditor
        value={content}
        onChange={(html) => { setContent(html); setError(''); }}
        onReady={(engine) => { engineRef.current = engine }}
        onBlur={validate}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={() => validate() && submitForm(content)}>
        Submit
      </button>
    </div>
  );
}
```

## Exports

`@remyx/react` re-exports everything from `@remyx/core` for convenience. You only need one import source:

```js
// React components & hooks
import { RemyxEditor, useRemyxEditor, useEditorEngine } from '@remyx/react';
import { RemyxConfigProvider, useRemyxConfig } from '@remyx/react';

// Toolbar
import { TOOLBAR_PRESETS, DEFAULT_TOOLBAR, removeToolbarItems, addToolbarItems, createToolbar } from '@remyx/react';

// Defaults
import { DEFAULT_FONTS, DEFAULT_FONT_SIZES, DEFAULT_COLORS, DEFAULT_KEYBINDINGS, DEFAULT_MENU_BAR } from '@remyx/react';

// Fonts
import { removeFonts, addFonts, loadGoogleFonts } from '@remyx/react';

// Theming
import { createTheme, THEME_VARIABLES, THEME_PRESETS } from '@remyx/react';
import { createToolbarItemTheme, resolveToolbarItemStyle, TOOLBAR_ITEM_STYLE_KEYS } from '@remyx/react';

// Markdown & paste
import { htmlToMarkdown, markdownToHtml, cleanPastedHTML, looksLikeMarkdown } from '@remyx/react';

// Document conversion
import { convertDocument, isImportableFile, getSupportedExtensions, getSupportedFormatNames } from '@remyx/react';

// Export
import { exportAsPDF, exportAsDocx, exportAsMarkdown } from '@remyx/react';

// Plugins
import { createPlugin, WordCountPlugin, AutolinkPlugin, PlaceholderPlugin } from '@remyx/react';

// Command palette
import { SLASH_COMMAND_ITEMS, filterSlashItems } from '@remyx/react';

// Config
import { defineConfig } from '@remyx/react';

// Core engine (advanced)
import { EditorEngine, EventBus, CommandRegistry, Selection, History } from '@remyx/react';
```

## TypeScript

This package ships with TypeScript declarations. Key types:

```ts
import type {
  RemyxEditorProps,
  MenuBarConfig,
  Plugin,
  UseRemyxEditorReturn,
  UseEditorEngineReturn,
} from '@remyx/react';
```

### RemyxEditorProps

Full type definition for all `<RemyxEditor>` props including `value`, `onChange`, `toolbar`, `menuBar`, `theme`, `plugins`, `uploadHandler`, and more.

### EditorEngine

The core engine type with methods like `getHTML()`, `setHTML()`, `executeCommand()`, `on()`, `off()`, and `destroy()`.

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

`@remyx/core` exports 80+ named symbols — the full engine, all 16 command register functions, plugin system, utilities (markdown, paste cleaning, export, fonts, themes, toolbar config), constants, and `defineConfig()`. See the [core package README](../remyx-core/README.md) for the full API.

## Architecture

```
@remyx/react
  components/
    RemyxEditor.jsx       Main editor component
    Toolbar/              Toolbar buttons, dropdowns, color pickers
    MenuBar/              Application-style menu system
    Modals/               Link, image, table, export, import modals
    EditArea/             Content area, floating toolbar, image resize
    StatusBar/            Word/character count
    ContextMenu/          Right-click menu
  hooks/
    useEditorEngine.js    Low-level engine lifecycle hook
    useRemyxEditor.js     High-level editor setup hook
    useSelection.js       Selection state tracking
    useModal.js           Modal open/close state
    useContextMenu.js     Context menu positioning
  config/
    RemyxConfigProvider.jsx  React context for shared config
  icons/
    index.jsx             SVG icon components
  types/
    index.d.ts            TypeScript declarations
```

## Peer Dependencies

| Package | Version |
| --- | --- |
| `@remyx/core` | >= 0.24.0 |
| `react` | >= 18.0.0 |
| `react-dom` | >= 18.0.0 |

## License

MIT
