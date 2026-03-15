![Remyx Editor](./docs/images/Remyx-Logo.svg)

# Remyx Editor

A feature-rich WYSIWYG editor built on a framework-agnostic core with first-class React support. Configurable toolbar, menu bar, markdown support, theming, file uploads, and a plugin system.

## Packages

| Package | Version | Description |
| --- | --- | --- |
| [`@remyx/core`](./remyx-core/) | 0.24.0 | Framework-agnostic engine, commands, plugins, utilities, and CSS themes |
| [`@remyx/react`](./remyx-react/) | 0.24.0 | React components, hooks, TypeScript declarations (peer-depends on `@remyx/core`) |
| [`create-remyx`](./create-remyx/) | 0.23.4 | CLI scaffolding tool — choose JSX or TypeScript |

### Getting Started (New Project)

The fastest way to start is with `create-remyx`, which lets you choose JSX or TypeScript:

```bash
npm create remyx@latest my-editor
```

You'll be prompted to pick:
- **Language**: JavaScript (JSX) or TypeScript (TSX)
- **PDF/DOCX import**: include or skip heavy document dependencies (~5 MB)

### Which package should I use?

| Use case | Install |
| --- | --- |
| New project (interactive setup) | `npm create remyx@latest` |
| React project | `npm install @remyx/core @remyx/react` |
| Vue / Svelte / Angular / Vanilla JS | `npm install @remyx/core` (build your own wrapper) |
| Server-side HTML processing | `npm install @remyx/core` |

## Quick Start (React)

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
```

## Monorepo Structure

```
packages/
  create-remyx/   → create-remyx        CLI scaffolding (JSX or TypeScript)
  remyx-core/     → @remyx/core         80 exports, 0 framework deps
  remyx-react/    → @remyx/react        React components + hooks + TS types
```

## Documentation

- [@remyx/react README](./remyx-react/README.md) — full API docs, props, theming, plugins, toolbar, menu bar
- [@remyx/core README](./remyx-core/README.md) — engine API, commands, utilities, building framework wrappers
- [BUGS.md](./docs/BUGS.md) — known bugs and resolution status
- [CHANGELOG.md](./docs/CHANGELOG.md) — version history and release notes
- [CLEANUP.md](./docs/CLEANUP.md) — cleanup tasks and technical debt
- [OPTIMIZATION.md](./docs/OPTIMIZATION.md) — bundle size and runtime performance roadmap
- [PLANNED_PACKAGES.md](./docs/PLANNED_PACKAGES.md) — multi-package restructure plan and progress
- [ROADMAP.md](./docs/ROADMAP.md) — planned features and competitive analysis
- [SECURITY.md](./docs/SECURITY.md) — security audit findings and remediation status

## License

Remyx Editor is [MIT licensed](./LICENSE).
