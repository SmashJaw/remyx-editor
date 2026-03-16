![Remyx Editor](./docs/images/Remyx-Logo.svg)

# Remyx Editor

A feature-rich WYSIWYG editor built on a framework-agnostic core with first-class React support. Configurable toolbar, menu bar, markdown support, theming, file uploads, and a plugin system.

## Features

- **Rich text editing** — Bold, italic, underline, strikethrough, subscript, superscript, headings (H1–H6), lists (ordered, unordered, task), blockquotes, code blocks, horizontal rules, tables, links, images, media embeds, attachments, and font styling
- **Markdown support** — Toggle between WYSIWYG and Markdown editing, paste Markdown and have it auto-converted, export as Markdown
- **Configurable toolbar** — 4 built-in presets (full, standard, minimal, bare), add/remove items, group separators, per-item theming
- **Menu bar** — Hierarchical menus (File, Edit, Insert, Format, View) with keyboard navigation and WAI-ARIA patterns
- **Theming** — Light/dark modes via CSS custom properties, 4 color presets (ocean, forest, sunset, rose), fully customizable
- **Plugin system** — `createPlugin()` with init/destroy lifecycle, custom commands, toolbar/status-bar/context-menu items, sandboxed API
- **File uploads** — Paste or drag-and-drop images, configurable upload handler, file size limits
- **Document import/export** — Import PDF, DOCX, Markdown, HTML, TXT, CSV, TSV, RTF; export to PDF, DOCX, Markdown
- **Find & replace** — Search with case sensitivity, navigate matches, replace one or all
- **Source mode** — Toggle raw HTML editing
- **Fullscreen mode** — Distraction-free editing
- **Keyboard shortcuts** — 17+ default shortcuts, customizable via API
- **Accessibility** — Skip navigation, focus trapping in modals, ARIA roles, keyboard-navigable toolbar
- **Security** — XSS-safe HTML sanitizer, dangerous tag removal, event handler blocking, CSS injection prevention
- **Tree-shakeable** — Import only the commands and utilities you need

## Packages

| Package | Version | Description |
| --- | --- | --- |
| [`@remyx/core`](./remyx-core/) | 0.25.0 | Framework-agnostic engine, commands, plugins, utilities, and CSS themes |
| [`@remyx/react`](./remyx-react/) | 0.25.0 | React components, hooks, TypeScript declarations (peer-depends on `@remyx/core`) |
| [`create-remyx`](./create-remyx/) | 0.25.0 | Reserved for future interactive CLI wizard ([see roadmap](./docs/ROADMAP.md)) |

## Getting Started

### New Project (Recommended)

The fastest way to start is with `create-remyx-app` (shipped with `@remyx/react`), which scaffolds a complete project:

```bash
npx create-remyx-app my-editor
```

You'll be prompted to pick:
- **Language**: JavaScript (JSX) or TypeScript (TSX)
- **PDF/DOCX import**: include or skip heavy document dependencies (~5 MB)

### Which package should I use?

| Use case | Install |
| --- | --- |
| New project (interactive setup) | `npx create-remyx-app` |
| React project | `npm install @remyx/core @remyx/react` |
| Vue / Svelte / Angular / Vanilla JS | `npm install @remyx/core` (build your own wrapper) |
| Server-side HTML processing | `npm install @remyx/core` |

## Quick Start (React)

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

### Customize the toolbar

```jsx
<RemyxEditor
  value={content}
  onChange={setContent}
  toolbar={[
    ['bold', 'italic', 'underline'],
    ['heading'],
    ['orderedList', 'unorderedList'],
    ['link', 'image'],
    ['undo', 'redo'],
  ]}
/>
```

### Add a theme

```jsx
import { THEME_PRESETS } from '@remyx/core';

<RemyxEditor
  value={content}
  onChange={setContent}
  theme={THEME_PRESETS.ocean}
  darkMode={true}
/>
```

### Handle file uploads

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

### Add plugins

```jsx
import { WordCountPlugin, AutolinkPlugin, PlaceholderPlugin } from '@remyx/core';

<RemyxEditor
  value={content}
  onChange={setContent}
  plugins={[WordCountPlugin, AutolinkPlugin, PlaceholderPlugin('Write something...')]}
/>
```

See the full [@remyx/react README](./remyx-react/README.md) for all props, hooks, error handling, engine access, modals, forms, and more.

## Quick Start (Core Only)

```js
import {
  EditorEngine,
  registerFormattingCommands,
  registerHeadingCommands,
  registerListCommands,
  registerLinkCommands,
  registerBlockCommands,
} from '@remyx/core';
import '@remyx/core/style.css';

const engine = new EditorEngine(document.querySelector('#editor'), {
  outputFormat: 'html',
});

registerFormattingCommands(engine);
registerHeadingCommands(engine);
registerListCommands(engine);
registerLinkCommands(engine);
registerBlockCommands(engine);

engine.init();

// Listen for changes
engine.on('content:change', () => {
  console.log(engine.getHTML());
});

// Execute commands programmatically
engine.executeCommand('bold');
engine.executeCommand('heading', 2);

// Cleanup
engine.destroy();
```

See the full [@remyx/core README](./remyx-core/README.md) for the complete engine API, all 40+ commands, plugin system, selection API, sanitizer, theming, toolbar config, utilities, and framework wrapper guide.

## Architecture

```
@remyx/core ←── @remyx/react
            ←── (future: @remyx/vue, @remyx/svelte, @remyx/angular, @remyx/vanilla)
```

`@remyx/core` contains the entire editor engine with zero framework dependencies. Framework packages like `@remyx/react` provide components and hooks that wrap the core engine.

### What's in each package

| | `@remyx/core` | `@remyx/react` |
| --- | --- | --- |
| Editor engine | Yes | Re-exports from core |
| Commands (40+) | Yes | Re-exports from core |
| Plugin system | Yes | Re-exports from core |
| Utilities | Yes | Re-exports from core |
| CSS themes | Yes | Additional component styles |
| React components | — | RemyxEditor, Toolbar, StatusBar, Modals |
| React hooks | — | useRemyxEditor, useEditorEngine, useSelection |
| TypeScript types | — | Full `.d.ts` declarations |
| Scaffolding CLI | — | `npx create-remyx-app` |

## Monorepo Structure

```
packages/
  create-remyx/   → create-remyx        Reserved for future CLI wizard
  remyx-core/     → @remyx/core         80+ exports, 0 framework deps
  remyx-react/    → @remyx/react        React components + hooks + TS types + scaffolding CLI
  docs/           Documentation, changelogs, roadmap, benchmarks
```

## Bundle Size

| Package | JS (gzipped) | CSS (gzipped) |
| --- | --- | --- |
| `@remyx/core` | ~21 KB | ~5 KB |
| `@remyx/react` | ~14 KB | ~2 KB |
| **Combined** | **~35 KB** | **~7 KB** |

Heavy dependencies (`mammoth` for DOCX, `pdfjs-dist` for PDF) are optional peer dependencies and use dynamic imports — they're only loaded when a file of that type is imported.

## Development

```bash
# Install dependencies
npm install

# Start dev server (Vite)
npm run dev

# Build all packages
npm run build:all

# Build individual packages
npm run build:core
npm run build:react

# Run tests (815 unit tests)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run e2e tests (Playwright)
npm run e2e

# Lint
npm run lint

# Type check
npm run typecheck

# Bundle analysis
npm run analyze:core
npm run analyze:react
```

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for setup instructions, architecture overview, how to add commands and plugins, and the PR process.

## Documentation

| Document | Description |
| --- | --- |
| [@remyx/react README](./remyx-react/README.md) | Full API — props, hooks, theming, plugins, toolbar, menu bar, error handling, engine access, forms |
| [@remyx/core README](./remyx-core/README.md) | Full API — engine, commands, plugins, selection, history, sanitizer, theming, toolbar config, utilities |
| [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Setup, architecture, adding commands/plugins, PR process |
| [CHANGELOG.md](./docs/CHANGELOG.md) | Version history and release notes |
| [ROADMAP.md](./docs/ROADMAP.md) | Planned features, framework wrappers, create-remyx CLI wizard |
| [NX.md](./docs/NX.md) | Nx monorepo management — build, version, publish, caching, affected commands |
| [BENCHMARK.md](./docs/BENCHMARK.md) | Build, bundle, test, and lint performance metrics |
| [PLANNED_PACKAGES.md](./docs/PLANNED_PACKAGES.md) | Multi-package restructure plan and progress |
| [BUGS.md](./docs/BUGS.md) | Known bugs and resolution status |
| [SECURITY.md](./docs/SECURITY.md) | Security audit findings and remediation status |
| [CLEANUP.md](./docs/CLEANUP.md) | Cleanup tasks and technical debt |
| [OPTIMIZATION.md](./docs/OPTIMIZATION.md) | Bundle size and runtime performance roadmap |

## License

Remyx Editor is [MIT licensed](./LICENSE).
