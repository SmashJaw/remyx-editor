![Remyx Editor](../docs/screenshots/Remyx-Logo.svg)

# @remyxjs/react

A feature-rich WYSIWYG editor for React, built on the framework-agnostic [`@remyxjs/core`](../remyx-core/) engine. Configurable toolbar, menu bar, markdown support, theming, file uploads, and a plugin system.

## Packages

| Package | Version | Description |
| --- | --- | --- |
| [`@remyxjs/core`](../remyx-core/) | 1.0.0-beta | Framework-agnostic engine, commands, plugins, utilities, and CSS themes |
| [`@remyxjs/react`](./) | 1.0.0-beta | React components, hooks, and TypeScript declarations |

Use `@remyxjs/core` directly if building a wrapper for another framework (Vue, Svelte, Angular, vanilla JS).

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
- [UX/UI Features](#uxui-features)
- [Collaboration](#collaboration)
- [Form Integration](#form-integration)
- [Exports](#exports)
- [TypeScript](#typescript)
- [Using `@remyxjs/core` Directly](#using-remyxcore-directly)

## Installation

```bash
npm install @remyxjs/core @remyxjs/react
```

Import both stylesheets in your app entry point:

```js
import '@remyxjs/core/style.css';   // theme variables, light/dark themes
import '@remyxjs/react/style.css';  // component styles (toolbar, modals, etc.)
```

## Quick Start

```jsx
import { useState } from 'react';
import { RemyxEditor } from '@remyxjs/react';
import '@remyxjs/core/style.css';
import '@remyxjs/react/style.css';

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

- **Rich text editing** — bold, italic, underline, strikethrough, subscript, superscript, headings, lists, blockquotes, code blocks, tables (with sorting, filtering, formulas, cell formatting, resize handles, and clipboard interop), and horizontal rules
- **Toolbar** — fully configurable with presets, helper functions, and per-item theming
- **Menu bar** — application-style menus (File, Edit, View, Insert, Format) with submenus and auto-deduplication
- **Markdown** — bidirectional HTML/Markdown conversion, toggle between modes, and auto-detection on paste
- **Theming** — light/dark mode, 4 built-in presets (Ocean, Forest, Sunset, Rose), full CSS variable customization
- **File uploads** — images and attachments via drag-and-drop, paste, or toolbar with pluggable upload handlers (S3, R2, GCS, custom)
- **Fonts** — custom font lists, Google Fonts auto-loading, and helper functions
- **Code block syntax highlighting** — 11 languages with auto-detection, theme-aware colors, language selector dropdown, line numbers toggle, copy-to-clipboard, inline code highlighting, and extensible language registry
- **Enhanced tables** — sortable columns, multi-column sort, filterable rows, inline formulas, cell formatting, column/row resize, sticky headers, and Excel/Sheets clipboard interop via `TablePlugin`
- **Template system** — `{{merge_tag}}` chips, `{{#if}}`/`{{#each}}` blocks, live preview, 5 pre-built templates, custom template library via `TemplatePlugin`
- **Keyboard-first editing** — Vim (normal/insert/visual), Emacs keybindings, custom key map, multi-cursor (`Cmd+D`), smart auto-pairing, jump-to-heading via `KeyboardPlugin`
- **Drag-and-drop content** — Drop zones, cross-editor drag, file/image/rich-text drops, block reorder with ghost preview via `DragDropPlugin`
- **Advanced link management** — Link previews, broken link detection, auto-linking, click analytics, bookmark anchors via `LinkPlugin`
- **Callouts & alerts** — 7 built-in callout types with custom type registration, collapsible toggle, nested content, and GitHub-flavored alert syntax auto-conversion via `CalloutPlugin`
- **Comments & annotations** — Inline comment threads via `CommentsPlugin`, `CommentsPanel` sidebar with thread cards/replies/actions, `useComments` hook for reactive state, @mention parsing, resolved/unresolved state, comment-only mode, import/export
- **Real-time collaboration** — CRDT-based co-editing with live cursors, presence indicators, offline-first sync, configurable transport (WebSocket, WebRTC, or custom) via `CollaborationPlugin`, `useCollaboration` hook, `CollaborationBar` component
- **Plugins** — `createPlugin()` API with hooks for commands, toolbar items, status bar items, and context menus
- **Config file** — centralized `defineConfig()` with named editor configurations and provider-based sharing
- **Block-based editing** — block-level toolbar with type conversion, drag-to-reorder, collapsible sections, block grouping, `BlockTemplatePlugin` with built-in templates
- **Mobile & touch** — touch floating toolbar, swipe indent/outdent, long-press context menu with haptic feedback, pinch-to-zoom, responsive toolbar overflow, virtual keyboard-aware layout
- **Multi-instance** — unlimited editors per page with full isolation (state, events, DOM, modals), `EditorBus` for inter-editor communication, `SharedResources` for memory-efficient shared schemas and icons
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
| `emptyState` | `boolean \| ReactNode` | `false` | Show empty state when editor has no content (true for default, or custom React node) |
| `breadcrumb` | `boolean` | `false` | Show breadcrumb bar with DOM path to current selection |
| `minimap` | `boolean` | `false` | Show minimap preview on right edge |
| `splitViewFormat` | `'html' \| 'markdown'` | `'html'` | Format for split view preview pane |
| `customizableToolbar` | `boolean` | `false` | Enable drag-and-drop toolbar button rearrangement |
| `onToolbarChange` | `(order: string[]) => void` | — | Called when toolbar order changes via drag |
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
import { defineConfig } from '@remyxjs/react';

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
import { RemyxEditor, RemyxConfigProvider } from '@remyxjs/react';
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

### External Configuration (JSON/YAML URL)

Load the entire editor config from a remote JSON or YAML file — no code changes needed to update the editor:

```jsx
import { RemyxEditorFromConfig } from '@remyxjs/react';

function App() {
  return (
    <RemyxEditorFromConfig
      url="/editor-config.json"
      env="production"
      value={content}
      onChange={setContent}
      loadingFallback={<div>Loading editor...</div>}
      errorFallback={({ error, reload }) => (
        <div>
          <p>Config failed to load: {error.message}</p>
          <button onClick={reload}>Retry</button>
        </div>
      )}
    />
  );
}
```

| Prop | Type | Description |
| --- | --- | --- |
| `url` | `string` | URL to a JSON or YAML config file |
| `env` | `string` | Environment name for config merging (e.g., `'production'`) |
| `fetchHeaders` | `Record<string, string>` | Custom headers for authenticated config endpoints |
| `pollInterval` | `number` | Auto-reload interval in ms (0 = disabled) |
| `onConfigLoad` | `(config) => void` | Callback when config loads successfully |
| `onConfigError` | `(error) => void` | Callback on load error |
| `loadingFallback` | `ReactNode` | UI shown while loading (default: null) |
| `errorFallback` | `ReactNode \| ({ error, reload }) => ReactNode` | UI shown on error (default: retry button) |
| `...rest` | — | All other props forwarded to `<RemyxEditor />` (overrides loaded config) |

#### useExternalConfig hook

For more control, use the hook directly:

```jsx
import { useExternalConfig, RemyxEditor } from '@remyxjs/react';

function MyEditor() {
  const { config, loading, error, reload } = useExternalConfig('/editor-config.yaml', {
    env: process.env.NODE_ENV,
    pollInterval: 60000, // Auto-reload every 60s
    onLoad: (cfg) => console.log('Config loaded:', cfg),
    onError: (err) => console.error('Config error:', err),
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <button onClick={reload}>Retry</button>;

  return <RemyxEditor {...config} value={content} onChange={setContent} />;
}
```

| Return value | Type | Description |
| --- | --- | --- |
| `config` | `object \| null` | The loaded configuration, or null before first load |
| `loading` | `boolean` | True while fetching |
| `error` | `Error \| null` | Fetch or parse error, or null |
| `reload` | `() => Promise<void>` | Re-fetch the config (cancels any in-flight request) |

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
import { TOOLBAR_PRESETS } from '@remyxjs/react';

<RemyxEditor toolbar={TOOLBAR_PRESETS.full} />      // all items including plugin commands (default)
<RemyxEditor toolbar={TOOLBAR_PRESETS.rich} />       // all features with callout, math, toc, bookmark, merge tag
<RemyxEditor toolbar={TOOLBAR_PRESETS.standard} />   // common editing without plugins
<RemyxEditor toolbar={TOOLBAR_PRESETS.minimal} />    // headings, basics, lists, links, images
<RemyxEditor toolbar={TOOLBAR_PRESETS.bare} />       // bold, italic, underline only
```

### Toolbar Helper Functions

#### `removeToolbarItems(config, itemsToRemove)`

```jsx
import { DEFAULT_TOOLBAR, removeToolbarItems } from '@remyxjs/react';

const toolbar = removeToolbarItems(DEFAULT_TOOLBAR, ['image', 'table', 'embedMedia', 'export']);
```

#### `addToolbarItems(config, items, options?)`

```jsx
import { TOOLBAR_PRESETS, addToolbarItems } from '@remyxjs/react';

addToolbarItems(TOOLBAR_PRESETS.minimal, ['fullscreen'])              // append as new group
addToolbarItems(TOOLBAR_PRESETS.minimal, 'fullscreen', { group: -1 }) // add to last group
addToolbarItems(TOOLBAR_PRESETS.minimal, 'taskList', { after: 'unorderedList' })
addToolbarItems(TOOLBAR_PRESETS.minimal, 'strikethrough', { before: 'underline' })
```

#### `createToolbar(items)`

Build a toolbar from a flat list — items are auto-grouped by category:

```jsx
import { createToolbar } from '@remyxjs/react';

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
| `insertCallout` | Button | Insert callout block |
| `insertMath` | Button | Insert math equation |
| `insertToc` | Button | Insert table of contents |
| `insertBookmark` | Button | Insert bookmark anchor |
| `insertMergeTag` | Button | Insert merge tag |
| `toggleAnalytics` | Button | Toggle analytics panel |
| `toggleSpellcheck` | Button | Toggle spellcheck |
| `checkGrammar` | Button | Run grammar check |
| `addComment` | Button | Add inline comment on selection |
| `removeFormat` | Button | Remove all inline formatting |
| `distractionFree` | Button | Toggle distraction-free mode (Mod+Shift+D) |
| `toggleSplitView` | Button | Toggle side-by-side preview (Mod+Shift+V) |
| `typography` | Dropdown | Typography controls (line height, letter spacing, paragraph spacing) |
| `lineHeight` | Dropdown | Line height adjustment |
| `letterSpacing` | Dropdown | Letter spacing adjustment |
| `paragraphSpacing` | Dropdown | Paragraph spacing adjustment |
| `startCollaboration` | Button | Start real-time collaboration session |
| `stopCollaboration` | Button | Stop collaboration session |

## Menu Bar

Add an application-style menu bar above the toolbar. Both the toolbar and menu bar display all their items — the menu bar is an additional navigation layer, not a replacement for the toolbar.

### Enable

```jsx
<RemyxEditor menuBar={true} />
```

**Default menus:**

| Menu | Items |
| --- | --- |
| **File** | Import Document, Export Document |
| **Edit** | Undo, Redo, Find & Replace |
| **View** | Fullscreen, Distraction-Free Mode, Split View, Toggle Markdown, Source Mode, Toggle Analytics |
| **Insert** | Link, Image, Table, Attachment, Embed Media, Blockquote, Code Block, Horizontal Rule, Insert Callout, Insert Math, Insert TOC, Insert Bookmark, Insert Merge Tag, Add Comment |
| **Format** | Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Alignment, Lists, Colors, Typography (Line Height, Letter Spacing, Paragraph Spacing), Remove Formatting |

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

### Toolbar and Menu Bar

When both the toolbar and menu bar are enabled, the full toolbar is preserved. The menu bar provides an additional navigation layer — it does not remove items from the toolbar. Both surfaces can be used together to give users maximum flexibility.

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
import { DEFAULT_FONTS, removeFonts, addFonts, loadGoogleFonts } from '@remyxjs/react';

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
import { createTheme } from '@remyxjs/react';

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
import { createTheme } from '@remyxjs/react';

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
import { createToolbarItemTheme } from '@remyxjs/react';

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
import { cleanPastedHTML, looksLikeMarkdown } from '@remyxjs/react';

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
import { htmlToMarkdown, markdownToHtml } from '@remyxjs/react';

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
import { useRemyxEditor } from '@remyxjs/react';

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
import { useEditorEngine } from '@remyxjs/react';

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

Fifteen built-in plugins are available:

- **WordCountPlugin** — word/character counts in the status bar
- **PlaceholderPlugin** — placeholder text when empty
- **AutolinkPlugin** — auto-converts typed URLs to links
- **SyntaxHighlightPlugin** — automatic syntax highlighting for code blocks with language detection, theme-aware colors, `setCodeLanguage`/`getCodeLanguage`/`toggleLineNumbers` commands, copy-to-clipboard button, inline `<code>` mini-highlighting, and extensible language registry (`registerLanguage`/`unregisterLanguage`). When active, a language selector dropdown appears on focused code blocks.
- **TablePlugin** — enhanced table features including column/row resize handles, click-to-sort on header cells (single + multi-column with Shift), per-column filter dropdowns, inline cell formulas (SUM, AVERAGE, COUNT, MIN, MAX, IF, CONCAT), cell formatting (number, currency, percentage, date), and sticky header rows. Adds 6 new commands: `toggleHeaderRow`, `sortTable`, `filterTable`, `clearTableFilters`, `formatCell`, `evaluateFormulas`. Context menu adds Toggle Header Row, Format Cell options, and Clear Filters when right-clicking in a table.

- **CalloutPlugin** — styled callout blocks with 7 built-in types (info, warning, error, success, tip, note, question), custom type registration, collapsible toggle, nested content, GFM alert syntax auto-conversion. Adds 4 commands: `insertCallout`, `removeCallout`, `changeCalloutType`, `toggleCalloutCollapse`. Context menu adds "Insert Callout" and "Remove Callout".
- **CommentsPlugin** — inline comment threads on selected text, resolved/unresolved state with visual indicators, @mention parsing, reply threads, comment-only mode (read-only editor with annotation support), import/export, DOM sync via MutationObserver. Adds 6 new commands: `addComment`, `deleteComment`, `resolveComment`, `replyToComment`, `editComment`, `navigateToComment`. Context menu adds "Add Comment" when text is selected.
- **LinkPlugin** — link preview tooltips (via `onUnfurl` callback), broken link detection with periodic scanning and `rmx-link-broken` indicators, auto-linking of typed URLs/emails/phone numbers on Space/Enter, link click analytics (`onLinkClick`), bookmark anchors (`insertBookmark`, `linkToBookmark`, `getBookmarks`, `removeBookmark`), `scanBrokenLinks`/`getBrokenLinks` commands.
- **TemplatePlugin** — `{{merge_tag}}` syntax with visual chips, `{{#if condition}}...{{/if}}` conditional blocks, `{{#each items}}...{{/each}}` repeatable sections, live preview with sample data, 5 pre-built templates (email, invoice, letter, report, newsletter), `registerTemplate`/`unregisterTemplate`/`getTemplateLibrary`/`getTemplate` APIs, `exportTemplate` JSON export. Adds 6 commands: `insertMergeTag`, `loadTemplate`, `previewTemplate`, `exitPreview`, `exportTemplate`, `getTemplateTags`.
- **KeyboardPlugin** — Vim mode (normal/insert/visual with h/j/k/l/w/b motions), Emacs keybindings (Ctrl+A/E/F/B/K/Y), custom keybinding map, smart bracket/quote auto-pairing with wrap-selection, multi-cursor (`Cmd+D`), jump-to-heading (`Cmd+Shift+G`). Adds 5 commands: `setKeyboardMode`, `getVimMode`, `jumpToHeading`, `getHeadings`, `selectNextOccurrence`.
- **DragDropPlugin** — drop zone overlays with visual guides, cross-editor drag via `text/x-remyx-block` transfer, external file/image/rich-text drops, block reorder with ghost preview and drop indicator, `onDrop`/`onFileDrop` callbacks. Adds 2 commands: `moveBlockUp`, `moveBlockDown` (`Cmd+Shift+Arrow`).
- **MathPlugin** — LaTeX/KaTeX math rendering with `$...$` inline and `$$...$$` block syntax, pluggable `renderMath(latex, displayMode)` callback, 40+ symbol palette across 4 categories (Greek, Operators, Arrows, Common), auto equation numbering, `latexToMathML()` conversion, `parseMathExpressions()` detection. Adds 6 commands: `insertMath`, `editMath`, `insertSymbol`, `getSymbolPalette`, `getMathElements`, `copyMathAs`.
- **TocPlugin** — auto-generated table of contents from H1-H6 heading hierarchy, section numbering (1, 1.1, 1.2), `insertToc` renders linked `<nav>` into document, `scrollToHeading` with smooth scroll, `validateHeadings` detects skipped levels, `onOutlineChange` callback + `toc:change` event. Adds 4 commands: `getOutline`, `insertToc`, `scrollToHeading`, `validateHeadings`.
- **AnalyticsPlugin** — real-time readability scores (Flesch-Kincaid, Gunning Fog, Coleman-Liau, Flesch Reading Ease), reading time estimate, vocabulary level (basic/intermediate/advanced), sentence/paragraph length warnings, goal-based word count with progress tracking, keyword density, SEO hints. `onAnalytics` callback + `analytics:update` event. Adds 3 commands: `getAnalytics`, `getSeoAnalysis`, `getKeywordDensity`.
- **SpellcheckPlugin** — built-in grammar engine with passive voice detection, wordiness patterns, cliche detection, and punctuation checks. Inline red wavy (spelling), blue wavy (grammar), and green dotted (style) underlines. Right-click context menu with correction suggestions, "Ignore", and "Add to Dictionary". Writing-style presets (formal, casual, technical, academic). BCP 47 multi-language support. Optional `customService` interface for LanguageTool/Grammarly. Persistent dictionary via localStorage. `onError`/`onCorrection` callbacks + `spellcheck:update`/`grammar:check` events. Adds 6 commands: `toggleSpellcheck`, `checkGrammar`, `addToDictionary`, `ignoreWord`, `setWritingStyle`, `getSpellcheckStats`.

```jsx
import { SyntaxHighlightPlugin, TablePlugin, CommentsPlugin, CalloutPlugin, LinkPlugin, TemplatePlugin, KeyboardPlugin, DragDropPlugin, MathPlugin, TocPlugin, AnalyticsPlugin, SpellcheckPlugin } from '@remyxjs/react';

<RemyxEditor
  plugins={[SyntaxHighlightPlugin(), TablePlugin(), CommentsPlugin(), CalloutPlugin(), LinkPlugin(), TemplatePlugin(), KeyboardPlugin(), DragDropPlugin(), MathPlugin(), TocPlugin(), AnalyticsPlugin(), SpellcheckPlugin()]}
/>
```

#### TablePlugin in depth

When `TablePlugin()` is active, every `<table class="rmx-table">` in the editor automatically gains:

| Feature | How it works |
| --- | --- |
| **Sortable columns** | Click any `<th>` to cycle through ascending → descending → unsorted. Rows are physically reordered in the DOM so the sort persists in HTML output. |
| **Multi-column sort** | Hold **Shift** and click additional headers. A small priority number appears on each sorted header. |
| **Sort data types** | The sort auto-detects numeric, date, or alphabetical data. Pass `dataType` explicitly or provide a custom comparator via the `tableSortComparator` engine option. |
| **Sort indicators** | ▲/▼ triangles rendered via CSS `::after` on `<th>` elements with `data-sort-dir` attributes. |
| **Filterable rows** | A small ▽ icon appears in each header cell. Click it to open a filter dropdown with a text input. Rows not matching the filter are hidden (non-destructive — they reappear when the filter is cleared). Multiple columns can be filtered simultaneously (AND logic). |
| **Column/row resize** | Invisible 6px drag handles appear at column and row borders. Drag to resize. The resize is smooth (rAF-driven) and creates an undo snapshot on mouseup. |
| **Inline formulas** | Type `=SUM(A1:A5)` in any cell. On blur, the formula is stored in a `data-formula` attribute and the computed result is displayed. On focus, the formula text is shown for editing. Supports SUM, AVERAGE, COUNT, MIN, MAX, IF, CONCAT, cell references (A1 notation), ranges, arithmetic, and comparison operators. Circular references are detected and display `#CIRC!`. |
| **Cell formatting** | Right-click a cell to format as Number, Currency, Percentage, or Date. The raw value is preserved in `data-raw-value`; the display uses `Intl.NumberFormat` / `Intl.DateTimeFormat`. |
| **Sticky header** | `<thead><th>` cells use `position: sticky` so the header row stays visible when scrolling tall tables. |
| **Clipboard interop** | Copying table content produces both HTML and TSV (tab-separated values). Pasting TSV or HTML tables from Excel / Google Sheets inserts data into the grid starting at the caret cell, auto-expanding rows and columns as needed. |

**Custom sort comparator:**

```jsx
<RemyxEditor
  plugins={[TablePlugin()]}
  engineOptions={{
    tableSortComparator: (a, b, dataType, columnIndex) => {
      // Custom comparison logic — return negative, zero, or positive
      return a.localeCompare(b);
    },
  }}
/>
```

**Programmatic commands (via engine ref):**

```jsx
import { useRef } from 'react';

function MyEditor() {
  const engineRef = useRef(null);

  const handleSort = () => {
    engineRef.current?.executeCommand('sortTable', {
      keys: [
        { columnIndex: 0, direction: 'asc' },
        { columnIndex: 2, direction: 'desc', dataType: 'numeric' },
      ],
    });
  };

  const handleFilter = () => {
    engineRef.current?.executeCommand('filterTable', {
      columnIndex: 1,
      filterValue: 'active',
    });
  };

  return (
    <>
      <button onClick={handleSort}>Sort by Name then Score</button>
      <button onClick={handleFilter}>Show active only</button>
      <RemyxEditor
        plugins={[TablePlugin()]}
        onReady={(engine) => { engineRef.current = engine; }}
      />
    </>
  );
}
```

**Context menu additions** (appear when right-clicking inside a table):
- Toggle Header Row
- Format as Number / Currency / Percentage / Date
- Clear Filters

### CalloutPlugin

The `CalloutPlugin` adds styled callout/alert/admonition blocks with collapsible toggle and GFM alert auto-conversion:

```jsx
import { CalloutPlugin } from '@remyxjs/react';

<RemyxEditor plugins={[CalloutPlugin()]} />
```

**Insert callouts programmatically:**

```jsx
// Basic callout
engine.executeCommand('insertCallout', { type: 'warning' });

// Collapsible with custom title
engine.executeCommand('insertCallout', { type: 'tip', collapsible: true, title: 'Pro tip' });

// With pre-populated content
engine.executeCommand('insertCallout', {
  type: 'info',
  content: '<ul><li>Step 1</li><li>Step 2</li></ul>',
});

// Change type of the focused callout
engine.executeCommand('changeCalloutType', 'error');

// Register a custom callout type
import { registerCalloutType } from '@remyxjs/react';
registerCalloutType({ type: 'security', label: 'Security', icon: '🔒', color: '#dc2626' });
```

**GitHub-flavored alerts** — blockquotes with `> [!NOTE]`, `> [!WARNING]`, etc. are automatically converted to callout blocks on paste or typing.

**Available types:** `info`, `warning`, `error`, `success`, `tip`, `note`, `question` (plus any custom types).

### CommentsPlugin

The `CommentsPlugin` adds inline comment threads — highlight text, attach discussion threads, resolve/reopen, reply, and @mention other users.

```jsx
import { CommentsPlugin } from '@remyxjs/react';

<RemyxEditor
  plugins={[CommentsPlugin({
    onComment: (thread) => saveToServer(thread),
    onResolve: ({ thread, resolved }) => updateServer(thread),
    onDelete: (thread) => deleteFromServer(thread),
    onReply: ({ thread, reply }) => notifyUser(reply),
    mentionUsers: ['alice', 'bob', 'charlie'],
  })]}
/>
```

**Comment-only mode** — make the editor read-only but still allow annotations:

```jsx
<RemyxEditor
  plugins={[CommentsPlugin({ commentOnly: true })]}
/>
```

#### useComments hook

The `useComments` hook provides reactive state and convenience methods:

```jsx
import { useComments, CommentsPanel } from '@remyxjs/react';

function AnnotatedEditor() {
  const engineRef = useRef(null);
  const {
    threads, activeThread, addComment, deleteComment,
    resolveComment, replyToComment, navigateToComment,
    exportThreads, importThreads,
  } = useComments(engineRef.current);

  return (
    <div style={{ display: 'flex' }}>
      <RemyxEditor
        plugins={[CommentsPlugin({ mentionUsers: ['alice', 'bob'] })]}
        onReady={(engine) => { engineRef.current = engine; }}
        style={{ flex: 1 }}
      />
      <CommentsPanel
        threads={threads}
        activeThread={activeThread}
        onNavigate={navigateToComment}
        onResolve={(id, resolved) => resolveComment(id, resolved)}
        onDelete={deleteComment}
        onReply={(id, params) => replyToComment(id, params)}
        filter="all"  {/* 'all' | 'open' | 'resolved' */}
      />
    </div>
  );
}
```

#### CommentsPanel props

| Prop | Type | Description |
| --- | --- | --- |
| `threads` | `CommentThread[]` | All threads (from `useComments`) |
| `activeThread` | `CommentThread \| null` | Currently focused thread |
| `onNavigate` | `(threadId) => void` | Called when a thread card is clicked |
| `onResolve` | `(threadId, resolved) => void` | Called when Resolve/Reopen is clicked |
| `onDelete` | `(threadId) => void` | Called when Delete is clicked |
| `onReply` | `(threadId, { author, body }) => void` | Called when a reply is submitted |
| `filter` | `'all' \| 'open' \| 'resolved'` | Which threads to display |
| `className` | `string` | Additional CSS class |

#### Engine events

| Event | Payload | When |
| --- | --- | --- |
| `comment:created` | `{ thread }` | New comment added |
| `comment:resolved` | `{ thread, resolved }` | Thread resolved or reopened |
| `comment:deleted` | `{ thread }` | Thread deleted |
| `comment:replied` | `{ thread, reply }` | Reply added to thread |
| `comment:updated` | `{ thread }` | Thread body edited |
| `comment:clicked` | `{ thread, element }` | Comment highlight clicked |
| `comment:navigated` | `{ threadId }` | Scrolled to comment |
| `comment:imported` | `{ count }` | Threads imported |

### Custom Plugins

```js
import { createPlugin } from '@remyxjs/react';

const MyPlugin = createPlugin({
  name: 'my-plugin',
  version: '1.0.0',
  description: 'Example plugin with lifecycle hooks',
  author: 'You',

  // Lifecycle hooks (auto-wired, sandboxed)
  onContentChange(api) {
    console.log('Content changed:', api.getText().length, 'chars');
  },
  onSelectionChange(api) {
    console.log('Selection:', api.getActiveFormats());
  },

  // Traditional init/destroy
  init(api) { /* called once on mount */ },
  destroy(api) { /* called on unmount */ },

  // Dependencies — ensures 'other-plugin' is initialized first
  dependencies: ['other-plugin'],

  // Scoped settings with validation
  settingsSchema: [
    { key: 'maxLength', type: 'number', label: 'Max Length', defaultValue: 5000, validate: (v) => v > 0 },
    { key: 'mode', type: 'select', label: 'Mode', defaultValue: 'auto', options: [
      { label: 'Auto', value: 'auto' }, { label: 'Manual', value: 'manual' },
    ]},
  ],
  defaultSettings: { maxLength: 5000, mode: 'auto' },
});
```

```jsx
<RemyxEditor plugins={[MyPlugin]} />
```

Access plugin settings from outside:

```jsx
<RemyxEditor
  plugins={[MyPlugin]}
  onReady={(engine) => {
    engine.plugins.getPluginSetting('my-plugin', 'maxLength'); // 5000
    engine.plugins.setPluginSetting('my-plugin', 'maxLength', 3000); // validates + updates
  }}
/>
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
import { exportAsPDF, exportAsDocx, exportAsMarkdown } from '@remyxjs/react';

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
import { convertDocument, isImportableFile } from '@remyxjs/react';

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

Commands are organized by category (Text, Lists, Media, Layout, Advanced, Commands) and support fuzzy search. The palette includes all built-in commands, any registered via the engine's command registry, and custom items added with `registerCommandItems()`.

**Recently-used commands** are automatically pinned to the top of the palette under a "Recent" category. The last 5 executed commands are tracked in `localStorage`. This works for both the command palette (Mod+Shift+P) and the inline slash command menu (Mod+/).

**Custom command items** can be registered from anywhere in your application:

```jsx
import { registerCommandItems, unregisterCommandItem } from '@remyxjs/react';

// Register custom commands that appear in the palette
registerCommandItems({
  id: 'saveToCloud',
  label: 'Save to Cloud',
  description: 'Upload current document',
  icon: '☁️',
  keywords: ['save', 'cloud', 'upload'],
  category: 'Custom',
  action: (engine) => uploadToCloud(engine.getHTML()),
});

// Clean up when no longer needed
unregisterCommandItem('saveToCloud');
```

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
import { useAutosave } from '@remyxjs/react';

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

## UX/UI Features

### Empty State

Show a configurable empty state when the editor has no content:
```jsx
// Default illustration + "Start typing..." message
<RemyxEditor emptyState />

// Custom empty state component
<RemyxEditor emptyState={<div>Drop content here or start typing...</div>} />
```

### Breadcrumb Bar

Display the DOM path to the current cursor position:
```jsx
<RemyxEditor breadcrumb />
```
Shows a bar like "Blockquote > List > Item 2" or "Table > Row 3 > Cell 1" that updates on every selection change.

### Minimap

Show a scaled-down document preview on the right edge:
```jsx
<RemyxEditor minimap />
```
Click anywhere on the minimap to scroll to that position. Updates automatically on content changes.

### Split View

Side-by-side edit + preview pane:
```jsx
<RemyxEditor splitViewFormat="html" />    // HTML preview
<RemyxEditor splitViewFormat="markdown" /> // Markdown preview
```
Toggle via `Mod+Shift+V` or the toolbar button. The preview updates in real time.

### Distraction-Free Mode

Hide all editor chrome (toolbar, menu bar, status bar) for focused writing:
```jsx
// Trigger via command
engine.executeCommand('distractionFree');
```
Shortcut: `Mod+Shift+D`. Chrome reappears on mouse movement and auto-hides after 3 seconds.

### Toolbar Customization

Let users drag-and-drop toolbar buttons to rearrange them:
```jsx
<RemyxEditor
  customizableToolbar
  onToolbarChange={(newOrder) => console.log('Toolbar reordered:', newOrder)}
/>
```
The custom order is persisted in `localStorage` and restored on next load.

### Typography Controls

Fine-tune line height, letter spacing, and paragraph spacing via the `typography` toolbar dropdown or programmatically:
```jsx
// Add 'typography' to your toolbar config
<RemyxEditor toolbar={[['bold', 'italic'], ['typography']]} />
```

### Color Palette Presets

Save and reuse custom color palettes. A "Save Preset" button appears in the color picker dropdown. Presets are stored in `localStorage`.

## Collaboration

### useSpellcheck Hook

For reactive spellcheck/grammar state, use the `useSpellcheck` hook:

```jsx
import { useSpellcheck, SpellcheckPlugin } from '@remyxjs/react';

function MyEditor() {
  const engineRef = useRef(null);
  const {
    errors,           // Array of current spellcheck/grammar errors
    stats,            // { total, grammar, style, byRule }
    enabled,          // boolean — whether spellcheck is active
    stylePreset,      // current writing style preset
    language,         // current BCP 47 language tag
    toggleSpellcheck, // () => boolean — toggle on/off
    checkGrammar,     // () => Promise<Array> — run grammar check
    addToDictionary,  // (word) => void
    ignoreWord,       // (word) => void
    setWritingStyle,  // ('formal'|'casual'|'technical'|'academic') => void
    setLanguage,      // (lang) => void
    getDictionary,    // () => string[]
  } = useSpellcheck(engineRef.current);

  return (
    <div>
      <span>{stats.total} issues found</span>
      <button onClick={toggleSpellcheck}>{enabled ? 'Disable' : 'Enable'}</button>
      <RemyxEditor
        plugins={[SpellcheckPlugin({ stylePreset: 'formal' })]}
        onReady={(engine) => { engineRef.current = engine }}
      />
    </div>
  );
}
```

### useCollaboration Hook

For real-time collaborative editing, use the `useCollaboration` hook:

```jsx
import { useCollaboration, CollaborationBar, CollaborationPlugin } from '@remyxjs/react';

function CollaborativeEditor() {
  const engineRef = useRef(null);
  const { status, peers, connect, disconnect } = useCollaboration(engineRef.current);

  return (
    <div>
      <CollaborationBar status={status} peers={peers} />
      <button onClick={() => connect({ serverUrl: 'wss://signal.example.com', roomId: 'room-1', userName: 'Alice' })}>
        Join
      </button>
      <button onClick={disconnect}>Leave</button>
      <RemyxEditor
        plugins={[CollaborationPlugin({ autoConnect: false })]}
        onReady={(engine) => { engineRef.current = engine; }}
      />
    </div>
  );
}
```

#### useCollaboration return value

| Property | Type | Description |
| --- | --- | --- |
| `status` | `'connected' \| 'disconnected' \| 'connecting' \| 'error'` | Current connection state |
| `peers` | `Array<{ id, name, color, cursor, isActive }>` | List of connected peers |
| `connect` | `(opts: { serverUrl, roomId, userName }) => void` | Connect to a collaboration room |
| `disconnect` | `() => void` | Disconnect from the room |

#### CollaborationBar props

| Prop | Type | Description |
| --- | --- | --- |
| `status` | `string` | Connection status (from `useCollaboration`) |
| `peers` | `Array` | Peer list (from `useCollaboration`) |
| `className` | `string` | Additional CSS class |
| `showAvatars` | `boolean` | Show peer avatar circles (default: `true`) |

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

`@remyxjs/react` re-exports everything from `@remyxjs/core` for convenience. You only need one import source:

```js
// React components & hooks
import { RemyxEditor, useRemyxEditor, useEditorEngine } from '@remyxjs/react';
import { RemyxConfigProvider, useRemyxConfig } from '@remyxjs/react';

// External config
import { RemyxEditorFromConfig, useExternalConfig } from '@remyxjs/react';
import { loadConfig } from '@remyxjs/react'; // re-exported from core

// Toolbar
import { TOOLBAR_PRESETS, DEFAULT_TOOLBAR, removeToolbarItems, addToolbarItems, createToolbar } from '@remyxjs/react';

// Defaults
import { DEFAULT_FONTS, DEFAULT_FONT_SIZES, DEFAULT_COLORS, DEFAULT_KEYBINDINGS, DEFAULT_MENU_BAR } from '@remyxjs/react';

// Fonts
import { removeFonts, addFonts, loadGoogleFonts } from '@remyxjs/react';

// Theming
import { createTheme, THEME_VARIABLES, THEME_PRESETS } from '@remyxjs/react';
import { createToolbarItemTheme, resolveToolbarItemStyle, TOOLBAR_ITEM_STYLE_KEYS } from '@remyxjs/react';

// Markdown & paste
import { htmlToMarkdown, markdownToHtml, cleanPastedHTML, looksLikeMarkdown } from '@remyxjs/react';

// Document conversion
import { convertDocument, isImportableFile, getSupportedExtensions, getSupportedFormatNames } from '@remyxjs/react';

// Export
import { exportAsPDF, exportAsDocx, exportAsMarkdown } from '@remyxjs/react';

// Plugins
import { createPlugin, WordCountPlugin, AutolinkPlugin, PlaceholderPlugin, SyntaxHighlightPlugin } from '@remyxjs/react';

// Syntax highlighting utilities
import { SUPPORTED_LANGUAGES, LANGUAGE_MAP, detectLanguage, tokenize } from '@remyxjs/react';

// Command palette
import { SLASH_COMMAND_ITEMS, filterSlashItems } from '@remyxjs/react';

// Advanced Link Management
import { LinkPlugin, detectLinks, slugify } from '@remyxjs/react';

// Templates, Keyboard, Drag & Drop
import { TemplatePlugin, renderTemplate, getTemplateLibrary } from '@remyxjs/react';
import { KeyboardPlugin, getHeadings } from '@remyxjs/react';
import { DragDropPlugin } from '@remyxjs/react';

// Math & Equations
import { MathPlugin, getSymbolPalette, parseMathExpressions, latexToMathML } from '@remyxjs/react';

// Table of Contents
import { TocPlugin, buildOutline, renderTocHTML, validateHeadingHierarchy } from '@remyxjs/react';

// Content Analytics
import { AnalyticsPlugin, analyzeContent, keywordDensity, seoAnalysis } from '@remyxjs/react';

// Callouts & Alerts
import { CalloutPlugin, registerCalloutType, getCalloutTypes, parseGFMAlert } from '@remyxjs/react';

// Comments & Annotations
import { CommentsPlugin, parseMentions } from '@remyxjs/react';    // core exports
import { useComments, CommentsPanel } from '@remyxjs/react';        // React-specific

// Spelling & Grammar
import { SpellcheckPlugin, analyzeGrammar, STYLE_PRESETS } from '@remyxjs/react';  // core exports
import { useSpellcheck } from '@remyxjs/react';                                     // React-specific

// Collaboration
import { CollaborationPlugin } from '@remyxjs/react';              // core export
import { useCollaboration, CollaborationBar } from '@remyxjs/react'; // React-specific

// Config
import { defineConfig } from '@remyxjs/react';

// Core engine (advanced)
import { EditorEngine, EventBus, CommandRegistry, Selection, History } from '@remyxjs/react';
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
} from '@remyxjs/react';
```

### RemyxEditorProps

Full type definition for all `<RemyxEditor>` props including `value`, `onChange`, `toolbar`, `menuBar`, `theme`, `plugins`, `uploadHandler`, and more.

### EditorEngine

The core engine type with methods like `getHTML()`, `setHTML()`, `executeCommand()`, `on()`, `off()`, and `destroy()`.

## Using `@remyxjs/core` Directly

For non-React integrations (Vue, Svelte, Angular, vanilla JS, or Node.js), use the core package directly:

```bash
npm install @remyxjs/core
```

```js
import { EditorEngine, EventBus } from '@remyxjs/core';
import '@remyxjs/core/style.css';

// Create an editor on any DOM element
const element = document.querySelector('#editor');
const engine = new EditorEngine(element, { outputFormat: 'html' });

// Register commands
import { registerFormattingCommands, registerListCommands } from '@remyxjs/core';
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

`@remyxjs/core` exports 90+ named symbols — the full engine, all 17 command register functions, plugin system (including syntax highlighting), autosave providers, utilities (markdown, paste cleaning, export, fonts, themes, toolbar config), constants, and `defineConfig()`. See the [core package README](../remyx-core/README.md) for the full API.

## Architecture

```
@remyxjs/react
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
| `@remyxjs/core` | >= 0.34.0 |
| `react` | >= 18.0.0 |
| `react-dom` | >= 18.0.0 |

## License

MIT
