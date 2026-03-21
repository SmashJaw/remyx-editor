![Remyx Editor](./images/Remyx-Logo.svg)

# Remyx Editor Roadmap

**Current Version:** 0.39.0
**Status:** Multi-package architecture complete (`@remyxjs/core` + `@remyxjs/react`), unified 6-theme system, autosave, command palette with recently-used pinning and custom command registration, code block syntax highlighting, enhanced tables, security hardening, inter-editor communication, RTL/i18n/print, block-based editing with type conversion/templates/grouping, mobile & touch optimization, comments & annotations with inline threads/mentions/panel/comment-only mode, expanded plugin architecture with dependency resolution/lifecycle hooks/scoped settings/registry, callouts/alerts/admonitions, template system with merge tags/conditionals/loops, keyboard-first editing with Vim/Emacs/auto-pair/multi-cursor, drag-and-drop content, advanced link management, math/equation editor, table of contents/document outline, content analytics/readability, real-time collaboration, UX/UI improvements (animations, empty state, distraction-free mode, breadcrumb bar, minimap, split view, sticky toolbar, toolbar customization, color presets, typography controls), spelling & grammar checking with writing-style presets, external config file support (defineConfig/loadConfig), performance optimizations (WorkerPool, VirtualScroller, compressed undo history, input batching, lazy plugin loading, shared selectionchange listener, getHTML caching, hash-based sanitizer LRU), P0 complete, 275/275 tasks resolved, 1768 tests passing

A living document outlining planned features, improvements, and long-term direction for the Remyx rich-text editor. Sections are ordered by priority — security and stability first, then features ranked by user impact.

---

# Planned

## Demos & Playwright Testing

A `demos/` directory with self-contained examples and end-to-end Playwright tests, all runnable from within the packages repo.

- **Demo apps**: standalone examples for each major feature (tables, collaboration, math, comments, templates, etc.) with minimal boilerplate
- **Playwright E2E tests**: browser-based tests covering real user interactions — typing, formatting, drag-and-drop, plugin behavior, toolbar/menu interactions
- **Test runner integration**: `npm run test:e2e` script in `packages/package.json`, executable via `npx playwright test` from `demos/`
- **CI integration**: Playwright tests run in the GitHub Actions CI pipeline alongside unit tests
- **Visual regression**: optional screenshot comparison for toolbar, theme, and layout consistency
- **Accessibility audits**: automated axe-core checks on each demo page
- **Documentation**: each demo serves as living documentation — users can reference the source as usage examples

## Plugin & Theme Repository

A community-driven repository hosted on [remyxjs.com](https://remyxjs.com) for discovering, sharing, and installing user-made plugins and themes.

- **Plugin registry**: browse, search, and install community plugins directly from the editor config or CLI (`npx create-remyx-app` plugin picker)
- **Theme gallery**: browse and preview user-submitted themes with live demos; one-click install via config file or `customTheme` prop
- **Publishing workflow**: `npx remyx publish` CLI command to package and submit a plugin or theme to the registry with metadata (name, version, description, author, tags, screenshots)
- **Versioning & compatibility**: semver-based versioning with `@remyxjs/core` compatibility ranges; registry enforces minimum core version
- **Quality checks**: automated validation on submission — lint, bundle size check, security scan (no eval, no external network calls), basic smoke test
- **Rating & reviews**: community ratings and usage statistics to surface popular/trusted plugins
- **Scoped packages**: plugins published as `@remyxjs-community/plugin-name` on npm for easy installation; themes as JSON files downloadable from the gallery
- **SDK**: `createPlugin()` and `createTheme()` APIs already exist; add a `remyx-plugin-template` scaffold via `npx create-remyx --plugin` for quick authoring
- **Integration with `resolvePlugins`**: registered community plugins can be referenced by name in JSON/YAML config files (e.g., `"plugins": ["@community/kanban-board"]`)

## Version History & Diffing

- Named snapshots: save the current document state with a label
- Visual diff view: side-by-side or inline diff between any two snapshots
- Restore to any previous snapshot with one click
- `onSnapshot` callback for server-side persistence
- Auto-snapshot on major operations (paste, bulk delete, import)
- Change attribution: track which user made which changes (pairs with collaboration)

## Image & Video Optimization

- Client-side image compression before upload (configurable quality/max dimensions)
- Automatic WebP/AVIF conversion for supported browsers
- Lazy-loading for images below the fold (`loading="lazy"`)
- Responsive `srcset` generation from a single upload
- Video thumbnail extraction and poster frame selection
- Embedded video player with playback controls (not just raw `<video>`)
- Image editing toolbar: crop, rotate, brightness, contrast, filters
- Drag-to-resize with aspect ratio lock

## create-remyx Advanced Wizard

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

## Framework Wrappers & CMS Integrations

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

## Nx Monorepo — Remaining

- **Remote caching**: enable Nx Cloud for shared CI/local cache across the team (optional, free tier available) — not yet configured; add `nxCloudAccessToken` to `nx.json` when ready
- **Generators**: scaffold new framework wrappers (`@remyxjs/vue`, `@remyxjs/svelte`, `@remyxjs/angular`) with consistent structure via Nx generators — deferred until framework wrappers are built

## Lighthouse Performance Target

- Lighthouse performance score target: 95+ — requires a hosted demo page; infrastructure ready, will validate when demo site is deployed

## Custom Theme Builder

- Contrast checker: validate text/background color combinations against WCAG AA/AAA — will be integrated into the remyxjs.com theme builder

---

# Future Product Offerings

These features are not planned for the open-source @remyxjs packages and will be included in a future commercial product.

## Mentions & Tagging

- ~~`@mention` support with configurable data source (async search)~~
- ~~`#tag` support for inline categorization~~
- ~~Mention chips rendered inline with avatar, name, and link~~
- ~~Typeahead dropdown with fuzzy matching and keyboard navigation~~
- ~~Custom mention types: users, documents, issues, PRs, etc.~~
- ~~`onMention` callback for notifications and analytics~~

## AI Integration

- ~~`aiProvider` prop accepting an adapter interface for any LLM backend (OpenAI, Anthropic, local models)~~
- ~~Inline AI actions: rewrite selection, summarize, expand, translate, adjust tone~~
- ~~AI-powered autocomplete with ghost-text suggestions (Tab to accept)~~
- ~~Context-aware AI — sends surrounding content for better suggestions~~
- ~~Slash-command menu (`/ai summarize`, `/ai translate to Spanish`, etc.)~~
- ~~Privacy-first: no data sent anywhere unless the consumer explicitly configures a provider~~

## Diagram & Drawing Support

- ~~Mermaid.js integration for flowcharts, sequence diagrams, Gantt charts, and ER diagrams~~
- ~~Inline diagram editor with live preview~~
- ~~Excalidraw-style freehand drawing canvas embedded as a block~~
- ~~Export diagrams as SVG or PNG~~
- ~~Diagram templates for common use cases~~

## Service Integrations

- ~~**Cloud storage**: Google Drive, Dropbox, OneDrive — browse and insert files/images directly~~
- ~~**Media**: Unsplash, Pexels, Giphy — search and insert royalty-free images/GIFs~~
- ~~**Embeds**: YouTube, Vimeo, Twitter/X, CodePen, Figma — rich embed previews~~
- ~~**Collaboration**: Slack, Microsoft Teams — share editor content or receive webhook notifications~~
- ~~**CMS**: WordPress, Contentful, Strapi, Sanity — bidirectional content sync~~
- ~~**Email**: Mailchimp, SendGrid — export editor HTML as email-ready templates~~
- ~~Integration SDK with a standardized adapter pattern for adding custom services~~

---

# Shipped

## ~~Nx Monorepo Integration~~ ✅ Shipped (v0.39.0)

- ~~Migrate from npm workspaces to [Nx](https://nx.dev/) for monorepo orchestration~~ — `nx.json` configured alongside existing npm workspaces (incremental adoption)
- ~~**Task pipeline**: define `build`, `test`, and `lint` target dependencies so `@remyxjs/react` automatically builds `@remyxjs/core` first~~ — `dependsOn: ["^build"]` in `targetDefaults`
- ~~**Computation caching**: Nx caches build and test outputs locally — rebuilds only what changed~~ — `cache: true` for build, lint, and test targets
- **Remote caching**: enable Nx Cloud for shared CI/local cache across the team (optional, free tier available) — not yet configured; add `nxCloudAccessToken` to `nx.json` when ready
- ~~**Affected commands**: `nx affected:build` and `nx affected:test` run only against packages touched by a PR, dramatically speeding up CI~~ — `npm run affected:build`, `affected:test`, `affected:lint` scripts; CI workflow uses affected commands
- ~~**Project graph**: `nx graph` visualizes package dependencies (`core` → `react`) for onboarding and debugging~~ — `npm run graph`
- **Generators**: scaffold new framework wrappers (`@remyxjs/vue`, `@remyxjs/svelte`, `@remyxjs/angular`) with consistent structure via Nx generators — deferred until framework wrappers are built
- ~~**Release management**: `nx release` for coordinated versioning, changelog generation, and npm publishing across all packages~~ — `npm run release`, `release:version`, `release:publish`, `release:dry-run`; GitHub Actions publish workflow at `.github/workflows/publish.yml`
- ~~**Enforce module boundaries**: lint rules preventing `@remyxjs/core` from importing `react` or `@remyxjs/react` from importing framework-specific code it shouldn't~~ — `no-restricted-imports` ESLint rule in `eslint.config.js` blocks React and `@remyxjs/react` imports from `@remyxjs/core`
- ~~**Parallel execution**: Nx runs independent targets in parallel with configurable concurrency, utilizing all CPU cores~~ — default Nx behavior
- ~~**Migration path**: incremental adoption — add `nx.json` and per-package `project.json` files without changing existing `package.json` scripts or Vite configs~~ — no `project.json` files needed; Nx auto-infers from `package.json`

## ~~External Configuration~~ ✅ Shipped (v0.38.0)

- ~~Load toolbar layout, theme, fonts, and plugin list from a JSON/YAML config file~~ — `loadConfig(url, { env, headers, signal })` in `@remyxjs/core`, lightweight inline YAML parser for simple configs
- ~~`RemyxEditor.fromConfig(url)` static method for fully declarative setup~~ — `<RemyxEditorFromConfig url="..." />` component with loading/error states, prop overrides
- ~~Environment-based config merging (development vs. production defaults)~~ — `env` key in config with named overrides, deep-merged onto base config
- ~~Admin panel concept: a standalone UI for building editor configurations visually~~ — will be available on [remyxjs.com](https://remyxjs.com) in the near future
- ~~Runtime config reloading without unmounting the editor~~ — `useExternalConfig(url, { pollInterval })` hook with `reload()`, auto-reload on URL change, polling support

## ~~Spelling & Grammar Checking~~ ✅ Shipped (v0.37.0)

- ~~Built-in spellcheck layer using the browser's native `Intl` / spellcheck API~~ — `SpellcheckPlugin` with native `spellcheck` attribute + built-in `GrammarEngine`
- ~~Optional integration with LanguageTool, Grammarly SDK, or a custom grammar service~~ — `customService: { check(text) }` interface for any external service
- ~~Inline red/blue underlines with right-click correction suggestions~~ — `.rmx-spelling-error` (red wavy), `.rmx-grammar-error` (blue wavy), `.rmx-style-suggestion` (green dotted) with context menu popup
- ~~"Ignore" and "Add to dictionary" per-session or persistent~~ — `addToDictionary`, `ignoreWord` commands with localStorage persistence
- ~~Language detection and multi-language support~~ — BCP 47 language tags, `setLanguage('fr-FR')` API
- ~~Grammar rule categories: punctuation, passive voice, wordiness, clichés~~ — `detectPassiveVoice`, `detectWordiness`, `detectCliches`, `detectPunctuationIssues`
- ~~Writing-style presets (formal, casual, technical, academic)~~ — `STYLE_PRESETS` with per-preset rule configuration

## ~~UX / UI Improvements~~ ✅ Shipped (v0.36.0)

- ~~**Smooth animations**: toolbar transitions, modal enter/exit, block reorder animations~~
- ~~**Tooltip system**: consistent, accessible tooltips on all toolbar items with shortcut hints~~
- ~~**Focus management**: clear focus rings, trap focus in modals, restore focus on close~~
- ~~**Empty state**: configurable illustrated empty state when editor has no content~~
- ~~**Distraction-free mode**: hide all chrome (toolbar, status bar) with a fade-in on mouse move~~
- ~~**Breadcrumb bar**: show current block context (e.g., "Table > Row 2 > Cell 3" or "Blockquote > List > Item")~~
- ~~**Minimap**: optional code-editor-style minimap for long documents~~
- ~~**Split view**: side-by-side edit + preview pane for markdown or HTML source~~
- ~~**Sticky toolbar**: toolbar stays visible when scrolling long documents~~
- ~~**Inline formatting bubble**: compact floating toolbar on text selection (bold, italic, link, highlight, comment)~~
- ~~**Drag-and-drop toolbar customization**: let users rearrange toolbar buttons at runtime~~
- ~~**Color palette presets**: save and reuse custom color palettes across text and background colors~~
- ~~**Typography controls**: line height, letter spacing, paragraph spacing adjustments~~

## ~~Real-Time Collaborative Editing~~ ✅ Shipped (v0.35.0)

- ~~CRDT-based conflict-free real-time co-editing (Yjs or Automerge)~~
- ~~Awareness protocol: live cursors with user names and colors~~
- ~~Presence indicators showing who is currently viewing/editing~~
- ~~Offline-first: queue changes locally, sync when reconnected~~
- ~~Operation history with per-user attribution~~
- ~~Configurable transport: WebSocket, WebRTC, or custom~~
- ~~`collaborationProvider` prop — bring your own signaling server or use a hosted option~~

## ~~Content Analytics & Readability~~ ✅ Shipped (v0.33.0)

- ~~Real-time readability scores: Flesch-Kincaid, Gunning Fog, Coleman-Liau~~ — `AnalyticsPlugin` with `analyzeContent()` returning `readability.fleschKincaid`, `readability.gunningFog`, `readability.colemanLiau`, plus `fleschReadingEase`
- ~~Reading time estimate (configurable words-per-minute)~~ — `readingTime.minutes` and `readingTime.seconds` with configurable `wordsPerMinute` (default 200)
- ~~Sentence and paragraph length warnings (highlight overly complex sentences)~~ — `warnings.longSentences` and `warnings.longParagraphs` arrays with configurable `maxSentenceLength` (30) and `maxParagraphLength` (150) thresholds
- ~~Vocabulary level indicator (basic, intermediate, advanced)~~ — `vocabularyLevel()` maps grade level to basic (≤6), intermediate (7-12), or advanced (13+)
- ~~Content structure analysis: heading hierarchy validation, orphaned sections~~ — pairs with `TocPlugin.validateHeadings` for skipped-level detection
- ~~Goal-based writing: set a target word count with progress indicator~~ — `targetWordCount` option returns `goalProgress: { target, current, percentage }`; CSS progress bar via `rmx-goal-progress`
- ~~SEO hints: keyword density, meta description length, heading structure~~ — `seoAnalysis()` checks H1 count, word count, heading presence; `keywordDensity()` reports count, density %, and positions; hints array with actionable suggestions
- ~~3 new commands: `getAnalytics`, `getSeoAnalysis`, `getKeywordDensity`~~
- ~~New exports: `AnalyticsPlugin`, `analyzeContent`, `countSyllables`, `splitSentences`, `fleschKincaid`, `fleschReadingEase`, `gunningFog`, `colemanLiau`, `vocabularyLevel`, `keywordDensity`, `seoAnalysis`~~
- ~~`onAnalytics` callback + `analytics:update` event on every content change (debounced 300ms)~~
- ~~22 new unit tests~~

## ~~Math & Equation Editor~~ ✅ Shipped (v0.33.0)

- ~~LaTeX / KaTeX inline and block math rendering~~ — `MathPlugin` with `$...$` (inline) and `$$...$$` (block) syntax, `<span/div class="rmx-math">` elements with `data-math-src` attribute, pluggable `renderMath(latex, displayMode)` callback (defaults to styled LaTeX display, integrate KaTeX or MathJax via callback)
- ~~Visual equation builder for users unfamiliar with LaTeX syntax~~ — `getSymbolPalette()` returns 4 categorized symbol groups (Greek, Operators, Arrows, Common) with label + LaTeX pairs for building palette UIs; `insertSymbol` command
- ~~Live preview as you type~~ — MutationObserver re-renders math elements on DOM changes; double-click to edit; `math:edit` event emitted
- ~~Equation numbering and cross-referencing~~ — Block equations auto-numbered with `data-equation-number` attribute and `(n)` label; `getMathElements` command lists all equations
- ~~Common symbol palette with categorized groups (Greek, operators, arrows, etc.)~~ — 40+ symbols across 4 categories
- ~~Copy equation as LaTeX, MathML, or image~~ — `copyMathAs` command supports `'latex'` and `'mathml'` formats; `latexToMathML()` converts common LaTeX to MathML
- ~~6 new commands: `insertMath`, `editMath`, `insertSymbol`, `getSymbolPalette`, `getMathElements`, `copyMathAs`~~
- ~~New exports: `MathPlugin`, `getSymbolPalette`, `parseMathExpressions`, `latexToMathML`~~
- ~~12 new unit tests~~

## ~~Table of Contents & Document Outline~~ ✅ Shipped (v0.33.0)

- ~~Auto-generated table of contents from heading hierarchy~~ — `TocPlugin` with `buildOutline()` that builds hierarchical tree from H1-H6 elements, auto-assigns IDs via slugification
- ~~Sticky outline sidebar or floating panel~~ — `rmx-outline-panel` CSS class for sidebar; `toc:change` event emitted on heading changes for building outline UIs
- ~~Click-to-scroll navigation~~ — `scrollToHeading` command with smooth scrolling; TOC link clicks handled automatically
- ~~Collapsible sections based on heading levels~~ — hierarchical outline with `children` arrays; UIs can render collapsible tree
- ~~Numbering options: 1.1, 1.2, etc.~~ — `numbering: true` option assigns section numbers (1, 1.1, 1.2, 2, etc.) via `assignNumbers()`
- ~~`onOutlineChange` callback for syncing with external navigation~~ — debounced (200ms) callback fired on every content change
- ~~`insertToc` command~~ — renders `<nav class="rmx-toc">` with nested `<ul><li><a>` structure into the document
- ~~`validateHeadings` command~~ — detects skipped heading levels (H1→H3) and returns warnings
- ~~4 new commands: `getOutline`, `insertToc`, `scrollToHeading`, `validateHeadings`~~
- ~~New exports: `TocPlugin`, `buildOutline`, `flattenOutline`, `renderTocHTML`, `validateHeadingHierarchy`~~
- ~~15 new unit tests~~

## ~~Advanced Link Management~~ ✅ Shipped (v0.32.0)

- ~~Link previews: hover to see title, description, and thumbnail (Open Graph / unfurl)~~ — `onUnfurl(url)` callback, cached tooltip with thumbnail/title/description/URL, 400ms hover delay
- ~~Broken link detection: periodic scan with visual indicators for dead links~~ — `validateLink(url)` callback, configurable `scanInterval`, `rmx-link-broken` class with strikethrough wavy underline + ⚠ indicator
- ~~Auto-link: detect and convert raw URLs, emails, and phone numbers as the user types~~ — `detectLinks()` with URL/email/phone patterns, auto-convert on Space/Enter with proper `mailto:`/`tel:`/`https://` hrefs
- ~~Link analytics: `onLinkClick` callback with click tracking metadata~~ — `{ href, text, target, timestamp, element }` payload on every link click
- ~~Internal link suggestions: search and link to other documents in the same system~~ — `onSuggest(query)` callback, `linkToBookmark` command for intra-document linking
- ~~Bookmark anchors: insert named anchors and link to them within the document~~ — `insertBookmark({ name, id })`, `getBookmarks`, `removeBookmark` commands, `slugify()` utility
- ~~6 new commands, new exports: `LinkPlugin`, `detectLinks`, `slugify`~~
- ~~25 new unit tests~~

## ~~Template System & Merge Tags~~ ✅ Shipped (v0.32.0)

- ~~`{{merge_tag}}` syntax with visual tag chips rendered inline~~ — `<span class="rmx-merge-tag" data-tag="name">` chips, `insertMergeTag` command, `textToChips`/`chipsToText` converters
- ~~Template designer mode: drag-and-drop merge tags from a sidebar palette~~ — `insertMergeTag` command inserts chips at caret; plugins can build sidebar palettes using `extractTags()`
- ~~Conditional blocks: `{{#if has_coupon}}...{{/if}}`~~ — `renderTemplate()` processes nested `{{#if}}` blocks with truthiness checks
- ~~Repeatable sections: `{{#each items}}...{{/each}}`~~ — `renderTemplate()` processes `{{#each}}` with object and primitive arrays (`{{this}}` for primitives)
- ~~Live preview with sample data injection~~ — `previewTemplate` command renders template with data, sets editor to read-only preview mode; `exitPreview` restores editing
- ~~Export templates as reusable JSON objects~~ — `exportTemplate` command returns `{ html, tags, sampleData }`
- ~~Pre-built template library: email, invoice, letter, report, newsletter~~ — 5 built-in templates with sample data; `registerTemplate`/`unregisterTemplate`/`getTemplateLibrary`/`getTemplate` APIs
- ~~New exports: `TemplatePlugin`, `renderTemplate`, `extractTags`, `registerTemplate`, `unregisterTemplate`, `getTemplateLibrary`, `getTemplate`~~
- ~~6 new commands: `insertMergeTag`, `loadTemplate`, `previewTemplate`, `exitPreview`, `exportTemplate`, `getTemplateTags`~~
- ~~22 new unit tests~~

## ~~Keyboard-First Editing~~ ✅ Shipped (v0.32.0)

- ~~Vim-style keybinding mode (optional) — normal, insert, visual modes~~ — `KeyboardPlugin({ mode: 'vim' })` with h/j/k/l movement, w/b word motion, 0/$ line bounds, i/a/o insert, v visual, dd delete line, u undo, x delete char, G go-to-end, Escape mode switch. Mode indicator CSS (`-- NORMAL --`, `-- INSERT --`, `-- VISUAL --`)
- ~~Emacs keybinding preset~~ — `KeyboardPlugin({ mode: 'emacs' })` with Ctrl+A/E/F/B/N/P/D/H/K/Y/W/Space bindings for navigation, kill ring, and mark
- ~~Customizable keybinding map via `keyBindings` prop~~ — `keyBindings: { 'ctrl+shift+l': 'insertLink' }` with function or command string values
- ~~Multi-cursor editing: `Cmd+D` to select next occurrence, `Alt+Click` to add cursors~~ — `selectNextOccurrence()` walks the DOM to find and add the next match to the selection
- ~~Smart bracket/quote auto-pairing with wrap-selection support~~ — `(`, `[`, `{`, `"`, `'`, `` ` `` auto-insert closing pair; wraps selected text; skips over existing closing chars
- ~~Jump-to-heading with `Cmd+Shift+G` quick navigation~~ — `getHeadings()` returns all headings with level/text/element; `jumpToHeading` command scrolls and focuses
- ~~5 new commands: `setKeyboardMode`, `getVimMode`, `jumpToHeading`, `getHeadings`, `selectNextOccurrence`~~
- ~~New exports: `KeyboardPlugin`, `getHeadings`, `selectNextOccurrence`~~
- ~~12 new unit tests~~

## ~~Drag-and-Drop Content~~ ✅ Shipped (v0.32.0)

- ~~Drop zone overlays: visual guides when dragging files, images, or blocks over the editor~~ — `rmx-drop-zone` / `rmx-drop-zone-active` classes with inset box-shadow, configurable via `showDropZone` option
- ~~Drag between editors: move content between multiple Remyx instances on the same page~~ — Cross-editor drag via `text/x-remyx-block` data transfer type; HTML content transferred and inserted at drop position
- ~~External drag support: drop images, files, and rich text from the desktop or other apps~~ — File drops auto-insert images as base64 `<img>`, `onFileDrop` callback for custom handling; rich text/HTML parsed and inserted
- ~~Drag-to-reorder for list items, table rows, and block elements~~ — Left-edge mousedown (30px) makes blocks draggable; `getDropTarget()` finds nearest block by Y position; `moveBlockUp`/`moveBlockDown` commands with `Cmd+Shift+Arrow` shortcuts
- ~~Ghost preview during drag showing exactly where content will land~~ — Semi-transparent clone as drag image, `rmx-drop-indicator` bar (3px primary-colored) positioned at insertion point, `rmx-dragging` opacity on source block
- ~~2 new commands: `moveBlockUp`, `moveBlockDown`~~
- ~~New export: `DragDropPlugin`~~
- ~~Events: `dragdrop:reorder`, `dragdrop:crossEditor`, `dragdrop:fileDrop`, `dragdrop:externalDrop`~~
- ~~7 new unit tests~~

## ~~Expanded Plugin Architecture~~ ✅ Shipped (v0.31.0)

- ~~Formal `createPlugin()` lifecycle hooks: `onInit`, `onDestroy`, `onContentChange`, `onSelectionChange`~~ — `onContentChange` wired to `content:change` events, `onSelectionChange` wired to `selectionchange` events, both sandboxed with try/catch error isolation. Plus existing `init`/`destroy` lifecycle.
- ~~Plugin dependency resolution and load ordering~~ — `dependencies: ['otherPlugin']` in plugin definition triggers topological sort (Kahn's algorithm) during `initAll()`. Circular dependencies detected and reported via `plugin:circularDependency` event; involved plugins still initialize. `activatePlugin()` recursively initializes dependencies for lazy plugins.
- ~~Scoped plugin settings with a per-plugin configuration schema~~ — `settingsSchema` array with `{ key, type, label, defaultValue, description, options, validate }` fields. `defaultSettings` object for defaults. Type validation (string/number/boolean/select), select option validation, and custom `validate()` functions. `getSetting`/`setSetting` on the restricted API, `getPluginSetting`/`setPluginSetting`/`getPluginSettings` on the manager. `plugin:settingChanged` event emitted on updates.
- ~~Plugin marketplace/registry concept — discover and install community plugins~~ — Global registry via `registerPluginInRegistry()`, `unregisterPluginFromRegistry()`, `listRegisteredPlugins()`, and `searchPluginRegistry(query)`. Entries include name, version, description, author, tags, and optional factory function. Search matches on name, description, and tags.
- ~~First-party plugin packs~~ — 17 built-in plugins: WordCount, Autolink, Placeholder, SyntaxHighlight, Table, Comments, BlockTemplate, Callout, Link, Template, Keyboard, DragDrop, Math, Toc, Analytics, Spellcheck, Collaboration. Packs can be composed as arrays.
- ~~Plugin sandboxing to prevent one plugin from breaking the editor or other plugins~~ — Each `init`, `destroy`, `onContentChange`, and `onSelectionChange` call wrapped in try/catch. Errors logged to console and emitted as `plugin:error` events with `{ name, error, hook }` payload. A crashing plugin cannot affect other plugins or the editor.
- ~~Plugin metadata: `version`, `description`, `author` fields for registry/marketplace discovery~~
- ~~32 new unit tests for lifecycle hooks, dependency resolution, settings validation, registry, and metadata~~

## ~~Callouts, Alerts & Admonitions~~ ✅ Shipped (v0.31.0)

- ~~Styled callout blocks: info, warning, error, success, tip, note, question~~ — `CalloutPlugin` with `insertCallout` command, `<div class="rmx-callout rmx-callout-{type}">` DOM structure with icon header, editable body, and per-type CSS custom properties for border/background colors (light + dark theme support)
- ~~Custom callout types with user-defined icons and colors~~ — `registerCalloutType({ type, label, icon, color })` / `unregisterCalloutType(type)` / `getCalloutTypes()` / `getCalloutType(type)` APIs; can override built-in types
- ~~Collapsible callouts with expand/collapse toggle~~ — `collapsible: true` option on `insertCallout`, `toggleCalloutCollapse` command, `data-callout-collapsible` / `data-callout-collapsed` attributes, click handler on toggle button with ▶/▼ indicators
- ~~Nested content inside callouts (lists, code blocks, images)~~ — callout body is a regular editable `<div>` that accepts any block-level content
- ~~GitHub-flavored alert syntax support (`> [!NOTE]`, `> [!WARNING]`)~~ — `parseGFMAlert()` detects GFM syntax in blockquotes; auto-converts on paste/content change (debounced 300ms); maps NOTE→note, TIP→tip, IMPORTANT→info, WARNING→warning, CAUTION→error
- ~~4 new commands: `insertCallout`, `removeCallout`, `changeCalloutType`, `toggleCalloutCollapse`~~
- ~~New exports: `CalloutPlugin`, `registerCalloutType`, `unregisterCalloutType`, `getCalloutTypes`, `getCalloutType`, `parseGFMAlert` from `@remyxjs/core`~~
- ~~30 new unit tests~~

## ~~Comments & Annotations~~ ✅ Shipped (v0.30.0)

- ~~Inline comment threads: highlight text and attach discussion threads~~ — `CommentsPlugin` wraps selected text in `<mark class="rmx-comment" data-comment-id>` elements, maintains in-memory thread store with `addComment`, `editComment`, `replyToComment`, `deleteComment` methods
- ~~Resolved/unresolved state with visual indicators~~ — `resolveComment(id, true/false)` toggles `data-comment-resolved` attribute and `rmx-comment-resolved` CSS class (amber highlights for open, muted gray for resolved)
- ~~`onComment`, `onResolve`, `onDelete` callbacks for persistence~~ — plus `onReply` callback; all lifecycle events emitted on the engine eventBus (`comment:created`, `comment:resolved`, `comment:deleted`, `comment:replied`, `comment:updated`, `comment:clicked`, `comment:navigated`, `comment:imported`)
- ~~Comment sidebar panel showing all threads with jump-to-location~~ — `CommentsPanel` React component with thread cards, reply input, resolve/reopen/delete actions, @mention highlighting, relative timestamps, open/resolved/all filter
- ~~@mention support in comment bodies with configurable user list~~ — `parseMentions()` extracts `@username` references, `mentionUsers` option provides autocomplete list via `getMentionUsers()`
- ~~Comment-only mode: users can annotate but not edit content~~ — `commentOnly: true` option sets `contenteditable="false"` and adds `rmx-comment-only` class
- ~~`useComments` React hook~~ — reactive thread state, convenience methods (addComment, deleteComment, resolveComment, replyToComment, editComment, navigateToComment), import/export, active thread tracking
- ~~Import/export threads~~ — `importThreads()` loads serialized data, `exportThreads()` returns JSON-serializable array; auto-scans existing `data-comment-id` marks on init
- ~~DOM sync~~ — MutationObserver detects when annotated text is deleted and removes orphaned threads automatically
- ~~New exports: `CommentsPlugin`, `parseMentions` from `@remyxjs/core`; `CommentsPanel`, `useComments` from `@remyxjs/react`~~
- ~~6 new commands: `addComment`, `deleteComment`, `resolveComment`, `replyToComment`, `editComment`, `navigateToComment`~~
- ~~28 new unit tests~~

## ~~Slash Commands &~~ Command Palette — ✅ Shipped (v0.25.0, enhanced v0.29.0)

- ~~`/` trigger opens a searchable command palette inline at the caret~~ (removed — too easy to trigger accidentally)
- ~~`Mod+Shift+P` opens a global command palette overlay with search input~~
- ~~Toolbar button (`commandPalette`) opens the same palette~~
- ~~19 built-in commands across 5 categories: Text, Lists, Media, Layout, Advanced~~
- ~~Fuzzy search across labels, descriptions, and keywords~~
- ~~Keyboard navigation (Arrow keys, Enter to execute, Escape to close)~~
- ~~`commandPalette` prop to enable/disable (default `true`)~~
- ~~`SLASH_COMMAND_ITEMS` and `filterSlashItems()` exported from `@remyxjs/core` for custom integrations~~
- ~~Recently-used commands pinned to the top of the palette~~ — last 5 executed commands stored in `localStorage`, shown under a "Recent" category when no search query is active. `getRecentCommands()`, `recordRecentCommand()`, `clearRecentCommands()` exported from `@remyxjs/core`
- ~~Custom command items via prop or plugin API~~ — `registerCommandItems()` and `unregisterCommandItem()` APIs for adding custom entries to the palette from plugins or application code. Custom items are merged with built-in items and deduplicated by `id`

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
- ~~New `TablePlugin` built-in plugin with MutationObserver-based table detection, delegated sort click handlers, formula focus/blur handlers, resize handle injection, and filter UI management~~
- ~~New exports: `TablePlugin`, `evaluateTableFormulas` from `@remyxjs/core`~~
- ~~6 new commands: `toggleHeaderRow`, `sortTable`, `filterTable`, `clearTableFilters`, `formatCell`, `evaluateFormulas`~~

## ~~Block-Based Editing~~ ✅ Shipped (v0.28.0)

- ~~Draggable block handles on hover — reorder paragraphs, images, tables, and embeds via drag-and-drop~~ — `BlockDragHandle` component with pointer event support for cross-device drag
- ~~Block-level toolbar: appears on hover/focus with block type, drag handle, and actions menu~~ — `BlockToolbar` component with block type badge dropdown, actions menu (Move Up/Down, Duplicate, Delete, Convert To…), rAF-based positioning
- ~~Block type conversion: turn a paragraph into a heading, quote, callout, or list without retyping~~ — `convertBlock` command supporting paragraph, h1–h6, blockquote, codeBlock, unorderedList, orderedList conversions preserving text content
- ~~Nested blocks: toggle lists, collapsible sections, tabbed content~~ — `toggleCollapse` command wraps/unwraps blocks in `<details><summary>` structure with CSS indicators
- ~~Block grouping: select multiple blocks and move, duplicate, or delete as a unit~~ — `selectBlocks`, `clearBlockSelection`, `groupBlocks`, `ungroupBlocks`, `moveGroup`, `duplicateGroup` commands with `rmx-block-selected` / `rmx-block-group` CSS classes
- ~~Block templates: save and reuse custom block compositions (e.g., a "feature card" with image + heading + text)~~ — `BlockTemplatePlugin` with `registerTemplate`, `insertTemplate`, `getTemplates`, `removeTemplate` APIs; 3 built-in templates (Feature Card, Two-Column, Call to Action)
- ~~New commands: `convertBlock`, `moveBlockUp`, `moveBlockDown`, `duplicateBlock`, `deleteBlock`, `selectBlocks`, `clearBlockSelection`, `toggleCollapse`, `groupBlocks`, `ungroupBlocks`, `moveGroup`, `duplicateGroup`~~
- ~~New exports: `registerBlockConvertCommands`, `BlockTemplatePlugin` from `@remyxjs/core`~~

## ~~Mobile & Touch Optimization~~ ✅ Shipped (v0.28.0)

- ~~Touch-optimized floating toolbar that follows selection without obscuring content~~ — touch selection via `touchend` + `selectionchange` with 300ms delay, above/below positioning, draggable grip handle for repositioning
- ~~Swipe gestures: swipe to indent/outdent, swipe to dismiss toolbar~~ — `useSwipeGesture` hook with 50px threshold, 30px max vertical deviation, visual translateX feedback, swipe-down dismiss
- ~~Long-press context menu with haptic feedback integration~~ — `useLongPress` hook with 500ms hold, 10px movement cancellation, `navigator.vibrate(10)` haptic feedback
- ~~Pinch-to-zoom on images and tables~~ — `usePinchZoom` hook with CSS `transform: scale()` (0.5–3.0 range), applies final dimensions on release, reset-zoom button
- ~~Mobile-first responsive toolbar: collapses into overflow menu at narrow widths~~ — `ResizeObserver`-based overflow detection, trailing items collapse into "⋯" dropdown, priority-based
- ~~iOS/Android keyboard-aware layout: editor scrolls to keep caret visible above the virtual keyboard~~ — `useVirtualKeyboard` hook using `visualViewport` API with `window.innerHeight` fallback, adds padding and scrolls caret into view
- ~~Touch-friendly drag handles with larger hit targets~~ — pointer events replacing mouse events in `BlockDragHandle`, 44×44px targets via `@media (pointer: coarse)`, touch drag with `setPointerCapture` and ghost preview
- ~~New hooks: `useSwipeGesture`, `useLongPress`, `usePinchZoom`, `useVirtualKeyboard`~~
- ~~CSS: 44px touch targets for toolbar/context menu/floating toolbar, `@media (pointer: coarse)` drag handle sizing~~

## ~~Code Block Syntax Highlighting~~ ✅ Shipped (v0.28.0)

- ~~Language-specific syntax highlighting inside fenced code blocks~~ — implemented with custom lightweight tokenizers (zero external dependencies, no Prism/Shiki/Highlight.js)
- ~~Language selector dropdown on code blocks~~ — pick from 11 languages (JavaScript, TypeScript, Python, CSS, SQL, JSON, Bash, Rust, Go, Java, HTML)
- ~~Auto-detect language from content when no language is specified~~ — heuristic-based detection via `detectLanguage()`
- ~~Theme-aware highlighting~~ — `.rmx-syn-*` token colors in all 6 themes (light, dark, ocean, forest, sunset, rose)
- ~~Markdown round-trip: preserve language identifiers (` ```js `, ` ```python `) in markdown output~~
- ~~MutationObserver-based auto-highlighting with debouncing, skips actively-edited blocks~~
- ~~`setCodeLanguage` and `getCodeLanguage` commands~~
- ~~`SyntaxHighlightPlugin`, `SUPPORTED_LANGUAGES`, `LANGUAGE_MAP`, `detectLanguage`, `tokenize` exports~~
- ~~Line numbers toggle per code block~~ — `toggleLineNumbers` command, `data-line-numbers` attribute on `<pre>`, auto-updating gutter with per-line `<span>` elements
- ~~Copy-to-clipboard button on code blocks~~ — auto-injected button (appears on hover), async Clipboard API with execCommand fallback, visual ✓ feedback on copy
- ~~Extensible language registry~~ — `registerLanguage(id, label, tokenizer, aliases)` and `unregisterLanguage(id, aliases)` APIs, `runRules` helper exported for building custom tokenizers
- ~~Inline code spans with optional mini-highlighting for single-line snippets~~ — `<code data-language="js">` elements outside `<pre>` are automatically tokenized with the same syntax classes

## ~~Unified Theme System~~ ✅ Shipped (v0.27.0)

- ~~6 built-in themes via single `theme` prop: `light`, `dark`, `ocean`, `forest`, `sunset`, `rose`~~
- ~~Each theme is a self-contained CSS class (`.rmx-theme-{name}`) with full variable overrides, content styles, code editor colors, and syntax token palettes~~
- ~~`customTheme` prop for per-instance CSS variable overrides on top of any theme~~
- ~~`createTheme()` helper for camelCase-to-CSS-variable conversion~~
- ~~TypeScript declarations updated across all type locations~~

## ~~Autosave~~ ✅ Shipped (v0.26.0)

- ~~Periodic autosave to `localStorage` / `sessionStorage` with configurable interval~~
- ~~Crash-recovery banner: "Unsaved content was recovered — restore it?"~~
- ~~Server-side autosave~~ — implemented as pluggable storage providers (LocalStorage, SessionStorage, FileSystem, Cloud HTTP, Custom)
- ~~Debounced save on every content change with deduplication~~
- ~~Visual save-status indicator (Saved / Saving... / Unsaved)~~
- ~~Cloud storage: AWS S3 presigned URLs, GCP signed URLs, any HTTP endpoint~~
- ~~Filesystem provider for Node/Electron/Tauri apps~~
- ~~`AutosaveManager` class + 5 storage providers in `@remyxjs/core`~~
- ~~`useAutosave` hook, `SaveStatus`, `RecoveryBanner` in `@remyxjs/react`~~
- ~~`autosave` prop on `RemyxEditor` (boolean or config object)~~

## ~~Custom Theme Authoring & Theme Builder~~ ✅ Shipped

- ~~Interactive theme builder tool: visual editor for CSS custom properties with live preview~~ — a hosted theme builder will be available at [remyxjs.com](https://remyxjs.com) in the short-term future
- ~~Custom theme authoring guide with step-by-step documentation~~ — available now via `createTheme()` helper and CSS custom properties (see core README)
- ~~Theme export/import: save custom themes as JSON and share across projects~~ — supported via `customTheme` prop and `defineConfig()`
- ~~Theme presets: community-contributed themes installable via npm or config~~ — 6 built-in presets shipped; community themes can be shared as JSON config files
- Contrast checker: validate text/background color combinations against WCAG AA/AAA — will be integrated into the remyxjs.com theme builder

## `create-remyx-app` — ✅ Shipped (v0.25.0, enhanced v0.27.0)

Quick project scaffolding via `npx create-remyx-app`:

- ~~Project name prompt~~
- ~~Language: JavaScript (JSX) or TypeScript (TSX)~~
- ~~Theme selection: Light, Dark, Ocean, Forest, Sunset, Rose~~ (v0.27.0)
- ~~Optional PDF/DOCX import (mammoth + pdfjs-dist)~~
- ~~Vite-based project with `@remyxjs/core` + `@remyxjs/react`~~
- ~~Post-scaffold instructions: install, dev, build~~

## Security Hardening — ✅ Shipped (v0.24.0–v0.28.0)

- ~~Sanitizer: extend dangerous-protocol checking to `src`, `action`, `formaction`, and `data` attributes~~
- ~~Sanitizer: domain allowlist for iframe `src` (YouTube, Vimeo, Dailymotion only)~~ — `isAllowedIframeDomain()` validates iframe src against configurable domain allowlist, HTTPS-only, with subdomain matching. Configurable via `iframeAllowedDomains` option on the Sanitizer constructor
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
- ~~CSP-compatible build: eliminate all `document.write`, `execCommand`, and inline style dependencies~~ — all 30+ `document.execCommand()` calls replaced with Selection/Range-based DOM manipulation across formatting, heading, alignment, list, block, and font commands; `document.write()` replaced with `iframe.srcdoc` in PDF export; `Selection.insertHTML` uses `template.innerHTML` + `range.insertNode`; context menu uses Clipboard API
- ~~Subresource integrity (SRI) hashes for CDN-loaded assets (Google Fonts, external scripts)~~ — `loadGoogleFonts()` accepts `{ integrity, crossOrigin }` options for SRI hash verification on the injected `<link>` element; `crossOrigin='anonymous'` set by default for CORS font loading
- ~~Fix `dangerouslySetInnerHTML` fallback logic in ImportDocumentModal~~
- See [TASKS.md](./TASKS.md) for the full audit report (45 security items, 45 resolved, 0 open)

## Quality Improvements — ✅ Shipped

- ~~Comprehensive unit test suite (Vitest) for engine, commands, sanitizer, and converters~~ — 57 test files, 1416 tests across both packages
- ~~End-to-end tests (Playwright)~~ — Removed; the repo does not serve a production web server. Will revisit when a hosted demo is available.
- ~~XSS-specific test coverage for all modal components (LinkModal, ImageModal, SourceModal, etc.)~~
- ~~Visual regression tests for theme and layout stability~~ — Playwright config with `toHaveScreenshot()`, per-theme baseline snapshots, `maxDiffPixelRatio: 0.01` threshold. Infrastructure ready; tests added as hosted demo becomes available.
- ~~Accessibility: WAI-ARIA menu pattern, focus trapping, skip navigation, `baseHeadingLevel`~~
- ~~RTL (right-to-left) language support with `dir="rtl"` auto-detection~~ — `detectTextDirection()` analyzes Unicode character ranges (RTL vs LTR), `applyAutoDirection()` sets `dir` attribute per block element, CSS logical property mappings for lists/blockquotes/checkboxes, `LOGICAL_PROPERTIES` constants for JS usage
- ~~Internationalization (i18n): externalized strings, locale packs, pluralization~~ — `t()` translation function with `{{interpolation}}`, `setLocale()`/`getLocale()`, `registerLocale()`/`unregisterLocale()`, 120+ English strings covering toolbar, menus, modals, find/replace, autosave, accessibility labels. Partial locale packs fall back to English.
- ~~Improved undo/redo with operation coalescing (batch rapid keystrokes into a single undo step)~~ — configurable `coalesceMs` window (default 1000ms) groups rapid keystrokes into a single undo entry; debounce fires first (300ms), then updates the top of the stack instead of pushing during the coalesce window
- ~~Better large-document performance: virtualized rendering for 10k+ paragraph documents~~ — `batchDOMMutations()` for rAF-based mutation batching, `scheduleIdleTask()`/`cancelIdleTask()` for `requestIdleCallback` with Safari fallback, `rafThrottle()` for scroll/resize handlers, `benchmark()` and `measurePerformance()` profiling helpers
- ~~Print stylesheet for clean printed output~~ — `@media print` rules hiding toolbar/menubar/statusbar/modals, clean typography with page-break-after/avoid on headings, orphans/widows control, break-inside avoidance for tables/images/code, link URL display via `::after`, print-friendly code blocks and tables
- ~~Cross-browser testing matrix: Chrome, Firefox, Safari, Edge (latest 2 versions)~~ — Playwright config with 6 projects (Chromium, Firefox, WebKit, Edge, Mobile Chrome, Mobile Safari), parallel execution, retry on CI, trace on first retry
- ~~XSS-hardened sanitizer with configurable allowlists and deny-by-default~~
- ~~Error boundaries: `EditorErrorBoundary` wraps the editor, `onError` callback for error reporting~~
- ~~Automated performance benchmarks: track keystroke latency, paste speed, and render time per release~~ — `benchmark(label, fn, iterations)` returns mean/median/min/max/p95 stats, `measurePerformance()` wrapper with console.debug output

## Performance Optimizations — ✅ Shipped

- ~~Tree-shakeable ESM build — import only what you use~~
- ~~Code-split heavy features (PDF import, DOCX, document converters) behind dynamic `import()`~~
- ~~Memoized toolbar rendering — `React.memo` + `shallowEqual` bail-out on selection state~~
- ~~Terser minification with `drop_console` and `drop_debugger`~~
- ~~Lazy-loaded modals — all 9 modals deferred via `React.lazy` (~20–30 KB)~~
- ~~PDF/DOCX opt-in — `mammoth` and `pdfjs-dist` as optional peer deps~~
- ~~Reduce initial bundle size to < 50 KB gzipped for the core editor~~ — CI pipeline enforces 50KB core / 30KB react gzipped budget via `gzip -c | wc -c` check
- ~~Batch DOM mutations with `requestAnimationFrame` for smoother typing~~ — `batchDOMMutations()` utility groups sequential mutations into a single rAF callback
- ~~Web Worker offloading for expensive operations (sanitization, markdown parsing, document conversion)~~ — `WorkerPool` class with round-robin dispatch, lazy worker spawning, and synchronous fallback when Workers are unavailable
- ~~Idle-time processing: defer non-critical work (word count, readability scores) to `requestIdleCallback`~~ — `scheduleIdleTask()` with Safari fallback, `cancelIdleTask()` for cleanup
- ~~Virtualized rendering for long documents: only mount visible blocks in the DOM~~ — `VirtualScroller` using IntersectionObserver with 500px root margin, collapses off-screen blocks to placeholder divs for documents exceeding threshold (default 200 blocks)
- ~~Lazy plugin loading: plugins initialize on first use, not on editor mount~~ — `lazy: true` in plugin definitions skips `initAll()`, initializes on first command execution via wrapped handlers; `activatePlugin(name)` for explicit activation
- ~~Compressed undo history: store diffs instead of full snapshots to reduce memory usage~~ — character-level common-prefix/suffix diffing for documents over 5000 chars; full snapshots for short documents; `_resolveEntry()` walks backward to nearest full snapshot and applies diffs forward
- ~~Input batching: coalesce rapid keystrokes into single DOM updates to eliminate layout thrash~~ — `createInputBatcher()` with `queue()`, `flush()`, `destroy()` methods using rAF coalescing
- See [TASKS.md](./TASKS.md) for the full optimization inventory (63 items, 63 resolved, 0 open)

## Build & DevOps — ✅ Shipped

- ~~Nx monorepo integration — task orchestration, caching, affected commands~~
- ~~GitHub Actions CI pipeline: build → lint → test on every push/PR~~
- ~~Automated npm publishing via `nx release` on tagged commits~~ — `release.yml` workflow triggered on `v*` tags, runs `npx nx release publish --yes` with `NODE_AUTH_TOKEN`
- ~~Pre-commit hooks (Husky + lint-staged) for consistent code quality~~
- ~~Bundle size tracking: fail CI if any package exceeds its size budget~~ — CI step checks gzipped output of `remyx-core.js` (50KB) and `remyx-react.js` (30KB), fails build on exceed
- ~~Automated dependency updates (Renovate or Dependabot) with auto-merge for passing patch bumps~~ — `dependabot.yml` with weekly schedules for root, core, react, and GitHub Actions; grouped updates, reviewer assignment, labeled PRs

## ~~Multiple Editor Instances~~ ✅ Shipped

- ~~Full instance isolation: each editor gets its own engine, history, and event bus~~
- ~~No DOM ID collisions — all selectors scoped to the editor root~~
- ~~Shared configuration via a `<RemyxConfigProvider>` context wrapper~~
- ~~Inter-editor communication bus for linked editors (e.g., source + preview)~~ — `EditorBus` singleton with register/unregister, pub/sub, and `broadcast()` to push events into every editor's local event loop
- ~~Memory-efficient shared singleton for icons, sanitizer schema, and toolbar config~~ — `SharedResources` singleton with lazily-initialized, deeply-frozen schema, toolbar presets, defaults, keybindings, command metadata, and a shared icon registry
- ~~Stress-tested with 10+ concurrent editors on a single page~~

## ~~Menu Bar~~ ✅ Shipped

- ~~Application-style menus (File, Edit, View, Insert, Format) with submenus~~
- ~~Custom menu bar configuration with nested items and separators~~
- ~~Auto-deduplication: items in menu bar removed from toolbar~~
- ~~Keyboard navigation, hover-to-switch, escape-to-close~~
- ~~Dark/light/custom theme support~~

## ~~Multi-Package Architecture~~ ✅ Shipped (v0.23.4)

- ~~Extract framework-agnostic core into `@remyxjs/core`~~ — 62 files, 190+ exports, zero framework deps
- ~~Create `@remyxjs/react` with peer dependency on core~~ — 36 modules, full TypeScript declarations
- ~~Standalone `remyx-editor` package~~ — removed; consumers use `@remyxjs/react` directly
- ~~npm workspaces monorepo setup~~
- Multi-package restructure complete — see CHANGELOG for full history

---

*This roadmap is subject to change. Contributions, feedback, and feature requests are welcome.*
