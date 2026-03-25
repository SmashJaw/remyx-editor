# Remyx Editor - Setup & Installation

## Quick Start

### Installation

```bash
npm install @remyxjs/core @remyxjs/react
```

### Basic Usage

```jsx
import { RemyxEditor } from '@remyxjs/react'

function App() {
  return <RemyxEditor config="default" />
}
```

The `config` prop references a JSON file in your `remyxjs/config/` directory.

---

## Project Structure

```
your-project/
  remyxjs/
    config/           # Editor configuration files
      default.json
      blog-editor.json
      minimal.json
    plugins/          # Optional plugins (drag-and-drop install)
      analytics/
      table/
      comments/
      ...
    themes/           # Theme CSS files
      light.css
      dark.css
      ocean.css
      ...
  src/
    App.jsx
```

---

## Configuration

Each `<RemyxEditor />` instance is driven by a JSON config file. The config file controls the theme, toolbar layout, active plugins, and all editor behavior.

### Creating a Config File

Create a JSON file in `remyxjs/config/`:

```json
{
  "theme": "light",
  "placeholder": "Start typing...",
  "height": 400,
  "outputFormat": "html",
  "toolbar": [
    ["undo", "redo"],
    ["headings", "fontFamily", "fontSize"],
    ["bold", "italic", "underline", "strikethrough"],
    ["foreColor", "backColor"],
    ["alignLeft", "alignCenter", "alignRight"],
    ["orderedList", "unorderedList"],
    ["link", "image", "table", "codeBlock"]
  ],
  "floatingToolbar": true,
  "contextMenu": true,
  "commandPalette": true,
  "statusBar": "bottom",
  "plugins": {
    "syntax-highlight": true,
    "table": true,
    "link": true,
    "analytics": { "enabled": true, "wordsPerMinute": 250 }
  }
}
```

### Using the Config

```jsx
<RemyxEditor config="my-config" />
```

This loads `remyxjs/config/my-config.json`.

### Built-in Config Presets

5 presets ship out of the box:

| Preset | Description |
|--------|-------------|
| `default` | Full-featured editor with standard toolbar |
| `minimal` | Stripped-down toolbar for simple editing |
| `blog-editor` | Blog-focused layout with heading and media tools |
| `full-toolbar` | All toolbar items enabled |
| `toolbar-and-menu` | Full toolbar plus menu bar |

### Multiple Editors with Different Configs

```jsx
<RemyxEditor config="default" />
<RemyxEditor config="minimal" />
<RemyxEditor config="blog-editor" />
```

Each editor independently uses its own config file.

---

## Config Reference

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `theme` | `string` | `'light'` | Theme name: light, dark, ocean, forest, rose, sunset |
| `placeholder` | `string` | `''` | Placeholder text when editor is empty |
| `height` | `number` | `300` | Editor height in pixels |
| `minHeight` | `number` | — | Minimum height in pixels |
| `maxHeight` | `number` | — | Maximum height in pixels |
| `readOnly` | `boolean` | `false` | Read-only mode |
| `outputFormat` | `'html' \| 'markdown'` | `'html'` | Content output format |
| `toolbar` | `string[][]` | default | Grouped toolbar commands |
| `toolbarWrap` | `boolean` | `true` | Wrap toolbar icons to next row |
| `toolbarOverflow` | `boolean` | `false` | Use `...` overflow button instead of wrapping |
| `menuBar` | `boolean \| object[]` | `false` | Enable menu bar or provide custom menu config |
| `statusBar` | `'top' \| 'bottom' \| false` | `'bottom'` | Status bar position |
| `floatingToolbar` | `boolean` | `true` | Show toolbar on text selection |
| `contextMenu` | `boolean` | `true` | Enable right-click context menu |
| `commandPalette` | `boolean` | `true` | Enable Cmd+Shift+P command palette |
| `breadcrumb` | `boolean` | `false` | Show heading breadcrumb bar |
| `minimap` | `boolean` | `false` | Show document minimap |
| `splitViewFormat` | `'html' \| 'markdown'` | — | Enable split view with format |
| `fonts` | `string[]` | system fonts | Available font families |
| `googleFonts` | `string[]` | — | Google Fonts to load |
| `customTheme` | `object` | — | CSS variable overrides |
| `toolbarItemTheme` | `object` | — | Per-toolbar-item styling |
| `autosave` | `boolean \| object` | `false` | Autosave configuration |
| `plugins` | `object` | `{}` | Plugin activation and options |

---

## Toolbar Configuration

### Built-in Commands

**Text Formatting:** `bold`, `italic`, `underline`, `strikethrough`, `subscript`, `superscript`, `removeFormat`

**Headings & Fonts:** `headings`, `fontFamily`, `fontSize`

**Colors:** `foreColor`, `backColor`

**Alignment:** `alignLeft`, `alignCenter`, `alignRight`, `alignJustify`

**Lists:** `orderedList`, `unorderedList`, `checkList`, `indent`, `outdent`

**Inserts:** `link`, `image`, `attachment`, `importDocument`, `table`, `embedMedia`, `codeBlock`, `blockquote`, `horizontalRule`

**Advanced:** `subscript`, `superscript`, `removeFormat`, `callout`, `math`, `toc`, `bookmark`, `mergeTag`

**View:** `sourceMode`, `markdownToggle`, `splitView`, `distractionFree`, `fullscreen`, `findReplace`, `export`, `commandPalette`

**Plugins:** `spellcheck`, `analytics`, `comments`, `collaboration`

### Toolbar Groups

Items in the same array are grouped together with separators between groups:

```json
{
  "toolbar": [
    ["undo", "redo"],
    ["bold", "italic", "underline"],
    ["link", "image"]
  ]
}
```

### Toolbar Overflow vs Wrap

By default, toolbar icons wrap to the next row when they don't fit:

```json
{ "toolbarWrap": true }
```

To use a `...` overflow button instead:

```json
{ "toolbarOverflow": true }
```

---

## Plugin System

### Installing Plugins

Drop a plugin folder into `remyxjs/plugins/` and add it to your config:

```json
{
  "plugins": {
    "analytics": { "enabled": true, "wordsPerMinute": 200 }
  }
}
```

### Uninstalling Plugins

1. Remove from config
2. Delete the plugin folder from `remyxjs/plugins/`

### Available Plugins (14)

| Plugin Folder | Description |
|---------------|-------------|
| `analytics/` | Readability scores, reading time, SEO hints |
| `block-template/` | Block-level templates with pre-built layouts |
| `callout/` | Info/warning/error/success/tip/note/question blocks |
| `collaboration/` | Real-time co-editing, live cursors, presence |
| `comments/` | Inline comment threads, @mentions, resolve/reopen |
| `drag-drop/` | Drop zones, cross-editor drag, block reorder |
| `keyboard/` | Vim/Emacs modes, multi-cursor, auto-pairing |
| `link/` | Link previews, broken link detection, auto-linking |
| `math/` | LaTeX math rendering, symbol palette, equation numbering |
| `spellcheck/` | Grammar checking, writing-style presets, dictionary |
| `syntax-highlight/` | Code block syntax highlighting with language detection |
| `table/` | Sortable columns, filters, formulas, resize handles |
| `template/` | Merge tags, conditionals, loops, template library |
| `toc/` | Auto-generated table of contents, outline, headings |

See [plugins.md](./plugins.md) for detailed options per plugin.

---

## Theme System

### Built-in Themes

| Theme | Description |
|-------|-------------|
| `light` | Clean, minimal light theme |
| `dark` | Dark mode with contrasting colors |
| `ocean` | Cool blue tones |
| `forest` | Green earthy tones |
| `rose` | Pink warm tones |
| `sunset` | Orange/golden warm tones |

### Using a Theme

```json
{ "theme": "ocean" }
```

### Custom Themes

Drop a CSS file into `remyxjs/themes/` following the naming convention. Override CSS custom properties:

```css
/* remyxjs/themes/my-theme.css */
.rmx-editor[data-theme="my-theme"] {
  --rmx-bg: #1a1a2e;
  --rmx-text: #e0e0e0;
  --rmx-primary: #e94560;
  --rmx-toolbar-bg: #16213e;
  --rmx-toolbar-border: #0f3460;
  --rmx-content-bg: #1a1a2e;
}
```

Then reference it in your config:

```json
{ "theme": "my-theme" }
```

### Google Fonts

Add custom Google Fonts to your editor:

```json
{
  "googleFonts": ["Roboto", "Open Sans", "Lato", "Montserrat"],
  "fonts": ["Roboto", "Open Sans", "Lato", "Montserrat", "Arial", "Georgia"]
}
```

---

## React Component Props

The `<RemyxEditor />` component accepts the following props:

| Prop | Type | Description |
|------|------|-------------|
| `config` | `string` | Config file name (required) |
| `value` | `string` | Controlled content (HTML or Markdown) |
| `defaultValue` | `string` | Initial content for uncontrolled mode |
| `onChange` | `(content: string) => void` | Content change callback |
| `onReady` | `(engine: EditorEngine) => void` | Called when editor engine is ready |
| `onFocus` | `() => void` | Focus callback |
| `onBlur` | `() => void` | Blur callback |
| `onError` | `(error: Error) => void` | Error callback |
| `className` | `string` | CSS class for the wrapper element |
| `style` | `object` | Inline styles for the wrapper element |

### Example

```jsx
import { RemyxEditor } from '@remyxjs/react'

function MyEditor() {
  const [content, setContent] = useState('')

  return (
    <RemyxEditor
      config="default"
      value={content}
      onChange={setContent}
      onReady={(engine) => console.log('Editor ready', engine)}
    />
  )
}
```

---

## Menu Bar Configuration

Enable a full menu bar by setting `menuBar` to `true` or providing a custom structure:

```json
{
  "menuBar": [
    { "label": "File", "items": ["importDocument", "export"] },
    { "label": "Edit", "items": ["undo", "redo", "findReplace", "selectAll"] },
    { "label": "View", "items": ["fullscreen", "sourceMode", "splitView"] },
    { "label": "Insert", "items": ["link", "image", "table", "codeBlock", "horizontalRule", "callout", "math"] },
    { "label": "Format", "items": ["bold", "italic", "underline", "strikethrough", "removeFormat", "alignLeft", "alignCenter", "alignRight"] }
  ]
}
```

---

## Development

### Running the Demo

```bash
npm install
npx vite
```

The demo app at `src/App.jsx` showcases multiple editor configurations.

### Building

```bash
cd packages/remyx-core && npm run build
cd packages/remyx-react && npm run build
```

### Testing

```bash
cd packages && npx vitest
```
