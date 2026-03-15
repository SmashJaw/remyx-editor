# Remyx Editor

A feature-rich WYSIWYG editor built on a framework-agnostic core with first-class React support. Configurable toolbar, menu bar, markdown support, theming, file uploads, and a plugin system.

## Packages

| Package | Version | Description |
| --- | --- | --- |
| [`@remyx/core`](./remyx-core/) | 0.23.0 | Framework-agnostic engine, commands, plugins, utilities, and CSS themes |
| [`@remyx/react`](./remyx-react/) | 0.23.0 | React components, hooks, TypeScript declarations (peer-depends on `@remyx/core`) |
| [`remyx-editor`](./remyx-editor/) | 0.23.0 | All-in-one React package (re-exports `@remyx/core` + React layer) |

### Which package should I use?

| Use case | Install |
| --- | --- |
| React project (simplest) | `npm install remyx-editor` |
| React project (modular) | `npm install @remyx/core @remyx/react` |
| Vue / Svelte / Angular / Vanilla JS | `npm install @remyx/core` (build your own wrapper) |
| Server-side HTML processing | `npm install @remyx/core` |

## Quick Start (React)

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

## Quick Start (Core Only)

```js
import { EditorEngine, registerFormattingCommands, registerListCommands } from '@remyx/core';
import '@remyx/core/style.css';

const engine = new EditorEngine(document.querySelector('#editor'), { outputFormat: 'html' });
registerFormattingCommands(engine);
registerListCommands(engine);
engine.init();
```

## Architecture

```
@remyx/core ←── @remyx/react
            ←── (future: @remyx/vue, @remyx/svelte, @remyx/angular, @remyx/vanilla)

remyx-editor (meta) ──→ @remyx/core + React layer (backward-compatible)
```

## Monorepo Structure

```
packages/
  remyx-core/     → @remyx/core         80 exports, 0 framework deps
  remyx-react/    → @remyx/react        React components + hooks + TS types
  remyx-editor/   → remyx-editor        All-in-one (backward-compatible)
```

## Development

```bash
npm install          # install all workspace dependencies
npm run dev          # start Vite dev server with demo app
npm run build        # build all packages
```

## Documentation

- [remyx-editor README](./remyx-editor/README.md) — full API docs, props, theming, plugins, toolbar, menu bar
- [@remyx/core README](./remyx-core/README.md) — engine API, commands, utilities, building framework wrappers
- [@remyx/react README](./remyx-react/README.md) — React-specific components, hooks, and TypeScript support
- [SECURITY.md](./SECURITY.md) — security audit findings and remediation status
- [ROADMAP.md](./ROADMAP.md) — planned features and competitive analysis
- [PLANNED_PACKAGES.md](./PLANNED_PACKAGES.md) — multi-package restructure plan and progress

## License

MIT
