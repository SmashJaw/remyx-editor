![Remyx Editor](./images/Remyx-Logo.svg)

# Remyx Editor Roadmap

**Current Version:** 0.28.0 (unreleased)
**Status:** Multi-package architecture complete (`@remyxjs/core` + `@remyxjs/react`), unified 6-theme system, autosave with pluggable storage, command palette, CLI scaffolding with theme picker, code block syntax highlighting with 11 languages

A living document outlining planned features, improvements, and long-term direction for the Remyx rich-text editor. Sections are ordered by priority — security and stability first, then features ranked by user impact.

---

# Shipped

## ~~Multi-Package Architecture~~ ✅ Shipped (v0.23.4)

- ~~Extract framework-agnostic core into `@remyxjs/core`~~ — 62 files, 94 exports, zero framework deps
- ~~Create `@remyxjs/react` with peer dependency on core~~ — 36 modules, full TypeScript declarations
- ~~Standalone `remyx-editor` package~~ — removed; consumers use `@remyxjs/react` directly
- ~~npm workspaces monorepo setup~~
- See [PLANNED_PACKAGES.md](./PLANNED_PACKAGES.md) for the full restructure plan

## ~~Autosave~~ ✅ Shipped (v0.26.0)

- ~~Periodic autosave to `localStorage` / `sessionStorage` with configurable interval~~
- ~~Crash-recovery banner: "Unsaved content was recovered — restore it?"~~
- ~~Server-side autosave~~ — implemented as pluggable storage providers (LocalStorage, SessionStorage, FileSystem, Cloud HTTP, Custom)
- ~~Debounced save on every content change with deduplication~~
- ~~Visual save-status indicator (Saved / Saving... / Unsaved)~~
- Cloud storage: AWS S3 presigned URLs, GCP signed URLs, any HTTP endpoint
- Filesystem provider for Node/Electron/Tauri apps
- `AutosaveManager` class + 5 storage providers in `@remyxjs/core`
- `useAutosave` hook, `SaveStatus`, `RecoveryBanner` in `@remyxjs/react`
- `autosave` prop on `RemyxEditor` (boolean or config object)

## ~~Unified Theme System~~ ✅ Shipped (v0.27.0)

- ~~6 built-in themes via single `theme` prop: `light`, `dark`, `ocean`, `forest`, `sunset`, `rose`~~
- ~~Each theme is a self-contained CSS class (`.rmx-theme-{name}`) with full variable overrides, content styles, code editor colors, and syntax token palettes~~
- ~~`customTheme` prop for per-instance CSS variable overrides on top of any theme~~
- ~~`createTheme()` helper for camelCase-to-CSS-variable conversion~~
- ~~TypeScript declarations updated across all type locations~~
- Custom theme authoring guide / theme builder tool

## ~~Code Block Syntax Highlighting~~ ✅ Shipped (v0.28.0)

- ~~Language-specific syntax highlighting inside fenced code blocks~~ — implemented with custom lightweight tokenizers (zero external dependencies, no Prism/Shiki/Highlight.js)
- ~~Language selector dropdown on code blocks~~ — pick from 11 languages (JavaScript, TypeScript, Python, CSS, SQL, JSON, Bash, Rust, Go, Java, HTML)
- ~~Auto-detect language from content when no language is specified~~ — heuristic-based detection via `detectLanguage()`
- ~~Theme-aware highlighting~~ — `.rmx-syn-*` token colors in all 6 themes (light, dark, ocean, forest, sunset, rose)
- ~~Markdown round-trip: preserve language identifiers (` ```js `, ` ```python `) in markdown output~~
- ~~MutationObserver-based auto-highlighting with debouncing, skips actively-edited blocks~~
- ~~`setCodeLanguage` and `getCodeLanguage` commands~~
- ~~`SyntaxHighlightPlugin`, `SUPPORTED_LANGUAGES`, `LANGUAGE_MAP`, `detectLanguage`, `tokenize` exports~~
- Line numbers toggle per code block
- Copy-to-clipboard button on code blocks
- Extensible language registry — consumers can add custom language grammars via plugin or prop
- Inline code spans with optional mini-highlighting for single-line snippets

## ~~Multiple Editor Instances~~ ✅ Shipped

- ~~Full instance isolation: each editor gets its own engine, history, and event bus~~
- ~~No DOM ID collisions — all selectors scoped to the editor root~~
- ~~Shared configuration via a `<RemyxConfigProvider>` context wrapper~~
- Inter-editor communication bus for linked editors (e.g., source + preview)
- Memory-efficient shared singleton for icons, sanitizer schema, and toolbar config
- ~~Stress-tested with 10+ concurrent editors on a single page~~

## ~~Menu Bar~~ ✅ Shipped

- ~~Application-style menus (File, Edit, View, Insert, Format) with submenus~~
- ~~Custom menu bar configuration with nested items and separators~~
- ~~Auto-deduplication: items in menu bar removed from toolbar~~
- ~~Keyboard navigation, hover-to-switch, escape-to-close~~
- ~~Dark/light/custom theme support~~

## ~~Slash Commands &~~ Command Palette — ✅ Shipped (v0.25.0)

- ~~`/` trigger opens a searchable command palette inline at the caret~~ (removed — too easy to trigger accidentally)
- `Mod+Shift+P` opens a global command palette overlay with search input
- Toolbar button (`commandPalette`) opens the same palette
- 19 built-in commands across 5 categories: Text, Lists, Media, Layout, Advanced
- Fuzzy search across labels, descriptions, and keywords
- Keyboard navigation (Arrow keys, Enter to execute, Escape to close)
- `commandPalette` prop to enable/disable (default `true`)
- `SLASH_COMMAND_ITEMS` and `filterSlashItems()` exported from `@remyxjs/core` for custom integrations

### Future enhancements

- Recently-used commands pinned to the top of the palette
- Custom command items via prop or plugin API

---

# Planned — P0: Security & Stability

These items protect users from XSS, data loss, and crashes. They should be addressed before any new feature work.

## Security Hardening — ✅ Shipped (v0.24.0–v0.28.0)

- ~~Sanitizer: extend dangerous-protocol checking to `src`, `action`, `formaction`, and `data` attributes~~
- Sanitizer: domain allowlist for iframe `src` (YouTube, Vimeo, Dailymotion only)
- ~~Sanitizer: explicit `on*` event handler blocklist as defense-in-depth~~
- ~~Sanitizer: fully remove dangerous tags (`script`, `style`, `svg`, `math`, `form`, `object`, `embed`) instead of unwrapping~~
- ~~Sanitizer: restrict `<input>` to `type="checkbox"` only~~
- ~~Markdown parser: set `html: false` to block raw HTML injection~~
- ~~URL protocol validation on `insertLink`, `insertImage`, and `window.open` calls~~
- ~~Data URI validation: block `image/svg+xml` data URIs~~
- ~~Block external SVG URL insertion (`.svg` URLs can contain embedded scripts)~~
- ~~Percent-encoded protocol bypass hardening in modal URL validators~~
- ~~SourceModal re-sanitization before applying user-edited HTML~~
- ~~CloudProvider endpoint URL validation to prevent injection~~
- ~~Export PDF iframe `sandbox` attribute~~
- ~~URL validation via `URL` constructor instead of regex where possible~~
- ~~Iframe `sandbox` attribute on embedded media~~
- ~~File size limits on pasted/dropped images (configurable, 10 MB default)~~
- ~~Plugin sandboxing: restricted engine facade, prevent command overwriting~~
- CSP-compatible build: eliminate all `document.write`, `execCommand`, and inline style dependencies
- Subresource integrity (SRI) hashes for CDN-loaded assets (Google Fonts, external scripts)
- ~~Fix `dangerouslySetInnerHTML` fallback logic in ImportDocumentModal~~
- See [TASKS.md](./TASKS.md) for the full audit report (42 security items, 42 resolved, 0 open)

## Quality Improvements

- ~~Comprehensive unit test suite (Vitest) for engine, commands, sanitizer, and converters~~ — 52 test files, 1314 tests across both packages
- ~~End-to-end tests (Playwright)~~ — Removed; the repo does not serve a production web server. Will revisit when a hosted demo is available.
- ~~XSS-specific test coverage for all modal components (LinkModal, ImageModal, SourceModal, etc.)~~
- Visual regression tests for theme and layout stability
- ~~Accessibility: WAI-ARIA menu pattern, focus trapping, skip navigation, `baseHeadingLevel`~~
- RTL (right-to-left) language support with `dir="rtl"` auto-detection
- Internationalization (i18n): externalized strings, locale packs, pluralization
- Improved undo/redo with operation coalescing (batch rapid keystrokes into a single undo step)
- Better large-document performance: virtualized rendering for 10k+ paragraph documents
- Print stylesheet for clean printed output
- Cross-browser testing matrix: Chrome, Firefox, Safari, Edge (latest 2 versions)
- ~~XSS-hardened sanitizer with configurable allowlists and deny-by-default~~
- ~~Error boundaries: `EditorErrorBoundary` wraps the editor, `onError` callback for error reporting~~
- Automated performance benchmarks: track keystroke latency, paste speed, and render time per release

## Performance Optimizations

- ~~Tree-shakeable ESM build — import only what you use~~
- ~~Code-split heavy features (PDF import, DOCX, document converters) behind dynamic `import()`~~
- ~~Memoized toolbar rendering — `React.memo` + `shallowEqual` bail-out on selection state~~
- ~~Terser minification with `drop_console` and `drop_debugger`~~
- ~~Lazy-loaded modals — all 9 modals deferred via `React.lazy` (~20–30 KB)~~
- ~~PDF/DOCX opt-in — `mammoth` and `pdfjs-dist` as optional peer deps~~
- Reduce initial bundle size to < 50 KB gzipped for the core editor
- Batch DOM mutations with `requestAnimationFrame` for smoother typing
- Web Worker offloading for expensive operations (sanitization, markdown parsing, document conversion)
- Lighthouse performance score target: 95+
- Idle-time processing: defer non-critical work (word count, readability scores) to `requestIdleCallback`
- Virtualized rendering for long documents: only mount visible blocks in the DOM
- Lazy plugin loading: plugins initialize on first use, not on editor mount
- Compressed undo history: store diffs instead of full snapshots to reduce memory usage
- Input batching: coalesce rapid keystrokes into single DOM updates to eliminate layout thrash
- See [TASKS.md](./TASKS.md) for the full optimization inventory (59 items, 59 resolved, 0 open)

## Build & DevOps

- ~~Nx monorepo integration — task orchestration, caching, affected commands~~
- ~~GitHub Actions CI pipeline: build → lint → test on every push/PR~~
- Automated npm publishing via `nx release` on tagged commits
- ~~Pre-commit hooks (Husky + lint-staged) for consistent code quality~~
- Bundle size tracking: fail CI if any package exceeds its size budget
- Automated dependency updates (Renovate or Dependabot) with auto-merge for passing patch bumps

---

# Planned — P1: High-Value Core Features

Features with the highest user demand and broadest impact on the editing experience.

## Real-Time Collaborative Editing

- CRDT-based conflict-free real-time co-editing (Yjs or Automerge)
- Awareness protocol: live cursors with user names and colors
- Presence indicators showing who is currently viewing/editing
- Offline-first: queue changes locally, sync when reconnected
- Operation history with per-user attribution
- Configurable transport: WebSocket, WebRTC, or custom
- `collaborationProvider` prop — bring your own signaling server or use a hosted option

## Block-Based Editing

- Draggable block handles on hover — reorder paragraphs, images, tables, and embeds via drag-and-drop
- Block-level toolbar: appears on hover/focus with block type, drag handle, and actions menu
- Block type conversion: turn a paragraph into a heading, quote, callout, or list without retyping
- Nested blocks: toggle lists, collapsible sections, tabbed content
- Block grouping: select multiple blocks and move, duplicate, or delete as a unit
- Block templates: save and reuse custom block compositions (e.g., a "feature card" with image + heading + text)

## ~~Enhanced Tables & Spreadsheet Features~~ ✅ Shipped (v0.28.0)

- ~~Inline cell formulas (`=SUM(A1:A5)`, `=AVERAGE(B2:B8)`) with a lightweight expression engine~~ — zero-dependency recursive-descent parser with 7 built-in functions (SUM, AVERAGE, COUNT, MIN, MAX, IF, CONCAT), A1-notation cell references, range expansion, arithmetic operators, comparison operators, and circular reference detection
- ~~Column and row resize handles with drag support~~ — invisible 6px drag handles at column/row borders, rAF-driven smooth updates, min-width enforcement, history snapshot on mouseup
- ~~Cell merging and splitting~~
- ~~Sortable columns (click header to sort ascending/descending)~~ — `sortTable` command with physical DOM reorder
- ~~Multi-column sort: hold Shift + click to add secondary/tertiary sort keys~~ — chained comparator with `data-sort-priority` attributes
- ~~Sort data types: alphabetical, numeric, date, and custom comparator via `tableSortComparator` prop~~ — auto-detection from column values, locale-aware string comparison
- ~~Sort indicator icons in header cells showing current sort direction~~ — CSS `::after` pseudo-elements (▲/▼) on `data-sort-dir` attribute
- ~~Persistent sort state: sorting reorders the underlying content so it survives serialization and export~~
- ~~Filterable rows with a compact filter UI per column~~ — non-destructive (hidden via `rmx-row-hidden` class), per-column filter dropdowns with debounced input, AND logic across columns
- ~~Cell formatting: number, currency, percentage, date~~ — `formatCell` command using `Intl.NumberFormat` / `Intl.DateTimeFormat`, raw value preserved in `data-raw-value`
- ~~Copy/paste between Remyx tables and external spreadsheets (Excel, Google Sheets)~~ — table-aware copy (HTML + TSV), paste detection (TSV and HTML tables), auto-expand grid, Google Sheets / Excel cleanup in paste pipeline
- ~~Freeze header row on scroll for large tables~~ — `position: sticky` on `<thead><th>`, `toggleHeaderRow` command, `insertTable` now generates `<thead>` by default
- New `TablePlugin` built-in plugin with MutationObserver-based table detection, delegated sort click handlers, formula focus/blur handlers, resize handle injection, and filter UI management
- New exports: `TablePlugin`, `evaluateTableFormulas` from `@remyxjs/core`
- 6 new commands: `toggleHeaderRow`, `sortTable`, `filterTable`, `clearTableFilters`, `formatCell`, `evaluateFormulas`

## Mobile & Touch Optimization

- Touch-optimized floating toolbar that follows selection without obscuring content
- Swipe gestures: swipe to indent/outdent, swipe to dismiss toolbar
- Long-press context menu with haptic feedback integration
- Pinch-to-zoom on images and tables
- Mobile-first responsive toolbar: collapses into overflow menu at narrow widths
- iOS/Android keyboard-aware layout: editor scrolls to keep caret visible above the virtual keyboard
- Touch-friendly drag handles with larger hit targets

## Comments & Annotations

- Inline comment threads: highlight text and attach discussion threads
- Resolved/unresolved state with visual indicators
- `onComment`, `onResolve`, `onDelete` callbacks for persistence
- Comment sidebar panel showing all threads with jump-to-location
- @mention support in comment bodies with configurable user list
- Comment-only mode: users can annotate but not edit content

## Expanded Plugin Architecture

- Formal `createPlugin()` lifecycle hooks: `onInit`, `onDestroy`, `onContentChange`, `onSelectionChange`
- Plugin dependency resolution and load ordering
- Scoped plugin settings with a per-plugin configuration schema
- Plugin marketplace/registry concept — discover and install community plugins
- First-party plugin packs: code editing, diagramming, math (LaTeX/KaTeX), footnotes
- Plugin sandboxing to prevent one plugin from breaking the editor or other plugins

---

# Planned — P2: Content & Editing Features

Features that enrich the editing experience for specific use cases and content types.

## Callouts, Alerts & Admonitions

- Styled callout blocks: info, warning, error, success, tip, note, question
- Custom callout types with user-defined icons and colors
- Collapsible callouts with expand/collapse toggle
- Nested content inside callouts (lists, code blocks, images)
- GitHub-flavored alert syntax support (`> [!NOTE]`, `> [!WARNING]`)

## Mentions & Tagging

- `@mention` support with configurable data source (async search)
- `#tag` support for inline categorization
- Mention chips rendered inline with avatar, name, and link
- Typeahead dropdown with fuzzy matching and keyboard navigation
- Custom mention types: users, documents, issues, PRs, etc.
- `onMention` callback for notifications and analytics

## Template System & Merge Tags

- `{{merge_tag}}` syntax with visual tag chips rendered inline
- Template designer mode: drag-and-drop merge tags from a sidebar palette
- Conditional blocks: `{{#if has_coupon}}...{{/if}}`
- Repeatable sections: `{{#each items}}...{{/each}}`
- Live preview with sample data injection
- Export templates as reusable JSON objects
- Pre-built template library: email, invoice, letter, report, newsletter

## Math & Equation Editor

- LaTeX / KaTeX inline and block math rendering
- Visual equation builder for users unfamiliar with LaTeX syntax
- Live preview as you type
- Equation numbering and cross-referencing
- Common symbol palette with categorized groups (Greek, operators, arrows, etc.)
- Copy equation as LaTeX, MathML, or image

## Table of Contents & Document Outline

- Auto-generated table of contents from heading hierarchy
- Sticky outline sidebar or floating panel
- Click-to-scroll navigation
- Collapsible sections based on heading levels
- Numbering options: 1.1, 1.2, etc.
- `onOutlineChange` callback for syncing with external navigation

## Version History & Diffing

- Named snapshots: save the current document state with a label
- Visual diff view: side-by-side or inline diff between any two snapshots
- Restore to any previous snapshot with one click
- `onSnapshot` callback for server-side persistence
- Auto-snapshot on major operations (paste, bulk delete, import)
- Change attribution: track which user made which changes (pairs with collaboration)

## Advanced Link Management

- Link previews: hover to see title, description, and thumbnail (Open Graph / unfurl)
- Broken link detection: periodic scan with visual indicators for dead links
- Auto-link: detect and convert raw URLs, emails, and phone numbers as the user types
- Link analytics: `onLinkClick` callback with click tracking metadata
- Internal link suggestions: search and link to other documents in the same system
- Bookmark anchors: insert named anchors and link to them within the document

## Image & Video Optimization

- Client-side image compression before upload (configurable quality/max dimensions)
- Automatic WebP/AVIF conversion for supported browsers
- Lazy-loading for images below the fold (`loading="lazy"`)
- Responsive `srcset` generation from a single upload
- Video thumbnail extraction and poster frame selection
- Embedded video player with playback controls (not just raw `<video>`)
- Image editing toolbar: crop, rotate, brightness, contrast, filters
- Drag-to-resize with aspect ratio lock

## Keyboard-First Editing

- Vim-style keybinding mode (optional) — normal, insert, visual modes
- Emacs keybinding preset
- Customizable keybinding map via `keyBindings` prop
- Multi-cursor editing: `Cmd+D` to select next occurrence, `Alt+Click` to add cursors
- Smart bracket/quote auto-pairing with wrap-selection support
- Jump-to-heading with `Cmd+Shift+P` quick navigation

## Content Analytics & Readability

- Real-time readability scores: Flesch-Kincaid, Gunning Fog, Coleman-Liau
- Reading time estimate (configurable words-per-minute)
- Sentence and paragraph length warnings (highlight overly complex sentences)
- Vocabulary level indicator (basic, intermediate, advanced)
- Content structure analysis: heading hierarchy validation, orphaned sections
- Goal-based writing: set a target word count with progress indicator
- SEO hints: keyword density, meta description length, heading structure

## Drag-and-Drop Content

- Drop zone overlays: visual guides when dragging files, images, or blocks over the editor
- Drag between editors: move content between multiple Remyx instances on the same page
- External drag support: drop images, files, and rich text from the desktop or other apps
- Drag-to-reorder for list items, table rows, and block elements
- Ghost preview during drag showing exactly where content will land

---

# Planned — P3: Platform Expansion

Framework wrappers, CMS integrations, and CLI tooling to expand Remyx's reach.

## Framework Support

| Framework | Status | Package |
| --- | --- | --- |
| **React** | ✅ Available | `@remyxjs/react` |
| **Core (framework-agnostic)** | ✅ Available | `@remyxjs/core` |
| **Vanilla JS / Web Component** | Planned (P0 — CMS packages depend on this) | `@remyxjs/vanilla` |
| **Vue 3** | Planned | `@remyxjs/vue` |
| **Svelte 5** | Planned | `@remyxjs/svelte` |
| **Angular** | Planned | `@remyxjs/angular` |
| **Node.js (SSR)** | Planned | `@remyxjs/ssr` |
| **WordPress** | Planned | `remyx-wp` — Gutenberg block + Classic Editor replacement |
| **Drupal** | Planned | `remyx_drupal` — CKEditor replacement module for Drupal 10/11 |
| **Moodle** | Planned | `atto_remyx` — Atto editor plugin for Moodle 4.x |
| **Joomla** | Planned | `plg_editors_remyx` — editor plugin for Joomla 5 |
| **Craft CMS** | Planned | `craft-remyx` — Redactor field replacement plugin |
| **Strapi** | Planned | `@remyxjs/strapi` — custom field plugin for Strapi 5 |
| **Ghost** | Planned | `ghost-remyx` — Koenig editor replacement |
| **Shopify** | Planned | `@remyxjs/shopify` — Liquid-compatible rich text for theme/app extensions |

- Shared core engine across all framework wrappers
- Framework-specific bindings for reactivity, lifecycle, and two-way data binding
- Web Component wrapper (`<remyx-editor>`) for framework-agnostic embedding
- CMS integrations use `@remyxjs/vanilla` (Web Component) for framework-agnostic drop-in

## create-remyx CLI

Interactive CLI tools for scaffolding Remyx Editor projects.

### `create-remyx-app` — ✅ Shipped (v0.25.0, enhanced v0.27.0)

Quick project scaffolding via `npx create-remyx-app`:

- ~~Project name prompt~~
- ~~Language: JavaScript (JSX) or TypeScript (TSX)~~
- ~~Theme selection: Light, Dark, Ocean, Forest, Sunset, Rose~~ (v0.27.0)
- ~~Optional PDF/DOCX import (mammoth + pdfjs-dist)~~
- ~~Vite-based project with `@remyxjs/core` + `@remyxjs/react`~~
- ~~Post-scaffold instructions: install, dev, build~~

### `create-remyx` — Planned (advanced wizard)

Full-featured interactive wizard via `npx create-remyx`:

- Pick a framework: React, Vue, Svelte, Angular, or Vanilla JS
- Choose features: toolbar layout, menu bar, status bar, floating toolbar, context menu
- Select plugins: word count, autolink, placeholder, code highlighting, math, comments
- Configure theme with live preview of theme variables
- Pick document formats: HTML output, Markdown output, or both
- Optional add-ons: image upload handler scaffold, collaboration stub
- Output a `remyx.config.js` (or `.ts`) with the full `defineConfig()` setup
- Template variants: minimal (bare editor), standard (toolbar + status bar), full-featured (all UI chrome)
- Plugin authoring mode: `npx create-remyx --plugin` scaffolds a plugin package with `createPlugin()` boilerplate, test setup, and build config

## Nx Monorepo Integration

- Migrate from npm workspaces to [Nx](https://nx.dev/) for monorepo orchestration
- **Task pipeline**: define `build`, `test`, and `lint` target dependencies so `@remyxjs/react` automatically builds `@remyxjs/core` first
- **Computation caching**: Nx caches build and test outputs locally — rebuilds only what changed
- **Remote caching**: enable Nx Cloud for shared CI/local cache across the team (optional, free tier available)
- **Affected commands**: `nx affected:build` and `nx affected:test` run only against packages touched by a PR, dramatically speeding up CI
- **Project graph**: `nx graph` visualizes package dependencies (`core` → `react` → `editor`) for onboarding and debugging
- **Generators**: scaffold new framework wrappers (`@remyxjs/vue`, `@remyxjs/svelte`, `@remyxjs/angular`) with consistent structure via Nx generators
- **Release management**: `nx release` for coordinated versioning, changelog generation, and npm publishing across all packages
- **Enforce module boundaries**: lint rules preventing `@remyxjs/core` from importing `react` or `@remyxjs/react` from importing framework-specific code it shouldn't
- **Parallel execution**: Nx runs independent targets in parallel with configurable concurrency, utilizing all CPU cores
- **Migration path**: incremental adoption — add `nx.json` and per-package `project.json` files without changing existing `package.json` scripts or Vite configs

## External Configuration

- Load toolbar layout, theme, fonts, and plugin list from a JSON/YAML config file
- `RemyxEditor.fromConfig(url)` static method for fully declarative setup
- Environment-based config merging (development vs. production defaults)
- Admin panel concept: a standalone UI for building editor configurations visually
- Runtime config reloading without unmounting the editor

---

# Planned — P4: Advanced & Niche

Features for specialized use cases and long-term differentiation.

## AI Integration

- `aiProvider` prop accepting an adapter interface for any LLM backend (OpenAI, Anthropic, local models)
- Inline AI actions: rewrite selection, summarize, expand, translate, adjust tone
- AI-powered autocomplete with ghost-text suggestions (Tab to accept)
- Context-aware AI — sends surrounding content for better suggestions
- Slash-command menu (`/ai summarize`, `/ai translate to Spanish`, etc.)
- Privacy-first: no data sent anywhere unless the consumer explicitly configures a provider

## Spelling & Grammar Checking

- Built-in spellcheck layer using the browser's native `Intl` / spellcheck API
- Optional integration with LanguageTool, Grammarly SDK, or a custom grammar service
- Inline red/blue underlines with right-click correction suggestions
- "Ignore" and "Add to dictionary" per-session or persistent
- Language detection and multi-language support
- Grammar rule categories: punctuation, passive voice, wordiness, clichés
- Writing-style presets (formal, casual, technical, academic)

## Diagram & Drawing Support

- Mermaid.js integration for flowcharts, sequence diagrams, Gantt charts, and ER diagrams
- Inline diagram editor with live preview
- Excalidraw-style freehand drawing canvas embedded as a block
- Export diagrams as SVG or PNG
- Diagram templates for common use cases

## Service Integrations

- **Cloud storage**: Google Drive, Dropbox, OneDrive — browse and insert files/images directly
- **Media**: Unsplash, Pexels, Giphy — search and insert royalty-free images/GIFs
- **Embeds**: YouTube, Vimeo, Twitter/X, CodePen, Figma — rich embed previews
- **Collaboration**: Slack, Microsoft Teams — share editor content or receive webhook notifications
- **CMS**: WordPress, Contentful, Strapi, Sanity — bidirectional content sync
- **Email**: Mailchimp, SendGrid — export editor HTML as email-ready templates
- Integration SDK with a standardized adapter pattern for adding custom services

## UX / UI Improvements

- **Smooth animations**: toolbar transitions, modal enter/exit, block reorder animations
- **Tooltip system**: consistent, accessible tooltips on all toolbar items with shortcut hints
- **Focus management**: clear focus rings, trap focus in modals, restore focus on close
- **Empty state**: configurable illustrated empty state when editor has no content
- **Distraction-free mode**: hide all chrome (toolbar, status bar) with a fade-in on mouse move
- **Breadcrumb bar**: show current block context (e.g., "Table > Row 2 > Cell 3" or "Blockquote > List > Item")
- **Minimap**: optional code-editor-style minimap for long documents
- **Split view**: side-by-side edit + preview pane for markdown or HTML source
- **Sticky toolbar**: toolbar stays visible when scrolling long documents
- **Inline formatting bubble**: compact floating toolbar on text selection (bold, italic, link, highlight, comment)
- **Drag-and-drop toolbar customization**: let users rearrange toolbar buttons at runtime
- **Color palette presets**: save and reuse custom color palettes across text and background colors
- **Typography controls**: line height, letter spacing, paragraph spacing adjustments

---

*This roadmap is subject to change. Contributions, feedback, and feature requests are welcome.*
