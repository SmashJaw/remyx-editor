![Remyx Editor](./docs/screenshots/Remyx-Logo.svg)

# Remyx Editor

A feature-rich WYSIWYG editor built on a framework-agnostic core with first-class React support. Configurable toolbar, menu bar, markdown support, theming, file uploads, and a plugin system.

## Features

- **Rich text editing** — Bold, italic, underline, strikethrough, subscript, superscript, headings (H1–H6), lists (ordered, unordered, task), blockquotes, code blocks, horizontal rules, tables, links, images, media embeds, attachments, and font styling
- **Markdown support** — Toggle between WYSIWYG and Markdown editing, paste Markdown and have it auto-converted, export as Markdown
- **Configurable toolbar** — 5 built-in presets (`full`, `standard`, `minimal`, `bare`, `rich`), add/remove items, group separators, per-item theming
- **Menu bar** — Hierarchical menus (File, Edit, Insert, Format, View) with keyboard navigation and WAI-ARIA patterns
- **Theming** — 6 built-in themes (`light`, `dark`, `ocean`, `forest`, `sunset`, `rose`) via a single `theme` prop, fully customizable with CSS custom properties
- **Plugin system** — `createPlugin()` with `init`/`destroy`/`onContentChange`/`onSelectionChange` lifecycle hooks, dependency resolution, scoped settings with schema validation, plugin registry for discovery, custom commands, toolbar/status-bar/context-menu items, sandboxed API with error isolation
- **File uploads** — Paste or drag-and-drop images, configurable upload handler, file size limits
- **Document import/export** — Import PDF, DOCX, Markdown, HTML, TXT, CSV, TSV, RTF; export to PDF, DOCX, Markdown
- **Find & replace** — Search with case sensitivity, navigate matches, replace one or all
- **Source mode** — Toggle raw HTML editing
- **Fullscreen mode** — Distraction-free editing
- **Command palette** — Searchable overlay with all editor commands (`Mod+Shift+P` or toolbar button), fuzzy search, keyboard navigation, recently-used commands pinned to the top, custom command registration via `registerCommandItems()`
- **Autosave** — Periodic + debounced saves with crash recovery banner, visual save-status indicator, pluggable storage (localStorage, sessionStorage, filesystem, AWS S3/GCP/cloud HTTP, or custom)
- **Keyboard shortcuts** — 17+ default shortcuts, customizable via API
- **Accessibility** — Skip navigation, focus trapping in modals, ARIA roles, keyboard-navigable toolbar
- **Code block syntax highlighting** — 11 languages (JS/TS, Python, CSS, SQL, JSON, Bash, Rust, Go, Java, HTML) with auto-detection, theme-aware token colors, language selector dropdown, line numbers toggle, copy-to-clipboard button, inline code highlighting, and extensible language registry
- **Enhanced tables** — Sortable columns, multi-column sort, filterable rows, inline formulas (SUM, AVERAGE, COUNT, MIN, MAX, IF, CONCAT), cell formatting (number, currency, percentage, date), column/row resize handles, sticky header rows, and copy/paste interop with Excel and Google Sheets
- **RTL support** — Automatic text direction detection (`detectTextDirection`), per-block `dir` attribute, CSS logical properties for lists and blockquotes
- **Internationalization (i18n)** — 120+ externalized strings, `t()` with interpolation, `registerLocale()` for custom translations, partial locale packs with English fallback
- **Print stylesheet** — Clean printed output with hidden chrome, page-break control, link URLs, orphan/widow handling
- **Template system** — `{{merge_tag}}` syntax with visual chips, `{{#if}}`/`{{#each}}` blocks, live preview with sample data, 5 pre-built templates (email, invoice, letter, report, newsletter), custom template registration, JSON export
- **Keyboard-first editing** — Vim mode (normal/insert/visual), Emacs keybinding preset, custom keybinding map, multi-cursor (`Cmd+D`), smart bracket/quote auto-pairing, jump-to-heading navigation
- **Drag-and-drop content** — Drop zone overlays, cross-editor drag, external file/image/rich-text drops, block reorder with ghost preview, visual drop indicator
- **Math & equations** — LaTeX/KaTeX inline ($...$) and block ($$...$$) math rendering, symbol palette (Greek, operators, arrows), equation numbering, MathML export, pluggable renderer
- **Table of contents** — Auto-generated TOC from heading hierarchy, click-to-scroll navigation, section numbering (1.1, 1.2), heading validation, `insertToc` command, `onOutlineChange` callback
- **Content analytics** — Flesch-Kincaid, Gunning Fog, Coleman-Liau readability scores, reading time estimate, vocabulary level (basic/intermediate/advanced), sentence/paragraph length warnings, goal-based word count, keyword density, SEO hints
- **Real-time collaboration** — CRDT-based co-editing with live cursors, presence indicators, offline-first sync, configurable transport (WebSocket, WebRTC, or custom), `CollaborationPlugin`, `useCollaboration` hook, `CollaborationBar` component
- **Advanced link management** — Link preview tooltips (via `onUnfurl`), broken link detection with periodic scanning and visual indicators, auto-linking of URLs/emails/phone numbers, link click analytics (`onLinkClick`), bookmark anchors with intra-document linking
- **Callouts & alerts** — 7 built-in callout types (info, warning, error, success, tip, note, question), custom types with user-defined icons/colors, collapsible toggle, nested content, GitHub-flavored alert syntax auto-conversion (`> [!NOTE]`, `> [!WARNING]`)
- **Comments & annotations** — Inline comment threads on selected text, resolved/unresolved state, @mention parsing, reply threads, comment-only mode, `CommentsPanel` sidebar component, `useComments` hook, import/export, and persistence callbacks (`onComment`, `onResolve`, `onDelete`, `onReply`)
- **Security** — XSS-safe HTML sanitizer, dangerous tag removal, event handler blocking, CSS injection prevention, iframe domain allowlist (YouTube/Vimeo/Dailymotion), CSP-compatible (zero `execCommand`/`document.write`), SRI hash support for CDN assets
- **Block-based editing** — Block-level toolbar with type conversion (paragraph, headings, quote, code, lists), drag-to-reorder, move up/down, duplicate, delete, collapsible `<details>` sections, block grouping, and block templates (`BlockTemplatePlugin`)
- **Mobile & touch** — Touch-aware floating toolbar, swipe indent/outdent, long-press context menu with haptic feedback, pinch-to-zoom on images/tables, responsive toolbar overflow, virtual keyboard-aware layout, 44px touch targets
- **Multi-editor support** — Full instance isolation, `EditorBus` singleton for inter-editor communication (pub/sub, broadcast, registry), `SharedResources` singleton for memory-efficient shared schemas, toolbar presets, icons, and config across 10+ concurrent editors
- **Performance** — DOM mutation batching, `requestIdleCallback` scheduling, rAF-throttled handlers, operation coalescing in undo/redo, `WorkerPool` for background thread offloading, `VirtualScroller` for long-document rendering, compressed diff-based undo history, lazy plugin loading, input batching, shared selectionchange listener (single global handler for 10+ editors), `getHTML()` caching with dirty flag, hash-based sanitizer LRU cache, reverse-iteration DOM cleaning, cached drag-drop block positions, built-in benchmarking tools
- **UX/UI improvements** — Smooth CSS animations (modal enter/exit, block reorder, toolbar hover), configurable empty state, distraction-free mode (`Mod+Shift+D`), breadcrumb bar showing DOM path, minimap for long documents, split view for side-by-side edit+preview, sticky toolbar, drag-and-drop toolbar customization, color palette presets (saved to localStorage), typography controls (line height, letter spacing, paragraph spacing)
- **External configuration** — Load toolbar, theme, fonts, and plugin config from a JSON/YAML URL via `loadConfig()`; `<RemyxEditorFromConfig url="..." />` for fully declarative setup; environment-based config merging (dev vs. prod defaults); runtime config reloading via `useExternalConfig()` hook with `pollInterval` and `reload()`
- **Tree-shakeable** — Import only the commands and utilities you need

## Packages

| Package | Version | Description |
| --- | --- | --- |
| [`@remyxjs/core`](./remyx-core/) | 1.0.0-beta | Framework-agnostic engine, commands, plugins, utilities, and CSS themes |
| [`@remyxjs/react`](./remyx-react/) | 1.0.0-beta | React components, hooks, TypeScript declarations (peer-depends on `@remyxjs/core`) |
| [`create-remyx`](./create-remyx/) | 1.0.0-beta | Reserved for future interactive CLI wizard ([see roadmap](./docs/ROADMAP.md)) |

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
import { WordCountPlugin, AutolinkPlugin, PlaceholderPlugin, SyntaxHighlightPlugin, TablePlugin, CommentsPlugin, CalloutPlugin, LinkPlugin, TemplatePlugin, KeyboardPlugin, DragDropPlugin, MathPlugin, TocPlugin, AnalyticsPlugin, SpellcheckPlugin, CollaborationPlugin } from '@remyxjs/core';

<RemyxEditor
  value={content}
  onChange={setContent}
  plugins={[
    WordCountPlugin,
    AutolinkPlugin,
    PlaceholderPlugin('Write something...'),
    SyntaxHighlightPlugin(),
    TablePlugin(),       // Sortable columns, filters, formulas, resize handles
    CommentsPlugin(),    // Inline comment threads, @mentions, resolve/reopen
    CalloutPlugin(),     // Info/warning/error/success/tip/note/question blocks
    LinkPlugin(),        // Link previews, broken link detection, auto-link, bookmarks
    TemplatePlugin(),    // Merge tags, conditionals, loops, template library
    KeyboardPlugin(),    // Auto-pairing, multi-cursor, jump-to-heading
    DragDropPlugin(),    // Drop zones, cross-editor drag, block reorder
    MathPlugin(),        // LaTeX math rendering, symbol palette, equation numbering
    TocPlugin(),         // Auto-generated table of contents, outline, headings
    AnalyticsPlugin(),   // Readability scores, reading time, SEO hints
    SpellcheckPlugin(),  // Grammar checking, writing-style presets, dictionary
    CollaborationPlugin(), // Real-time co-editing, live cursors, presence
  ]}
/>
```

### Enhanced tables

With the `TablePlugin` enabled, tables gain spreadsheet-like capabilities:

```jsx
import { TablePlugin } from '@remyxjs/core';

<RemyxEditor
  value={content}
  onChange={setContent}
  plugins={[TablePlugin()]}
/>
```

**What you get out of the box:**
- **Click a column header** to sort ascending/descending (Shift+click for multi-column sort)
- **Filter icon** on each header cell opens a dropdown for substring filtering
- **Drag column/row borders** to resize
- **Type `=SUM(A1:A5)`** in any cell — formulas evaluate on blur
- **Right-click a cell** to format as number, currency, percentage, or date
- **Copy/paste from Excel or Google Sheets** — the editor auto-detects TSV and expands the table grid

Programmatic access to all features:

```js
// Sort the first column descending with numeric comparison
engine.executeCommand('sortTable', { columnIndex: 0, direction: 'desc', dataType: 'numeric' });

// Filter column 2 to only show rows containing "active"
engine.executeCommand('filterTable', { columnIndex: 2, filterValue: 'active' });

// Format the focused cell as currency
engine.executeCommand('formatCell', { format: 'currency', options: { currency: 'EUR' } });

// Toggle the first row between <thead>/<tbody>
engine.executeCommand('toggleHeaderRow');
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

### External configuration

Load editor settings from a JSON or YAML file — no code changes needed when config updates:

```jsx
import { RemyxEditorFromConfig } from '@remyxjs/react';

// Fully declarative: load everything from a config URL
<RemyxEditorFromConfig
  url="/editor-config.json"
  env="production"
  value={content}
  onChange={setContent}
  loadingFallback={<div>Loading editor...</div>}
/>
```

Example `editor-config.json`:

```json
{
  "theme": "ocean",
  "toolbar": [["bold", "italic"], ["heading"], ["link", "image"]],
  "height": 500,
  "menuBar": true,
  "env": {
    "production": { "readOnly": false, "height": 600 },
    "development": { "readOnly": false, "height": 400 }
  }
}
```

Or use the hook directly for more control:

```jsx
import { useExternalConfig } from '@remyxjs/react';

function MyEditor() {
  const { config, loading, error, reload } = useExternalConfig('/editor-config.json', {
    env: process.env.NODE_ENV,
    pollInterval: 60000, // Auto-reload every minute
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <button onClick={reload}>Retry</button>;

  return <RemyxEditor {...config} value={content} onChange={setContent} />;
}
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

See the full [@remyxjs/core README](./remyx-core/README.md) for the complete engine API, all 75+ commands, plugin system, selection API, sanitizer, theming, toolbar config, utilities, and framework wrapper guide.

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
| Commands (75+) | Yes | Re-exports from core |
| Plugin system | Yes | Re-exports from core |
| Utilities | Yes | Re-exports from core |
| CSS themes | Yes | Additional component styles |
| Multi-editor | EditorBus + SharedResources singletons | Re-exports from core |
| Autosave engine | AutosaveManager + 5 storage providers | useAutosave hook, SaveStatus, RecoveryBanner |
| React components | — | RemyxEditor, RemyxEditorFromConfig, SaveStatus, RecoveryBanner, CommentsPanel, CollaborationBar, EditorErrorBoundary, EmptyState, BreadcrumbBar, Minimap, SplitPreview, TypographyDropdown |
| Collaboration | CollaborationPlugin, transport API | useCollaboration hook, CollaborationBar |
| React hooks | — | useRemyxEditor, useEditorEngine, useExternalConfig, useDragDrop, useAutosave, useComments, useSpellcheck, useCollaboration, useRemyxConfig |
| TypeScript types | — | Full `.d.ts` declarations |
| Scaffolding CLI | — | `npx create-remyx-app` |

## Monorepo Structure

```
packages/
  create-remyx/   → create-remyx        Reserved for future CLI wizard
  remyx-core/     → @remyxjs/core         190+ exports, 0 framework deps
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

# Run tests
npm test       # 1768 unit tests via Vitest (72 suites)

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
| [BENCHMARK.md](./docs/BENCHMARK.md) | Build, bundle, test, and lint performance metrics |

## License

Remyx Editor is [MIT licensed](./LICENSE).
