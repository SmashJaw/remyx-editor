![Remyx Editor](./images/Remyx-Logo.svg)

# Remyx Editor Roadmap

**Current Version:** 0.27.0
**Status:** Multi-package architecture complete (`@remyx/core` + `@remyx/react`), unified 6-theme system, autosave with pluggable storage, command palette, CLI scaffolding with theme picker

A living document outlining planned features, improvements, and long-term direction for the Remyx rich-text editor.

---

## ~~Multi-Package Architecture~~ ✅ Shipped (v0.23.4)

- ~~Extract framework-agnostic core into `@remyx/core`~~ — 49 files, 80 exports, zero framework deps
- ~~Create `@remyx/react` with peer dependency on core~~ — 36 modules, full TypeScript declarations
- ~~Standalone `remyx-editor` package~~ — removed; consumers use `@remyx/react` directly
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
- `AutosaveManager` class + 5 storage providers in `@remyx/core`
- `useAutosave` hook, `SaveStatus`, `RecoveryBanner` in `@remyx/react`
- `autosave` prop on `RemyxEditor` (boolean or config object)

## ~~Unified Theme System~~ ✅ Shipped (v0.27.0)

- ~~6 built-in themes via single `theme` prop: `light`, `dark`, `ocean`, `forest`, `sunset`, `rose`~~
- ~~Each theme is a self-contained CSS class (`.rmx-theme-{name}`) with full variable overrides, content styles, code editor colors, and syntax token palettes~~
- ~~`customTheme` prop for per-instance CSS variable overrides on top of any theme~~
- ~~`createTheme()` helper for camelCase-to-CSS-variable conversion~~
- ~~TypeScript declarations updated across all type locations~~
- Custom theme authoring guide / theme builder tool

## Enhanced Tables & Spreadsheet Features

- Inline cell formulas (`=SUM(A1:A5)`, `=AVERAGE(B2:B8)`) with a lightweight expression engine
- Column and row resize handles with drag support
- Cell merging and splitting
- Sortable columns (click header to sort ascending/descending)
- Filterable rows with a compact filter UI per column
- Cell formatting: number, currency, percentage, date
- Copy/paste between Remyx tables and external spreadsheets (Excel, Google Sheets)
- Freeze header row on scroll for large tables

## Code Block Syntax Highlighting

- Language-specific syntax highlighting inside fenced code blocks using a lightweight library (Prism, Shiki, or Highlight.js)
- Language selector dropdown on code blocks — pick from common languages (JavaScript, Python, TypeScript, HTML, CSS, SQL, Bash, JSON, etc.)
- Auto-detect language from content when no language is specified
- Theme-aware highlighting — colors adapt to light/dark editor themes and custom theme presets
- Line numbers toggle per code block
- Copy-to-clipboard button on code blocks
- Markdown round-trip: preserve language identifiers (` ```js `, ` ```python `) in markdown output
- Lazy-loaded highlighting engine — syntax library only loaded when a code block is present
- Extensible language registry — consumers can add custom language grammars via plugin or prop
- Inline code spans with optional mini-highlighting for single-line snippets

## Expanded Plugin Architecture

- Formal `createPlugin()` lifecycle hooks: `onInit`, `onDestroy`, `onContentChange`, `onSelectionChange`
- Plugin dependency resolution and load ordering
- Scoped plugin settings with a per-plugin configuration schema
- Plugin marketplace/registry concept — discover and install community plugins
- First-party plugin packs: code editing, diagramming, math (LaTeX/KaTeX), footnotes
- Plugin sandboxing to prevent one plugin from breaking the editor or other plugins

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

## Template System & Merge Tags

- `{{merge_tag}}` syntax with visual tag chips rendered inline
- Template designer mode: drag-and-drop merge tags from a sidebar palette
- Conditional blocks: `{{#if has_coupon}}...{{/if}}`
- Repeatable sections: `{{#each items}}...{{/each}}`
- Live preview with sample data injection
- Export templates as reusable JSON objects
- Pre-built template library: email, invoice, letter, report, newsletter

## Image & Video Optimization

- Client-side image compression before upload (configurable quality/max dimensions)
- Automatic WebP/AVIF conversion for supported browsers
- Lazy-loading for images below the fold (`loading="lazy"`)
- Responsive `srcset` generation from a single upload
- Video thumbnail extraction and poster frame selection
- Embedded video player with playback controls (not just raw `<video>`)
- Image editing toolbar: crop, rotate, brightness, contrast, filters
- Drag-to-resize with aspect ratio lock

## Service Integrations

- **Cloud storage**: Google Drive, Dropbox, OneDrive — browse and insert files/images directly
- **Media**: Unsplash, Pexels, Giphy — search and insert royalty-free images/GIFs
- **Embeds**: YouTube, Vimeo, Twitter/X, CodePen, Figma — rich embed previews
- **Collaboration**: Slack, Microsoft Teams — share editor content or receive webhook notifications
- **CMS**: WordPress, Contentful, Strapi, Sanity — bidirectional content sync
- **Email**: Mailchimp, SendGrid — export editor HTML as email-ready templates
- Integration SDK with a standardized adapter pattern for adding custom services

## Real-Time Collaborative Editing

- CRDT-based conflict-free real-time co-editing (Yjs or Automerge)
- Awareness protocol: live cursors with user names and colors
- Presence indicators showing who is currently viewing/editing
- Offline-first: queue changes locally, sync when reconnected
- Operation history with per-user attribution
- Configurable transport: WebSocket, WebRTC, or custom
- `collaborationProvider` prop — bring your own signaling server or use a hosted option

## Nx Monorepo Integration

- Migrate from npm workspaces to [Nx](https://nx.dev/) for monorepo orchestration
- **Task pipeline**: define `build`, `test`, and `lint` target dependencies so `@remyx/react` automatically builds `@remyx/core` first
- **Computation caching**: Nx caches build and test outputs locally — rebuilds only what changed
- **Remote caching**: enable Nx Cloud for shared CI/local cache across the team (optional, free tier available)
- **Affected commands**: `nx affected:build` and `nx affected:test` run only against packages touched by a PR, dramatically speeding up CI
- **Project graph**: `nx graph` visualizes package dependencies (`core` → `react` → `editor`) for onboarding and debugging
- **Generators**: scaffold new framework wrappers (`@remyx/vue`, `@remyx/svelte`, `@remyx/angular`) with consistent structure via Nx generators
- **Release management**: `nx release` for coordinated versioning, changelog generation, and npm publishing across all packages
- **Enforce module boundaries**: lint rules preventing `@remyx/core` from importing `react` or `@remyx/react` from importing framework-specific code it shouldn't
- **Parallel execution**: Nx runs independent targets in parallel with configurable concurrency, utilizing all CPU cores
- **Migration path**: incremental adoption — add `nx.json` and per-package `project.json` files without changing existing `package.json` scripts or Vite configs

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

## ~~Security Hardening~~ ✅ Mostly Shipped (v0.24.0)

- ~~Sanitizer: extend dangerous-protocol checking to `src`, `action`, `formaction`, and `data` attributes~~
- Sanitizer: domain allowlist for iframe `src` (YouTube, Vimeo, Dailymotion only)
- ~~Sanitizer: explicit `on*` event handler blocklist as defense-in-depth~~
- ~~Sanitizer: fully remove dangerous tags (`script`, `style`, `svg`, `math`, `form`, `object`, `embed`) instead of unwrapping~~
- ~~Sanitizer: restrict `<input>` to `type="checkbox"` only~~
- ~~Markdown parser: set `html: false` to block raw HTML injection~~
- ~~URL protocol validation on `insertLink`, `insertImage`, and `window.open` calls~~
- ~~Data URI validation: block `image/svg+xml` data URIs~~
- ~~Iframe `sandbox` attribute on embedded media~~
- ~~File size limits on pasted/dropped images (configurable, 10 MB default)~~
- ~~Plugin sandboxing: restricted engine facade, prevent command overwriting~~
- CSP-compatible build: eliminate all `document.write`, `execCommand`, and inline style dependencies
- Subresource integrity (SRI) hashes for CDN-loaded assets (Google Fonts, external scripts)
- ~~Fix `dangerouslySetInnerHTML` fallback logic in ImportDocumentModal~~
- See [TASKS.md](./TASKS.md) for the full audit report and remaining items

## create-remyx CLI

Interactive CLI tools for scaffolding Remyx Editor projects.

### `create-remyx-app` — ✅ Shipped (v0.25.0, enhanced v0.27.0)

Quick project scaffolding via `npx create-remyx-app`:

- ~~Project name prompt~~
- ~~Language: JavaScript (JSX) or TypeScript (TSX)~~
- ~~Theme selection: Light, Dark, Ocean, Forest, Sunset, Rose~~ (v0.27.0)
- ~~Optional PDF/DOCX import (mammoth + pdfjs-dist)~~
- ~~Vite-based project with `@remyx/core` + `@remyx/react`~~
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

## External Configuration

- Load toolbar layout, theme, fonts, and plugin list from a JSON/YAML config file
- `RemyxEditor.fromConfig(url)` static method for fully declarative setup
- Environment-based config merging (development vs. production defaults)
- Admin panel concept: a standalone UI for building editor configurations visually
- Runtime config reloading without unmounting the editor

## Framework Support

| Framework | Status | Package |
| --- | --- | --- |
| **React** | ✅ Available | `@remyx/react` |
| **Core (framework-agnostic)** | ✅ Available | `@remyx/core` |
| **Vue 3** | Planned | `@remyx/vue` |
| **Angular** | Planned | `@remyx/angular` |
| **Svelte 5** | Planned | `@remyx/svelte` |
| **Vanilla JS / Web Component** | Planned | `@remyx/vanilla` |
| **Node.js (SSR)** | Planned | `@remyx/ssr` |
| **WordPress** | Planned | `remyx-wp` — Gutenberg block + Classic Editor replacement |
| **Drupal** | Planned | `remyx_drupal` — CKEditor replacement module for Drupal 10/11 |
| **Moodle** | Planned | `atto_remyx` — Atto editor plugin for Moodle 4.x |
| **Joomla** | Planned | `plg_editors_remyx` — editor plugin for Joomla 5 |
| **Craft CMS** | Planned | `craft-remyx` — Redactor field replacement plugin |
| **Strapi** | Planned | `@remyx/strapi` — custom field plugin for Strapi 5 |
| **Ghost** | Planned | `ghost-remyx` — Koenig editor replacement |
| **Shopify** | Planned | `@remyx/shopify` — Liquid-compatible rich text for theme/app extensions |

- Shared core engine across all framework wrappers
- Framework-specific bindings for reactivity, lifecycle, and two-way data binding
- Web Component wrapper (`<remyx-editor>`) for framework-agnostic embedding
- CMS integrations use `@remyx/vanilla` (Web Component) for framework-agnostic drop-in

## ~~Slash Commands &~~ Command Palette — **Shipped in v0.25.0**

- ~~`/` trigger opens a searchable command palette inline at the caret~~ (removed — too easy to trigger accidentally)
- `Mod+Shift+P` opens a global command palette overlay with search input
- Toolbar button (`commandPalette`) opens the same palette
- 19 built-in commands across 5 categories: Text, Lists, Media, Layout, Advanced
- Fuzzy search across labels, descriptions, and keywords
- Keyboard navigation (Arrow keys, Enter to execute, Escape to close)
- `commandPalette` prop to enable/disable (default `true`)
- `SLASH_COMMAND_ITEMS` and `filterSlashItems()` exported from `@remyx/core` for custom integrations

### Future enhancements

- Recently-used commands pinned to the top of the palette
- Custom command items via prop or plugin API

## Block-Based Editing

- Draggable block handles on hover — reorder paragraphs, images, tables, and embeds via drag-and-drop
- Block-level toolbar: appears on hover/focus with block type, drag handle, and actions menu
- Block type conversion: turn a paragraph into a heading, quote, callout, or list without retyping
- Nested blocks: toggle lists, collapsible sections, tabbed content
- Block grouping: select multiple blocks and move, duplicate, or delete as a unit
- Block templates: save and reuse custom block compositions (e.g., a "feature card" with image + heading + text)

## Callouts, Alerts & Admonitions

- Styled callout blocks: info, warning, error, success, tip, note, question
- Custom callout types with user-defined icons and colors
- Collapsible callouts with expand/collapse toggle
- Nested content inside callouts (lists, code blocks, images)
- GitHub-flavored alert syntax support (`> [!NOTE]`, `> [!WARNING]`)

## Comments & Annotations

- Inline comment threads: highlight text and attach discussion threads
- Resolved/unresolved state with visual indicators
- `onComment`, `onResolve`, `onDelete` callbacks for persistence
- Comment sidebar panel showing all threads with jump-to-location
- @mention support in comment bodies with configurable user list
- Comment-only mode: users can annotate but not edit content

## Version History & Diffing

- Named snapshots: save the current document state with a label
- Visual diff view: side-by-side or inline diff between any two snapshots
- Restore to any previous snapshot with one click
- `onSnapshot` callback for server-side persistence
- Auto-snapshot on major operations (paste, bulk delete, import)
- Change attribution: track which user made which changes (pairs with collaboration)

## Content Analytics & Readability

- Real-time readability scores: Flesch-Kincaid, Gunning Fog, Coleman-Liau
- Reading time estimate (configurable words-per-minute)
- Sentence and paragraph length warnings (highlight overly complex sentences)
- Vocabulary level indicator (basic, intermediate, advanced)
- Content structure analysis: heading hierarchy validation, orphaned sections
- Goal-based writing: set a target word count with progress indicator
- SEO hints: keyword density, meta description length, heading structure

## Advanced Link Management

- Link previews: hover to see title, description, and thumbnail (Open Graph / unfurl)
- Broken link detection: periodic scan with visual indicators for dead links
- Auto-link: detect and convert raw URLs, emails, and phone numbers as the user types
- Link analytics: `onLinkClick` callback with click tracking metadata
- Internal link suggestions: search and link to other documents in the same system
- Bookmark anchors: insert named anchors and link to them within the document

## Drag-and-Drop Content

- Drop zone overlays: visual guides when dragging files, images, or blocks over the editor
- Drag between editors: move content between multiple Remyx instances on the same page
- External drag support: drop images, files, and rich text from the desktop or other apps
- Drag-to-reorder for list items, table rows, and block elements
- Ghost preview during drag showing exactly where content will land

## Table of Contents & Document Outline

- Auto-generated table of contents from heading hierarchy
- Sticky outline sidebar or floating panel
- Click-to-scroll navigation
- Collapsible sections based on heading levels
- Numbering options: 1.1, 1.2, etc.
- `onOutlineChange` callback for syncing with external navigation

## Mentions & Tagging

- `@mention` support with configurable data source (async search)
- `#tag` support for inline categorization
- Mention chips rendered inline with avatar, name, and link
- Typeahead dropdown with fuzzy matching and keyboard navigation
- Custom mention types: users, documents, issues, PRs, etc.
- `onMention` callback for notifications and analytics

## Math & Equation Editor

- LaTeX / KaTeX inline and block math rendering
- Visual equation builder for users unfamiliar with LaTeX syntax
- Live preview as you type
- Equation numbering and cross-referencing
- Common symbol palette with categorized groups (Greek, operators, arrows, etc.)
- Copy equation as LaTeX, MathML, or image

## Diagram & Drawing Support

- Mermaid.js integration for flowcharts, sequence diagrams, Gantt charts, and ER diagrams
- Inline diagram editor with live preview
- Excalidraw-style freehand drawing canvas embedded as a block
- Export diagrams as SVG or PNG
- Diagram templates for common use cases

## Mobile & Touch Optimization

- Touch-optimized floating toolbar that follows selection without obscuring content
- Swipe gestures: swipe to indent/outdent, swipe to dismiss toolbar
- Long-press context menu with haptic feedback integration
- Pinch-to-zoom on images and tables
- Mobile-first responsive toolbar: collapses into overflow menu at narrow widths
- iOS/Android keyboard-aware layout: editor scrolls to keep caret visible above the virtual keyboard
- Touch-friendly drag handles with larger hit targets

## Keyboard-First Editing

- Vim-style keybinding mode (optional) — normal, insert, visual modes
- Emacs keybinding preset
- Customizable keybinding map via `keyBindings` prop
- Multi-cursor editing: `Cmd+D` to select next occurrence, `Alt+Click` to add cursors
- Smart bracket/quote auto-pairing with wrap-selection support
- Jump-to-heading with `Cmd+Shift+P` quick navigation

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

## Build & DevOps

- ~~Nx monorepo integration — task orchestration, caching, affected commands~~
- ~~GitHub Actions CI pipeline: build → lint → test on every push/PR~~
- Automated npm publishing via `nx release` on tagged commits
- ~~Pre-commit hooks (Husky + lint-staged) for consistent code quality~~
- Bundle size tracking: fail CI if any package exceeds its size budget
- Automated dependency updates (Renovate or Dependabot) with auto-merge for passing patch bumps

## Quality Improvements

- ~~Comprehensive unit test suite (Jest) for engine, commands, sanitizer, and converters~~ — 857 tests across 45 files
- ~~End-to-end tests (Playwright) covering toolbar interactions, paste, drag-and-drop, and modals~~ — 8 spec files
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
- See [TASKS.md](./TASKS.md) for the full optimization inventory (48 items, 21 complete)

---

*This roadmap is subject to change. Contributions, feedback, and feature requests are welcome.*
