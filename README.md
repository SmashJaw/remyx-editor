![Remyx Editor](./docs/images/Remyx-Logo.svg)

# Remyx Editor

A feature-rich WYSIWYG editor built on a framework-agnostic core with first-class React support. Configurable toolbar, menu bar, markdown support, theming, file uploads, and a plugin system.

## Features

- **Rich text editing** — Bold, italic, underline, strikethrough, subscript, superscript, headings (H1–H6), lists (ordered, unordered, task), blockquotes, code blocks, horizontal rules, tables, links, images, media embeds, attachments, and font styling
- **Markdown support** — Toggle between WYSIWYG and Markdown editing, paste Markdown and have it auto-converted, export as Markdown
- **Configurable toolbar** — 4 built-in presets (full, standard, minimal, bare), add/remove items, group separators, per-item theming
- **Menu bar** — Hierarchical menus (File, Edit, Insert, Format, View) with keyboard navigation and WAI-ARIA patterns
- **Theming** — 6 built-in themes (`light`, `dark`, `ocean`, `forest`, `sunset`, `rose`) via a single `theme` prop, fully customizable with CSS custom properties
- **Plugin system** — `createPlugin()` with init/destroy lifecycle, custom commands, toolbar/status-bar/context-menu items, sandboxed API
- **File uploads** — Paste or drag-and-drop images, configurable upload handler, file size limits
- **Document import/export** — Import PDF, DOCX, Markdown, HTML, TXT, CSV, TSV, RTF; export to PDF, DOCX, Markdown
- **Find & replace** — Search with case sensitivity, navigate matches, replace one or all
- **Source mode** — Toggle raw HTML editing
- **Fullscreen mode** — Distraction-free editing
- **Command palette** — Searchable overlay with all editor commands (`Mod+Shift+P` or toolbar button), fuzzy search, keyboard navigation
- **Autosave** — Periodic + debounced saves with crash recovery banner, visual save-status indicator, pluggable storage (localStorage, sessionStorage, filesystem, AWS S3/GCP/cloud HTTP, or custom)
- **Keyboard shortcuts** — 17+ default shortcuts, customizable via API
- **Accessibility** — Skip navigation, focus trapping in modals, ARIA roles, keyboard-navigable toolbar
- **Code block syntax highlighting** — 11 languages (JS/TS, Python, CSS, SQL, JSON, Bash, Rust, Go, Java, HTML) with auto-detection, theme-aware token colors, and language selector dropdown
- **Enhanced tables** — Sortable columns, multi-column sort, filterable rows, inline formulas (SUM, AVERAGE, COUNT, MIN, MAX, IF, CONCAT), cell formatting (number, currency, percentage, date), column/row resize handles, sticky header rows, and copy/paste interop with Excel and Google Sheets
- **Security** — XSS-safe HTML sanitizer, dangerous tag removal, event handler blocking, CSS injection prevention
- **Tree-shakeable** — Import only the commands and utilities you need

## Packages

| Package | Version | Description |
| --- | --- | --- |
| [`@remyxjs/core`](./remyx-core/) | 0.28.0 | Framework-agnostic engine, commands, plugins, utilities, and CSS themes |
| [`@remyxjs/react`](./remyx-react/) | 0.28.0 | React components, hooks, TypeScript declarations (peer-depends on `@remyxjs/core`) |
| [`create-remyx`](./create-remyx/) | 0.28.0 | Reserved for future interactive CLI wizard ([see roadmap](./docs/ROADMAP.md)) |

## Getting Started

### New Project (Recommended)

The fastest way to start is with `create-remyx-app` (shipped with `@remyxjs/react`), which scaffolds a complete project:

```bash
npx create-remyx-app my-editor
```

You'll be prompted to pick:
- **Language**: JavaScript (JSX) or TypeScript (TSX)
- **Theme**: Light, Dark, Ocean, Forest, Sunset, or Rose
- **PDF/DOCX import**: include or skip heavy document dependencies (~5 MB)

### Which package should I use?

| Use case | Install |
| --- | --- |
| New project (interactive setup) | `npx create-remyx-app` |
| React project | `npm install @remyxjs/core @remyxjs/react` |
| Vue / Svelte / Angular / Vanilla JS | `npm install @remyxjs/core` (build your own wrapper) |
| Server-side HTML processing | `npm install @remyxjs/core` |

## Quick Start (React)

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
<RemyxEditor
  value={content}
  onChange={setContent}
  theme="ocean"
/>
```

Built-in themes: `light`, `dark`, `ocean`, `forest`, `sunset`, `rose`.

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
import { WordCountPlugin, AutolinkPlugin, PlaceholderPlugin, SyntaxHighlightPlugin } from '@remyxjs/core';

<RemyxEditor
  value={content}
  onChange={setContent}
  plugins={[WordCountPlugin, AutolinkPlugin, PlaceholderPlugin('Write something...'), SyntaxHighlightPlugin()]}
/>
```

### Enable autosave

```jsx
// localStorage (default) — just pass true
<RemyxEditor value={content} onChange={setContent} autosave />

// Cloud storage (AWS S3, GCP, or any HTTP endpoint)
<RemyxEditor
  value={content}
  onChange={setContent}
  autosave={{
    provider: {
      endpoint: 'https://api.example.com/autosave',
      headers: { Authorization: `Bearer ${token}` },
    },
    key: 'doc-123',
    interval: 60000,
  }}
/>
```

See the full [@remyxjs/react README](./remyx-react/README.md) for all props, hooks, error handling, engine access, modals, forms, and more.

## Quick Start (Core Only)

```js
import {
  EditorEngine,
  registerFormattingCommands,
  registerHeadingCommands,
  registerListCommands,
  registerLinkCommands,
  registerBlockCommands,
} from '@remyxjs/core';
import '@remyxjs/core/style.css';

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

See the full [@remyxjs/core README](./remyx-core/README.md) for the complete engine API, all 40+ commands, plugin system, selection API, sanitizer, theming, toolbar config, utilities, and framework wrapper guide.

## Architecture

```
@remyxjs/core ←── @remyxjs/react
            ←── (future: @remyxjs/vue, @remyxjs/svelte, @remyxjs/angular, @remyxjs/vanilla)
```

`@remyxjs/core` contains the entire editor engine with zero framework dependencies. Framework packages like `@remyxjs/react` provide components and hooks that wrap the core engine.

### What's in each package

| | `@remyxjs/core` | `@remyxjs/react` |
| --- | --- | --- |
| Editor engine | Yes | Re-exports from core |
| Commands (40+) | Yes | Re-exports from core |
| Plugin system | Yes | Re-exports from core |
| Utilities | Yes | Re-exports from core |
| CSS themes | Yes | Additional component styles |
| Autosave engine | AutosaveManager + 5 storage providers | useAutosave hook, SaveStatus, RecoveryBanner |
| React components | — | RemyxEditor, Toolbar, StatusBar, Modals |
| React hooks | — | useRemyxEditor, useEditorEngine, useSelection, useAutosave |
| TypeScript types | — | Full `.d.ts` declarations |
| Scaffolding CLI | — | `npx create-remyx-app` |

## Monorepo Structure

```
packages/
  create-remyx/   → create-remyx        Reserved for future CLI wizard
  remyx-core/     → @remyxjs/core         90+ exports, 0 framework deps
  remyx-react/    → @remyxjs/react        React components + hooks + TS types + scaffolding CLI
  docs/           Documentation, changelogs, roadmap, benchmarks
```

## Bundle Size

| Package | JS (gzipped) | CSS (gzipped) |
| --- | --- | --- |
| `@remyxjs/core` | ~21 KB | ~5 KB |
| `@remyxjs/react` | ~14 KB | ~2 KB |
| **Combined** | **~35 KB** | **~7 KB** |

Heavy dependencies (`mammoth` for DOCX, `pdfjs-dist` for PDF) are optional peer dependencies and use dynamic imports — they're only loaded when a file of that type is imported.

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build:all

# Build individual packages
npm run build:core
npm run build:react

# Run tests (1314 unit tests via Vitest)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

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
| [@remyxjs/react README](./remyx-react/README.md) | Full API — props, hooks, theming, plugins, toolbar, menu bar, error handling, engine access, forms |
| [@remyxjs/core README](./remyx-core/README.md) | Full API — engine, commands, plugins, selection, history, sanitizer, theming, toolbar config, utilities |
| [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Setup, architecture, adding commands/plugins, PR process |
| [CHANGELOG.md](./docs/CHANGELOG.md) | Version history and release notes |
| [ROADMAP.md](./docs/ROADMAP.md) | Planned features, framework wrappers, CMS integrations, create-remyx CLI wizard |
| [NX.md](./docs/NX.md) | Nx monorepo management — build, version, publish, caching, affected commands |
| [BENCHMARK.md](./docs/BENCHMARK.md) | Build, bundle, test, and lint performance metrics |
| [PLANNED_PACKAGES.md](./docs/PLANNED_PACKAGES.md) | Multi-package restructure plan and progress |
| [TASKS.md](./docs/TASKS.md) | All bugs, security fixes, cleanup items, and optimizations (numbered reference) |

## License

Remyx Editor is [MIT licensed](./LICENSE).
