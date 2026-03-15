# @remyx/react

React components, hooks, and TypeScript declarations for the [Remyx Editor](../remyx-editor/). Built on [`@remyx/core`](../remyx-core/) with zero bundled framework-agnostic code — the core is a peer dependency.

For full documentation (props, toolbar config, theming, plugins, keyboard shortcuts), see the [remyx-editor README](../remyx-editor/README.md).

## Installation

```bash
npm install @remyx/core @remyx/react
```

Import both stylesheets:

```js
import '@remyx/core/style.css';   // theme variables, light/dark themes
import '@remyx/react/style.css';  // component styles (toolbar, modals, etc.)
```

Or use the all-in-one [`remyx-editor`](../remyx-editor/) package which bundles everything:

```bash
npm install remyx-editor
```

## Quick Start

```jsx
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

## Exports

### React Components

```js
import { RemyxEditor } from '@remyx/react';
import { RemyxConfigProvider, useRemyxConfig } from '@remyx/react';
```

### React Hooks

```js
import { useRemyxEditor } from '@remyx/react';
import { useEditorEngine } from '@remyx/react';
```

### Core Re-exports

For convenience, `@remyx/react` re-exports everything from `@remyx/core`:

```js
import {
  EditorEngine, defineConfig, createTheme,
  DEFAULT_TOOLBAR, TOOLBAR_PRESETS, THEME_PRESETS,
  htmlToMarkdown, markdownToHtml, createPlugin,
  // ... all 80 core exports
} from '@remyx/react';
```

## TypeScript Support

This package ships with TypeScript declarations in `src/types/index.d.ts`. Key types:

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
| `@remyx/core` | >= 0.23.0 |
| `react` | >= 18.0.0 |
| `react-dom` | >= 18.0.0 |

## Build Output

| File | Size |
| --- | --- |
| `dist/remyx-react.js` (ESM) | ~91 KB |
| `dist/remyx-react.cjs` (CJS) | ~62 KB |
| `dist/style.css` | ~2.3 KB |

`@remyx/core` is externalized — not bundled into this package.

## License

MIT
