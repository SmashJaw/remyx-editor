![Remyx Editor](./screenshots/Remyx-Logo.svg)

# Changelog

All notable changes to the Remyx Editor monorepo are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.39.0] — 2026-03-20

### Performance

- **Shared selectionchange listener** (Critical) — Replaced per-instance `document.addEventListener('selectionchange')` with a single static handler using a WeakMap registry. With 10+ editors, only one global listener fires instead of 10+.
- **History snapshot optimization** — Removed expensive `.replace(/\s+/g, ' ').trim()` whitespace normalization on every snapshot; hash raw `innerHTML` directly with djb2. Removed redundant re-sanitization in `undo()`/`redo()` (content was already sanitized at snapshot time). Removed `attributes: true` from MutationObserver to eliminate spurious mutation records from style changes.
- **getHTML() caching** — Added dirty flag to `EditorEngine`; `getHTML()` returns cached result when content hasn't changed. Combined with `_textCache` for `getWordCount()`/`getCharCount()` to eliminate redundant DOM traversals.
- **onChange debouncing** — Debounced the `content:change` → `onChange` callback with `requestAnimationFrame` to batch multiple changes per frame.
- **Sanitizer optimizations** — Reused single `DOMParser` instance across calls; switched LRU cache to hash-based keys (djb2) for O(1) lookups; replaced `Array.from(node.childNodes)` with reverse-iteration loop to eliminate thousands of temporary arrays.
- **React render optimizations** — Memoized theme className, WordCountButton element, autosaveConfig/menuBarConfig in useResolvedConfig; merged two keydown useEffect hooks; consolidated isEmpty check into a single content:change handler; replaced useState with useReducer for modals; compared DOMRect coordinates individually in useSelection to prevent unnecessary FloatingToolbar re-renders; pre-memoized modal onClick handlers in Toolbar with useCallback.
- **FloatingToolbar** — Removed redundant global `selectionchange` listener; uses engine's existing `selection:change` event.
- **Minimap** — Changed `innerText` to `textContent` (no layout reflow); wrapped scroll handler with rAF throttling.
- **SplitPreview** — Debounced content update with 200ms timeout.
- **DragDrop** — Cached block positions at drag start; changed `_editorRegistry` from `Map` to `WeakMap` to prevent memory leaks.
- **WordCountPlugin** — Removed redundant MutationObserver; debounced `content:change` handler at 100ms.
- **AutolinkPlugin** — Limited URL search to last 200 characters of text node.
- **CommandRegistry** — Added `skipSnapshot` option so commands can opt out of automatic history snapshots.
- **EventBus** — Added recursion depth counter to prevent infinite error event loops.
- **useAutosave** — Uses ref for `saveStatus` to avoid re-renders on every keystroke.
- **useContextMenu** — Gated scroll listener behind `contextMenu.visible`; extracted stable command handlers.
- **useEditorRect** — Limited scroll listener to editor's scrollable parent.
- **alignment commands** — Removed `getComputedStyle()` calls from `isActive()`; reads inline style only.

### Code Quality

- **Shared utilities** — Extracted `escapeHTML()` and `insertPlainText()` into dedicated utility modules; updated 8+ files to import from shared sources instead of duplicating logic.
- **Tree-shaking** — Replaced `export * from '@remyxjs/core'` in `@remyxjs/react` with explicit named re-exports; added tree-shaking guidance comments to barrel exports.
- **Selection.js** — Removed 6 deprecated `document.queryCommandState()` fallback calls; DOM traversal via `FORMAT_TAG_MAP` covers all format detection.

### Stats

- All 275 tasks resolved (0 open)
- All 1768 tests pass
- 40 performance/quality optimizations implemented

---

## [0.38.0] — 2026-03-20

### Added

- **External configuration loading** — New `loadConfig(url, options)` function in `@remyxjs/core` fetches and parses JSON or YAML editor configs from any URL; lightweight inline YAML parser handles simple key-value/nested/array configs without external dependencies
- **Environment-based config merging** — Config files can include an `env` key with named overrides (e.g., `production`, `development`); `loadConfig(url, { env: 'production' })` deep-merges the environment overrides onto the base config and strips the `env` key from the result
- **`RemyxEditorFromConfig` component** — Fully declarative editor from a URL: `<RemyxEditorFromConfig url="/config.json" />` with loading fallback, error fallback with retry, and prop overrides that take precedence over loaded config values
- **`useExternalConfig` hook** — React hook for loading, caching, and reloading external configs: returns `{ config, loading, error, reload }`; supports `pollInterval` for auto-reloading, `onLoad`/`onError` callbacks, and automatic refetch on URL change; cancels in-flight requests on unmount
- **Custom fetch headers** — `loadConfig` and `useExternalConfig` accept `headers` option for authenticated config endpoints (e.g., `{ Authorization: 'Bearer ...' }`)
- **AbortController support** — `loadConfig` accepts a `signal` option for request cancellation

### Tests

- 15 unit tests for `loadConfig` (JSON parsing, YAML parsing, env merging, deep merge, headers, signal, error handling)
- 8 unit tests for `useExternalConfig` (loading state, error state, reload, env merging, callbacks)

---

## [0.37.0] — 2026-03-19

### Added

- **Spelling & grammar checking** — New `SpellcheckPlugin` with built-in `GrammarEngine` for passive voice detection, wordiness patterns, cliche detection, and punctuation checks; inline red/blue/green underlines (`.rmx-spelling-error`, `.rmx-grammar-error`, `.rmx-style-suggestion`); right-click context menu with correction suggestions, "Ignore", and "Add to Dictionary"; writing-style presets (formal, casual, technical, academic); BCP 47 multi-language support; optional `customService` interface for LanguageTool/Grammarly/custom grammar services; per-session or persistent dictionary via localStorage; `useSpellcheck` React hook; `SpellcheckIcon` (ABC with checkmark); commands: `toggleSpellcheck`, `checkGrammar`, `addToDictionary`, `ignoreWord`, `setWritingStyle`, `getSpellcheckStats`; events: `spellcheck:update`, `spellcheck:correction`, `grammar:check`; added to default toolbar, View menu, and command palette

---

## [0.36.0] — 2026-03-19

### Added

- **Smooth animations** — CSS transitions/animations for modal enter/exit (scale+fade), block reorder (translateY), toolbar button hover/active states, and dropdown open animations via CSS keyframes
- **Empty state component** — Configurable illustrated empty state when editor has no content; enable via `emptyState` prop (boolean or React node); shows SVG illustration + "Start typing..." message
- **Distraction-free mode** — New `distractionFree` command hides toolbar, status bar, and menu bar; chrome reappears on mouse movement (3s timeout to re-hide); toggle via command or `Mod+Shift+D` shortcut; CSS class `.rmx-distraction-free`
- **Breadcrumb bar** — New `BreadcrumbBar` component shows DOM path from editor root to current selection (e.g., "Blockquote > Paragraph" or "Table > Row 2 > Cell 3"); updates on `selection:change`; renders between toolbar and edit area; enable via `breadcrumb` prop
- **Minimap** — New `Minimap` component renders a scaled-down preview of the document on the right edge; click to scroll; updates on `content:change`; enable via `minimap` prop
- **Split view** — New `toggleSplitView` command adds a side-by-side preview pane showing rendered HTML or markdown source; toggle via toolbar button or `Mod+Shift+V`; CSS class `.rmx-split-view`; configure preview format via `splitViewFormat` prop
- **Sticky toolbar** — `position: sticky; top: 0; z-index: 20` on `.rmx-toolbar` so it stays visible when scrolling long documents
- **Drag-and-drop toolbar customization** — `customizableToolbar` prop enables drag-to-rearrange toolbar buttons; order persisted in localStorage; `onToolbarChange` callback fires when order changes
- **Color palette presets** — `saveColorPreset`, `loadColorPresets`, and `deleteColorPreset` commands store named presets in localStorage; "Save Preset" button added to color picker dropdown
- **Typography controls** — New `lineHeight`, `letterSpacing`, `paragraphSpacing` commands in fontControls.js; `TypographyDropdown` component provides toolbar dropdowns for all three; uses inline style wrapping (same pattern as fontSize)
- **New icons** — `DistractionFreeIcon`, `SplitViewIcon` added to the icon map
- **New slash commands** — "Distraction-Free" and "Split View" items added to the command palette

### Changed

- Toolbar now supports `customizableToolbar` and `onToolbarChange` props
- `ToolbarColorPicker` accepts `engine` prop for color preset integration
- `useResolvedConfig` resolves `emptyState`, `breadcrumb`, `minimap`, `splitViewFormat`, `customizableToolbar`, and `onToolbarChange` props

---

## [0.35.0] — 2026-03-19

### Added

- **Real-time collaborative editing** — CRDT-based conflict-free co-editing with `CollaborationPlugin`:
  - Yjs-powered document synchronization with automatic conflict resolution
  - Awareness protocol: live cursors with user names and configurable colors
  - Presence indicators showing who is currently viewing or editing
  - Offline-first: queues changes locally, syncs automatically when reconnected
  - Operation history with per-user attribution
  - Configurable transport: WebSocket (default), WebRTC, or custom transport interface
  - `collaborationProvider` prop — bring your own signaling server or use a hosted option
  - `autoConnect` option for manual connection control
- **`CollaborationBar` component** — Displays connection status (connected/disconnected/connecting/error), peer count, and active user avatars
- **`useCollaboration` hook** — Reactive state for connection status, peer list, `connect()`, and `disconnect()` methods
- **New commands:** `collaborationConnect`, `collaborationDisconnect`, `collaborationGetPeers`, `collaborationGetStatus`
- **New events:** `collaboration:connected`, `collaboration:disconnected`, `collaboration:peer-joined`, `collaboration:peer-left`, `collaboration:sync`, `collaboration:error`

---

## [0.34.0] — 2026-03-19

### Added

- **Toolbar & menu bar integration for all plugins** — Plugin commands now accessible directly from the toolbar and menu bar:
  - New toolbar items: `insertCallout`, `insertMath`, `insertToc`, `insertBookmark`, `insertMergeTag`, `toggleAnalytics` — added to DEFAULT_TOOLBAR and `full` preset
  - New menu bar entries: Insert menu now includes Callout, Math, TOC, Bookmark, Merge Tag; View menu now includes Toggle Analytics
  - SVG icons for all plugin toolbar items: Callout (info circle), Math (f(x)), TOC (indented lines), Bookmark (ribbon), Merge Tag (code brackets), Analytics (bar chart)
  - All new items registered in `TOOLTIP_MAP` with user-friendly labels and in `BUTTON_COMMANDS` for toggle rendering
  - New `rich` toolbar preset: comprehensive layout with all plugin features for document-heavy editors
  - All plugin features configurable via `defineConfig()`, `<RemyxEditor>` props, or `<RemyxConfigProvider>`
- **`toggleAnalytics` command** — Toggle analytics panel visibility from toolbar, View menu, or command palette. Emits `analytics:toggle` event with `{ visible }` for the React layer
- **Command palette expanded** — 30+ built-in items across 6 categories (Text, Lists, Media, Layout, Insert, Advanced). New Insert category includes Callout, Math Equation, Table of Contents, Bookmark, Merge Tag, and Comment. Advanced category adds Toggle Analytics, Toggle Markdown, Fullscreen, and Clear Formatting
- **Unregistered command guard** — Toolbar buttons for plugin commands that aren't loaded show as disabled instead of throwing errors

### Fixed

- **Formula evaluation** — Strip leading `=` before parsing (was treated as comparison operator, causing all formulas to return 0)
- **Formula display** — Round numeric results to 10 decimal places to avoid floating point artifacts (e.g., `249.95` instead of `249.95000000000002`)
- **Formula auto-detection** — TablePlugin now automatically detects cells with `=` prefix text on initialization and adds `data-formula` attribute without requiring manual HTML attributes

### Changed

- **Toolbar deduplication removed** — When both toolbar and menu bar are enabled, the full toolbar is preserved. The menu bar is an additional navigation layer, not a replacement for the toolbar

---

## [0.33.0] — 2026-03-19

### Added

- **Math & Equation Editor** — LaTeX math rendering:
  - `MathPlugin` with `$...$` inline and `$$...$$` block math syntax
  - Pluggable `renderMath(latex, displayMode)` callback — integrate KaTeX, MathJax, or use the built-in styled LaTeX display
  - `getSymbolPalette()` returns 40+ symbols across 4 categories (Greek, Operators, Arrows, Common)
  - Auto equation numbering for block math with `data-equation-number` attributes
  - `latexToMathML()` for basic LaTeX → MathML conversion
  - `parseMathExpressions()` detects inline and block math in text
  - 6 new commands: `insertMath`, `editMath`, `insertSymbol`, `getSymbolPalette`, `getMathElements`, `copyMathAs`
  - 12 new unit tests

- **Table of Contents & Document Outline** — Auto-generated navigation:
  - `TocPlugin` with `buildOutline()` that creates hierarchical tree from H1-H6 elements
  - Section numbering (1, 1.1, 1.2, 2, etc.) via `numbering: true` option
  - `insertToc` command renders `<nav class="rmx-toc">` with nested linked list
  - `scrollToHeading` command with smooth scrolling
  - `validateHeadings` command detects skipped heading levels (H1→H3)
  - `onOutlineChange` callback + `toc:change` event on content changes (debounced 200ms)
  - Auto-assigns IDs to headings via slugification
  - 4 new commands, CSS for TOC nav, outline panel, and print layout
  - 15 new unit tests

- **Content Analytics & Readability** — Real-time content analysis:
  - `AnalyticsPlugin` with `analyzeContent()` returning word/char/sentence/paragraph counts
  - Readability scores: Flesch-Kincaid Grade Level, Flesch Reading Ease, Gunning Fog Index, Coleman-Liau Index
  - Reading time estimate with configurable `wordsPerMinute` (default 200)
  - Vocabulary level: basic (≤6), intermediate (7-12), advanced (13+)
  - Sentence/paragraph length warnings with configurable thresholds
  - Goal-based writing: `targetWordCount` with progress tracking and CSS progress bar
  - SEO analysis: `seoAnalysis()` checks H1 count, heading structure, word count, keyword density
  - `keywordDensity()` reports count, density %, and positions
  - `onAnalytics` callback + `analytics:update` event (debounced 300ms)
  - 3 new commands, 11 exported utility functions
  - 22 new unit tests

- 49 new tests total (1641 across 67 suites)

---

## [0.32.0] — 2026-03-19

### Added

- **Template System & Merge Tags** — Full template engine:
  - `TemplatePlugin` with `{{merge_tag}}` syntax rendered as visual chips (`<span class="rmx-merge-tag">`)
  - `renderTemplate(html, data)` processes `{{variable}}`, `{{#if condition}}...{{/if}}`, and `{{#each items}}...{{/each}}` blocks
  - Live preview mode: `previewTemplate` command renders with sample data in read-only mode; `exitPreview` restores editing
  - 5 pre-built templates: email, invoice, letter, report, newsletter — each with sample data
  - `registerTemplate`/`unregisterTemplate`/`getTemplateLibrary`/`getTemplate` APIs for custom templates
  - `exportTemplate` returns `{ html, tags, sampleData }` for serialization
  - `extractTags(html)` extracts all unique tag names from template content
  - 6 new commands: `insertMergeTag`, `loadTemplate`, `previewTemplate`, `exitPreview`, `exportTemplate`, `getTemplateTags`

- **Keyboard-First Editing** — Vim/Emacs modes and keyboard enhancements:
  - Vim mode (`KeyboardPlugin({ mode: 'vim' })`) with normal/insert/visual modes, h/j/k/l/w/b/0/$/G motions, i/a/o/v mode switches, dd line delete, u undo, x char delete, Escape mode toggle
  - Emacs mode with Ctrl+A/E/F/B/N/P/D/H navigation, Ctrl+K kill-to-line-end with kill ring, Ctrl+Y yank, Ctrl+W kill-word
  - Custom keybinding map: `keyBindings: { 'ctrl+shift+l': 'insertLink' }` with function or command string values
  - Smart auto-pairing for `(`, `[`, `{`, `"`, `'`, `` ` `` — inserts closing pair, wraps selections, skips over existing closers
  - Multi-cursor: `Cmd+D` / `Ctrl+D` selects next occurrence via DOM tree walking
  - Jump-to-heading: `Cmd+Shift+G` emits event; `getHeadings()` / `jumpToHeading` commands
  - 5 new commands, CSS for vim mode indicators

- **Drag-and-Drop Content** — Enhanced drag-and-drop:
  - Drop zone overlays with `rmx-drop-zone-active` inset box-shadow
  - Cross-editor drag via `text/x-remyx-block` data transfer type
  - External file drops: images auto-inserted as base64, `onFileDrop` callback for custom handling
  - Block reorder: left-edge mousedown (30px) enables drag, ghost preview clone, `rmx-drop-indicator` bar at insertion point
  - `moveBlockUp`/`moveBlockDown` commands with `Cmd+Shift+Arrow` shortcuts
  - Events: `dragdrop:reorder`, `dragdrop:crossEditor`, `dragdrop:fileDrop`, `dragdrop:externalDrop`

- **Advanced Link Management** — Link previews, broken link detection, auto-linking, analytics, bookmarks (implemented in prior commit, documented here)

- 41 new unit tests (1592 total across 64 suites)

---

## [0.31.0] — 2026-03-19

### Added

- **Callouts, Alerts & Admonitions** — Styled callout blocks:
  - `CalloutPlugin` with 7 built-in types: info, warning, error, success, tip, note, question — each with unique icon, color, and light/dark theme CSS
  - Custom callout types: `registerCalloutType()`, `unregisterCalloutType()`, `getCalloutTypes()`, `getCalloutType()` APIs for user-defined types with custom icons and colors
  - Collapsible callouts: `collapsible: true` option on `insertCallout`, `toggleCalloutCollapse` command, ▶/▼ toggle button, `data-callout-collapsible`/`data-callout-collapsed` attributes
  - Nested content: callout body accepts any block-level content (lists, code blocks, images, tables)
  - GitHub-flavored alert syntax: auto-converts `> [!NOTE]`, `> [!WARNING]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!CAUTION]` blockquotes to callout blocks on paste/edit (debounced 300ms)
  - DOM structure: `<div class="rmx-callout rmx-callout-{type}">` with header (icon + title + optional toggle) and editable body
  - 4 new commands: `insertCallout`, `removeCallout`, `changeCalloutType`, `toggleCalloutCollapse`
  - New exports: `CalloutPlugin`, `registerCalloutType`, `unregisterCalloutType`, `getCalloutTypes`, `getCalloutType`, `parseGFMAlert` from `@remyxjs/core`
  - CSS: `callouts.css` with per-type custom properties, dark theme overrides, print-friendly output
  - 30 new unit tests (1526 total)

- **Expanded Plugin Architecture** — Major upgrade to the plugin system:
  - **Lifecycle hooks**: `onContentChange` and `onSelectionChange` callbacks auto-wired to engine events during plugin initialization, sandboxed with try/catch error isolation
  - **Dependency resolution**: `dependencies: ['otherPlugin']` in plugin definitions triggers topological sort (Kahn's algorithm) during `initAll()`. Circular dependencies detected, reported via `plugin:circularDependency` event, and still initialized. `activatePlugin()` recursively initializes dependencies for lazy plugins.
  - **Scoped plugin settings**: `settingsSchema` with type validation (string/number/boolean/select), custom `validate()` functions, and `defaultSettings`. Accessible via `getSetting`/`setSetting` on the restricted API, or `getPluginSetting`/`setPluginSetting`/`getPluginSettings` on the manager. Emits `plugin:settingChanged` events.
  - **Plugin registry**: Global discovery system with `registerPluginInRegistry()`, `unregisterPluginFromRegistry()`, `listRegisteredPlugins()`, and `searchPluginRegistry(query)`. Entries include name, version, description, author, tags, and optional factory function.
  - **Enhanced sandboxing**: All lifecycle callbacks (`init`, `destroy`, `onContentChange`, `onSelectionChange`) wrapped in try/catch. Errors emitted as `plugin:error` events with `{ name, error, hook }` payload. A failing plugin cannot crash the editor or other plugins.
  - **Plugin metadata**: `version`, `description`, `author` fields on `createPlugin()` for registry/marketplace discovery
  - New exports: `registerPluginInRegistry`, `unregisterPluginFromRegistry`, `listRegisteredPlugins`, `searchPluginRegistry` from `@remyxjs/core`
  - 32 new unit tests (1496 total)

---

## [0.30.0] — 2026-03-19

### Added

- **Comments & Annotations** — Full inline comment thread system:
  - `CommentsPlugin` for `@remyxjs/core` — wraps selected text in `<mark class="rmx-comment">` elements, maintains in-memory thread store with create/edit/reply/resolve/delete lifecycle
  - `CommentsPanel` React component — sidebar displaying all threads with thread cards, reply input, resolve/reopen/delete actions, @mention highlighting, relative timestamps, and open/resolved/all filter
  - `useComments` React hook — reactive thread state, convenience methods (`addComment`, `deleteComment`, `resolveComment`, `replyToComment`, `editComment`, `navigateToComment`), import/export, active thread tracking
  - @mention parsing — `parseMentions()` extracts `@username` references from comment text; `mentionUsers` option provides a configurable user list
  - Comment-only mode — `commentOnly: true` sets `contenteditable="false"` so users can annotate but not edit content
  - Persistence callbacks — `onComment`, `onResolve`, `onDelete`, `onReply` for server-side integration
  - Import/export — `importThreads()` and `exportThreads()` for serialization; auto-scans existing `data-comment-id` marks on init
  - DOM sync — MutationObserver detects when annotated text is deleted and removes orphaned threads
  - 8 engine events: `comment:created`, `comment:resolved`, `comment:deleted`, `comment:replied`, `comment:updated`, `comment:clicked`, `comment:navigated`, `comment:imported`
  - 6 new commands: `addComment`, `deleteComment`, `resolveComment`, `replyToComment`, `editComment`, `navigateToComment`
  - Context menu: "Add Comment" appears when text is selected
  - CSS: `comments.css` with amber highlight for open comments, muted gray for resolved, dark theme support, print-friendly output
  - New exports: `CommentsPlugin`, `parseMentions` from `@remyxjs/core`; `CommentsPanel`, `useComments` from `@remyxjs/react`
  - 28 new unit tests (1469 total)

---

## [0.29.0] — 2026-03-19

### Added

- **Command Palette Enhancements** — Recently-used commands and custom command registration:
  - Last 5 executed commands are tracked in `localStorage` and pinned to the top of the palette under a "Recent" category when no search query is active
  - `getRecentCommands()`, `recordRecentCommand()`, `clearRecentCommands()` exported from `@remyxjs/core`
  - `registerCommandItems()` and `unregisterCommandItem()` APIs for adding custom entries to the palette from plugins or application code
  - `getCustomCommandItems()` to retrieve all registered custom items
  - Custom items are deduplicated by `id` — re-registering replaces the previous item
  - Both the command palette (Mod+Shift+P) and inline slash menu (Mod+/) track recent usage
  - 25 new unit tests covering recently-used tracking, custom item registration, and filter behavior
- **Block-Based Editing** — Complete block-level editing system:
  - `BlockToolbar` component with block type badge dropdown, actions menu (Move Up/Down, Duplicate, Delete, Convert To…), rAF-based positioning on hover/focus
  - `convertBlock` command supporting conversion between paragraph, h1–h6, blockquote, codeBlock, unorderedList, and orderedList while preserving text content
  - Block operations: `moveBlockUp`, `moveBlockDown`, `duplicateBlock`, `deleteBlock` (with safety — ensures at least one paragraph remains)
  - Block selection: `selectBlocks`, `clearBlockSelection` with `rmx-block-selected` visual outlines
  - Collapsible sections: `toggleCollapse` wraps/unwraps blocks in `<details><summary>` with CSS open/closed indicators
  - Block grouping: `groupBlocks`, `ungroupBlocks`, `moveGroup`, `duplicateGroup` with `rmx-block-group` dashed border styling
  - `BlockTemplatePlugin` with `registerTemplate`, `insertTemplate`, `getTemplates`, `removeTemplate` APIs; 3 built-in templates (Feature Card, Two-Column, Call to Action)
  - New exports: `registerBlockConvertCommands`, `BlockTemplatePlugin` from `@remyxjs/core`
- **Mobile & Touch Optimization** — Full touch-device support:
  - Touch-aware `FloatingToolbar` with `touchend` + `selectionchange` detection (300ms delay), above/below positioning, draggable grip handle for repositioning, 44×44px touch targets
  - `useSwipeGesture` hook — swipe right/left on list items and blockquotes for indent/outdent (50px threshold, 30px max vertical deviation, visual translateX feedback); swipe-down dismisses toolbar
  - `useLongPress` hook — 500ms hold triggers context menu at touch position, 10px movement cancellation, `navigator.vibrate(10)` haptic feedback
  - `usePinchZoom` hook — two-finger pinch on `<img>` and `<table>` elements with CSS `transform: scale()` (0.5–3.0 range), applies final dimensions on release, reset-zoom button
  - Responsive toolbar overflow — `ResizeObserver`-based detection collapses trailing items into "⋯" dropdown menu
  - `useVirtualKeyboard` hook — detects virtual keyboard via `visualViewport` API (with `window.innerHeight` fallback), adds padding and scrolls caret into view above keyboard
  - Touch-friendly `BlockDragHandle` — pointer events replacing mouse events, 44×44px hit targets via `@media (pointer: coarse)`, touch drag with `setPointerCapture` and ghost preview
  - CSS: `@media (pointer: coarse)` rules for drag handles, 44px min touch targets for toolbar/context menu/floating toolbar
- **WorkerPool** — Optional Web Worker pool for offloading expensive operations (sanitization, markdown parsing, document conversion) to background threads. Round-robin dispatch, lazy worker spawning, synchronous fallback.
- **VirtualScroller** — IntersectionObserver-based virtualized rendering for long documents (200+ blocks), collapses off-screen blocks to placeholder divs with 500px root margin pre-loading.
- **Compressed undo history** — Character-level diff storage for documents over 5000 chars, reducing memory usage by storing only changed portions instead of full HTML snapshots.
- **Lazy plugin loading** — Plugins with `lazy: true` skip `initAll()` and initialize on first command execution. `activatePlugin(name)` and `isInitialized(name)` APIs on `PluginManager`.
- **Input batcher** — `createInputBatcher()` utility coalescing rapid DOM mutations into single `requestAnimationFrame` callbacks.
- **Bundle size CI gate** — CI pipeline checks gzipped sizes of `remyx-core.js` (50KB) and `remyx-react.js` (30KB), failing the build on exceed.
- **Automated npm publishing** — `release.yml` GitHub Actions workflow triggered on `v*` tag push via `npx nx release publish`.

---

## [0.28.0] — 2026-03-19

### Added

- **WorkerPool** — Optional Web Worker pool (`WorkerPool` class) for offloading expensive operations (sanitization, markdown parsing, document conversion) to background threads. Round-robin dispatch, lazy worker spawning, synchronous fallback when Workers are unavailable. New export: `WorkerPool` from `@remyxjs/core`.
- **VirtualScroller** — IntersectionObserver-based virtualized rendering for long documents. Collapses off-screen block elements to placeholder divs for documents exceeding a configurable threshold (default 200 blocks), with 500px root margin for pre-loading. New export: `VirtualScroller` from `@remyxjs/core`.
- **Compressed undo history** — Character-level diff storage for documents over 5000 chars. `computeDiff()` finds common prefix/suffix and stores only the changed middle; `applyDiff()` reconstructs full HTML. Short documents retain full-snapshot behavior.
- **Lazy plugin loading** — Plugins with `lazy: true` skip `initAll()` and initialize on first command execution. New `activatePlugin(name)` and `isInitialized(name)` methods on `PluginManager`.
- **Input batcher** — `createInputBatcher()` utility coalescing rapid DOM mutations into single `requestAnimationFrame` callbacks with `queue()`, `flush()`, and `destroy()` methods.
- **Bundle size CI gate** — CI pipeline checks gzipped sizes of `remyx-core.js` (50KB limit) and `remyx-react.js` (30KB limit), failing the build on exceed.
- **Automated npm publishing** — `release.yml` GitHub Actions workflow triggered on `v*` tag push, runs `npx nx release publish --yes` with `NODE_AUTH_TOKEN`.
- **Enhanced tables & spreadsheet features** — New `TablePlugin` built-in plugin providing column/row resize handles (drag-to-resize with rAF-driven smooth updates), sortable columns (click header to toggle asc/desc, Shift+click for multi-column sort with chained comparators), filterable rows (per-column filter dropdowns with debounced substring matching, non-destructive via `rmx-row-hidden` class), inline cell formulas (recursive-descent parser supporting SUM, AVERAGE, COUNT, MIN, MAX, IF, CONCAT with A1-notation cell references and circular reference detection), cell formatting (number, currency, percentage, date via `Intl.NumberFormat`/`Intl.DateTimeFormat`), sticky header rows (`position: sticky` on `<thead><th>`), and table-aware clipboard (copy as HTML + TSV, paste from Excel/Google Sheets with auto-expand). Tables now generate `<thead>` with `<th>` cells by default. Google Sheets and Excel HTML cleanup added to paste pipeline. 6 new commands: `toggleHeaderRow`, `sortTable`, `filterTable`, `clearTableFilters`, `formatCell`, `evaluateFormulas`. Sort indicators rendered via CSS `::after` pseudo-elements (▲/▼). New context menu items: Toggle Header Row, Format as Number/Currency/Percentage/Date, Clear Filters. New exports: `TablePlugin`, `evaluateTableFormulas` from `@remyxjs/core`.
- **Code block syntax highlighting** — Language-specific syntax highlighting for `<pre><code>` blocks using custom lightweight tokenizers (zero external dependencies). Supports 11 languages: JavaScript/TypeScript, Python, CSS, SQL, JSON, Bash, Rust, Go, Java, and HTML with automatic language detection. New `SyntaxHighlightPlugin` built-in plugin with MutationObserver-based auto-highlighting, debounced to avoid disrupting contenteditable typing. Skips blocks the user is actively editing and re-highlights on blur. Theme-aware token colors via `.rmx-syn-*` CSS classes across all 6 themes. New `setCodeLanguage` and `getCodeLanguage` commands. Language selector dropdown overlay on focused code blocks in `@remyxjs/react`. Markdown round-trip preserves language identifiers (`` ```js ``, `` ```python ``). New exports: `SyntaxHighlightPlugin`, `SUPPORTED_LANGUAGES`, `LANGUAGE_MAP`, `detectLanguage`, `tokenize` from `@remyxjs/core`.
- **EditorBus** — Process-wide singleton for inter-editor communication. Register/unregister editors by ID, pub/sub for global events, `broadcast()` to push events into every editor's local event loop, exclude option for the sender. New export: `EditorBus` from `@remyxjs/core`.
- **SharedResources** — Lazily-initialized singleton providing deeply-frozen copies of sanitizer schema, toolbar presets, defaults, keybindings, and command metadata for memory-efficient multi-editor pages. Shared icon registry via `registerIcon()`/`getIcon()`. New export: `SharedResources` from `@remyxjs/core`.
- **Tooltip component** — Styled tooltip (`Tooltip.jsx`) replaces native `title` attributes on toolbar buttons, showing command name + keyboard shortcut (e.g., "Bold — ⌘B") with 200ms hover delay.
- **ContextMenu keyboard navigation** — ArrowUp/Down, Home/End, Enter to execute, Escape to close. `role="menu"` and `role="menuitem"` attributes for accessibility.
- **FloatingToolbar keyboard navigation** — Arrow-key navigation between buttons, `:focus-visible` rings, `role="toolbar"`, focus state tracking to keep toolbar visible during interaction.
- **Loading spinners in modals** — ImageModal, AttachmentModal, and ImportDocumentModal show spinner and disabled button during async file upload/conversion.
- **Table delete confirmation** — `window.confirm()` before "Delete Table" in TableControls.
- **Unsaved changes indicator** — StatusBar shows "Edited" dot when content changes and autosave is not enabled.
- **Text highlight command** — New `highlight` command wrapping selected text in `<mark>` with 6 color options (yellow, green, blue, pink, orange, purple). Togglable.
- **Table cell alignment** — New `alignCell` command setting `text-align` on `<td>`/`<th>` elements.
- **Image alt-text editing** — Inline alt-text editing overlay on focused images in ImageResizeHandles.
- **Embed modal URL preview** — Live iframe preview with 500ms debounce for YouTube/Vimeo/Dailymotion URLs in EmbedModal.
- **Max list nesting depth** — Configurable `maxListNestingDepth` (default 5) with CSS per-level bullet styles (disc/circle/square for UL, decimal/lower-alpha/lower-roman for OL).
- **`removeFormat` keyboard shortcut** — Added `mod+\` to the existing `removeFormat` command.
- **Alternate shortcuts for subscript/superscript** — `mod+shift+,` and `mod+shift+.` as cross-platform fallbacks. `alternateShortcuts` support added to `CommandRegistry`.
- **RTL support** — Automatic text direction detection, per-block `dir` attribute, CSS logical properties.
- **i18n** — 120+ externalized strings, `t()` with interpolation, `registerLocale()`, partial locale packs with English fallback.
- **Print stylesheet** — Clean printed output with hidden chrome, page-break control, link URLs, orphan/widow handling.
- **Performance utilities** — DOM mutation batching, `requestIdleCallback` scheduling, rAF-throttled handlers, operation coalescing in undo/redo, benchmarking tools.
- **Source mode sanitization notification** — `SourceModal` now emits a `source:sanitized` event when the sanitizer strips unsafe content from user-edited HTML, so consumers can surface a warning.
- **SelectionContext** — New `SelectionContext` and `useSelectionContext()` hook in `@remyxjs/react`. Replaces prop drilling of `selectionState` through 6+ child components. Selection state is now split into `formatState` and `uiState` sub-objects for granular re-render control.
- **Sanitizer LRU cache** — `Sanitizer.sanitize()` now caches up to 50 recent results by HTML string key, avoiding redundant DOMParser/tree-walk cycles on identical content (e.g., undo/redo).
- **History snapshot hashing** — `History._takeSnapshot()` now computes a lightweight djb2 hash before comparing full normalized strings, reducing garbage from frequent `===` on long HTML.
- **Selection range caching** — `Selection.getRange()` caches `window.getSelection()`/`getRangeAt(0)` in `_cachedRange`, invalidated per selection change cycle, eliminating redundant calls from chained methods.
- **EventBus keyed handlers** — `EventBus.on()` now accepts an optional `{ key }` option. When a key is provided, any existing handler with the same key is replaced, preventing logical duplicates from re-renders.
- **EventBus error propagation** — `EventBus.emit()` now emits an `error` event (with recursion guard) when a handler throws, in addition to the existing `console.error`.
- **DragDrop `isDragging()` method** — New public API method returning `!!this._dragSource`, replacing direct access to the private `_dragSource` property.
- **Autosave deduplication** — Module-level `_managerRegistry` Map in `AutosaveManager` prevents duplicate managers for the same storage key across multiple editor instances.
- **FileReader progress events** — `DragDrop` and `Clipboard` now emit `upload:progress` events via EventBus with `{ loaded, total, percent }` during FileReader-based image drops.
- **PropTypes on all modals and ContextMenu** — Added `prop-types` as a devDependency and PropTypes declarations to all 9 modal components and the ContextMenu component.
- **Per-theme CSS exports** — Individual theme CSS files are now available as sub-path imports: `@remyxjs/core/themes/dark.css`, `@remyxjs/core/themes/ocean.css`, etc. The aggregate `@remyxjs/core/style.css` remains for backward compatibility.
- **XSS test coverage for modals** — New `modal-xss.test.jsx` with tests verifying `javascript:` URL rejection, percent-encoded bypass prevention, and SVG data URI blocking across all modal URL validators.
- **React hook test coverage** — New `hooks.test.jsx` covering previously untested hooks.
- **React component test coverage** — New `components.test.jsx` with rendering tests for previously untested components.

### Removed

- **Playwright e2e test suite** — Removed `playwright.config.js`, `e2e/` directory (8 spec files), and `@playwright/test` dependency. The root repo does not serve a production web server; e2e tests will be revisited when needed.
- **Duplicate config files in `packages/`** — Removed `babel.config.js`, `eslint.config.js`, `jest.config.js`, and `tsconfig.json` from `packages/`. All tooling (lint, test, typecheck) now runs from the repo root only.
- **Redundant `packages/` devDependencies** — Stripped `packages/package.json` to only Nx and build/release scripts. Testing, linting, and type-checking deps live at the repo root.
- **Jest test framework** — Replaced Jest + babel-jest + jest-environment-jsdom with Vitest. Removed `jest.config.js`, `babel.config.js`, and all Jest dependencies. All 52 test files migrated to Vitest APIs (`vi.fn()`, `vi.spyOn()`, etc.).
- **Deprecated `create-remyx` bin entry** — Removed the `"bin"` field from `create-remyx/package.json` since the package is reserved for a future CLI wizard.

### Changed

- **CONTRIBUTING.md** — Updated development workflow to clarify that lint, test, and typecheck commands run from the repo root, while build commands run from `packages/`.
- **Test framework migrated to Vitest** — All 52 test files (1314 tests) now use Vitest with `vitest.config.js` at the root. Test scripts updated: `npm test` runs `vitest run`, `npm run test:watch` runs `vitest`, `npm run test:coverage` runs `vitest run --coverage`.
- **`useSelection` returns split state** — Returns `{ formatState, uiState }` instead of a flat spread, enabling granular consumer subscriptions via `SelectionContext`.
- **`useResolvedConfig` return memoized** — The return object is now wrapped in `useMemo` to prevent unnecessary child re-renders.
- **`RemyxConfigProvider` context value stabilized** — Context value is now wrapped in `useMemo` to prevent full-tree re-renders when the parent re-renders.
- **MenuBar and ContextMenu lazy-loaded** — Converted from eager imports to `React.lazy()` + `Suspense`, matching the existing lazy-loading pattern used for modals.
- **CodeEditor highlighting debounced** — Syntax highlighting in `CodeEditor` is now debounced by 150ms to avoid re-tokenizing on every keystroke.
- **TablePickerModal uses event delegation** — Replaced 100 individual cell `onMouseEnter`/`onClick` handlers with event delegation on the grid container using `data-row`/`data-col` attributes.
- **StatusBar shallow comparison** — `wordcount:update` handler now compares values before calling `setCounts` to avoid unnecessary re-renders.
- **`useEditorRect` deps simplified** — Removed `ready` from `useEffect` dependency array; uses early return guard instead.
- **AutolinkPlugin combined regex** — Three separate regex passes consolidated into a single combined regex with alternation groups.
- **Autosave init blocked until recovery** — `manager.init()` now runs inside the recovery check's `.then()` callback, preventing autosave from overwriting recoverable content.
- **CLI reads versions dynamically** — `create-remyx-app` reads version strings and dependency versions from its own `package.json` instead of hardcoding them.
- **CLI `copyDir` error handling** — File copy operations are now wrapped in try-catch with descriptive error messages including the file path.
- **CLI theme injection narrowed** — `theme="light"` replacement uses regex with JSX attribute lookahead (`/theme="light"(?=[\s/>])/`) and skips when theme is `light`.
- **FloatingToolbar magic numbers extracted** — Positioning constants (`TOOLBAR_FALLBACK_HEIGHT`, `TOOLBAR_FALLBACK_WIDTH`, `TOOLBAR_GAP`, `TOOLBAR_EDGE_PADDING`) extracted to named constants.
- **CodeEditor tab insertion modernized** — Replaced deprecated `document.execCommand('insertText')` with `textarea.setRangeText()` for Tab key handling.
- **FindReplace O(n²) fixed** — `matches.unshift(mark)` replaced with `matches.push(mark)` + `matches.reverse()` after the loop.
- **Table cell merge optimized** — `firstCell.innerHTML += '<br>' + cell.innerHTML` per-iteration concatenation replaced with fragment collection and single join.
- **CSS containment** — Added `contain: layout style;` to `.rmx-editor` for faster style recalculation.
- **Vite optimizeDeps** — Root `vite.config.js` now includes `optimizeDeps.include` for `react`, `react-dom`, `marked`, `turndown`, `turndown-plugin-gfm`.
- **TypeScript declarations updated** — Added `baseHeadingLevel`, `onError`, `errorFallback` to `RemyxEditorProps`; added `useModal`, `useSelection`, `useContextMenu`, `useSelectionContext` hook exports.
- **PropTypes on all components** — Added PropTypes to ToolbarButton, ToolbarDropdown, ToolbarColorPicker, ToolbarSeparator, SaveStatus, RecoveryBanner, FloatingToolbar, EditArea, ModalOverlay.
- **TableControls accessible labels** — Replaced cryptic "+Row↑", "×" with descriptive text and `aria-label` attributes.
- **Icons Fast Refresh** — Extracted `icon()` and `filled()` helpers to `icons/helpers.jsx` for React Fast Refresh compatibility.
- **CI pipeline expanded** — Added `npm run typecheck` and `npm run test:coverage` steps to GitHub Actions CI.
- **Vitest coverage thresholds** — Added minimum thresholds (60% lines/functions/statements, 50% branches).
- **Node.js engine requirement** — Added `"engines": { "node": ">=18.0.0", "npm": ">=9.0.0" }` to root package.json and `.nvmrc` with `22`.
- **CSRF documentation** — Added CSRF protection best-practices JSDoc to CloudProvider constructor.
- **AutosaveManager JSDoc** — Enhanced documentation on `init()`, `save()`, `checkRecovery()`, `clearRecovery()`, `destroy()`.

### Fixed

- **External SVG URL insertion** — `insertImage` command now blocks `.svg` URLs (not just `data:image/svg` URIs) to prevent CSS-based attacks via external SVGs.
- **CloudProvider endpoint URL injection** — `CloudProvider` constructor validates endpoint URL protocol (http/https only) to prevent injection via user-supplied strings.
- **SourceModal XSS** — User-edited HTML in source mode is now re-sanitized via `engine.sanitizer.sanitize()` before applying to the editor.
- **Percent-encoded protocol bypass** — `LinkModal`, `EmbedModal`, and `AttachmentModal` now `decodeURIComponent()` URLs before protocol validation, preventing bypasses like `java%73cript:`.
- **Async file upload race condition** — Image and file drops in `DragDrop` (and non-image file pastes in `Clipboard`) are now serialized via promise chains to prevent interleaved insertion.
- **Export PDF iframe sandbox** — PDF export iframe now has `sandbox="allow-same-origin allow-modals"` to restrict script execution.
- **Markdown URL validation** — Replaced regex-based `SAFE_URL_PROTOCOL` test with `URL` constructor + protocol allowlist (`http:`, `https:`, `mailto:`, `tel:`), also decoding percent-encoded input.
- **CodeBlockControls duplicate listeners** — Added `codeBlock` to outside-click `useEffect` deps and reset dropdown state on block change.
- **ImageResizeHandles touch support** — Replaced `mouse*` events with `pointer*` events and `setPointerCapture` for cross-device resize support.
- **AutosaveManager infinite retry** — Save retries now use exponential backoff (1s–30s) and cap at 5 consecutive failures, emitting a fatal `autosave:error` event when exceeded.
- **`useAutosave` unhandled rejection** — `checkRecovery()` promise now has a `.catch()` handler to prevent unhandled promise rejections.
- **ContextMenu command error** — `item.command()` callbacks are now wrapped in try-catch to prevent uncaught errors from breaking the menu.
- **FindReplace stale mark references** — Added `pruneStaleMatches()` that filters by `isConnected` before highlight, replace, and replaceAll operations.
- **Export iframe double-cleanup** — PDF export now uses a shared `cleaned` guard to prevent the `onafterprint` and timeout callbacks from racing to remove the iframe.
- **Modal error handling consistency** — `TablePickerModal` and `FindReplacePanel` now have try-catch + error state matching the pattern used by other modals.
- **PDF export sanitizer per-call instantiation** — `exportAsPDF` now uses a module-level `Sanitizer` singleton instead of creating a new instance per call.
- **Selection cache invalidation** — `_cacheGeneration` counter now correctly invalidates cached range via microtask comparison.
- **Slash commands destroy cleanup** — Replaced monkey-patched `engine.destroy` with `engine.eventBus.on('destroy', cleanup)` pattern; EditorEngine now emits `destroy` event.
- **Cut handler history snapshot** — `_handleCut()` now calls `history.snapshot()` before the async `setTimeout` to capture correct undo state.
- **usePortalAttachment HTML preservation** — Restores `innerHTML` instead of `textContent` when cleaning up non-form-element portals.
- **useSlashCommands cascading renders** — Moved `setSelectedIndex(0)` from separate `useEffect` into `slash:query` event handler.
- **vitest.config.js ESM compatibility** — Replaced `__dirname` with `fileURLToPath(import.meta.url)` polyfill.
- **React version alignment** — Updated `remyx-react` devDeps to `^19.2.0` to match root package.json.
- **CloudProvider buildUrl validation** — Callback-returned URLs now validated for http/https protocol via `validateUrl()` helper.
- **Pasted @font-face stripping** — `cleanPastedHTML()` now removes `@font-face` declarations that could contain tracking URLs.
- **WordCountPlugin listener leak** — `content:change` listener now properly unsubscribed in `destroy()`.
- **Duplicate _exceedsMaxFileSize** — Extracted to shared `utils/fileValidation.js` utility used by both Clipboard and DragDrop.
- **Format detection via DOM traversal** — `getActiveFormats()` uses pre-compiled `FORMAT_TAG_MAP` with Set lookups instead of deprecated `queryCommandState`.
- **Tokenizer keyword matching** — Replaced regex alternation with Set-based `keywordMatcher()` lookups for JS, Python, SQL, Rust, Java.
- **DOMParser reuse** — Hoisted to module scope in `pasteClean.js` for reuse across calls.
- **MenuBar duplicate import** — Extracted `collectMenuBarCommands` to standalone module, eliminating static+dynamic import conflict.

### Security

- **Pinned runtime dependencies** — `marked`, `turndown`, and `turndown-plugin-gfm` in `@remyxjs/core` are now pinned to exact versions (no `^` ranges) to prevent unvetted patch updates.
- **CSRF documentation** — CloudProvider constructor JSDoc now includes CSRF token best practices for session-based authentication.

---

## [0.27.0] — 2026-03-16

### Added

- **Unified theme system** — All 6 themes (`light`, `dark`, `ocean`, `forest`, `sunset`, `rose`) are now first-class CSS class themes set via a single `theme` prop. Previously `ocean`/`forest`/`sunset`/`rose` required the separate `customTheme` prop with inline CSS variable objects; they are now self-contained `.rmx-theme-{name}` stylesheets matching the `dark.css` pattern. Each theme file includes complete variable overrides, content styles (code blocks, blockquotes, tables, find highlights, links, images), code editor colors, and syntax token palettes. The `customTheme` prop remains available for per-instance overrides on top of any theme.
- **Theme CSS files** — New `ocean.css`, `forest.css`, `sunset.css`, `rose.css` in `@remyxjs/core/src/themes/`.
- **CLI theme selection** — `create-remyx-app` now prompts users to choose a theme (Light, Dark, Ocean, Forest, Sunset, Rose) during project scaffolding. The selected theme is injected into the generated `App.jsx`/`App.tsx`.

### Changed

- **`theme` prop type expanded** — Updated TypeScript declarations from `'light' | 'dark'` to `'light' | 'dark' | 'ocean' | 'forest' | 'sunset' | 'rose' | (string & {})` across all 3 type locations.
- **`THEME_PRESETS` docs updated** — JSDoc now recommends `theme="ocean"` over `customTheme={THEME_PRESETS.ocean}`.
- **READMEs updated** — `packages/README.md`, `packages/remyx-core/README.md`, and `packages/remyx-react/README.md` reflect the unified theme prop and list all 6 built-in themes.

### Fixed

- **Autosave timing reactivity** — `useAutosave` hook now includes `configKey`, `configInterval`, `configDebounce`, and `configProvider` in its `useEffect` dependency array, so runtime changes to autosave timing props take effect without remounting.
- **Clipboard multi-file race condition** — Serialized async `convertDocument` calls with a promise chain to prevent interleaved `insertHTML` when pasting multiple document files.
- **`splitCell` wrong column in multi-row tables** — Pre-compute visual column index once from the original row and walk subsequent rows with a colSpan-aware accumulator to find the correct insertion point.
- **`useAutosave` stale `onRecover` closure** — Replaced closure capture with a `useRef` so the latest `onRecover` callback is always called, even if the parent re-renders.
- **History stale snapshot comparison** — Normalize whitespace before comparing snapshots to catch browser-induced `&nbsp;` ↔ space changes that produce visually identical content.
- **`useRemyxEditor` form submit listener leak** — Store `form` and `syncToTextarea` in refs so cleanup always removes the listener, even if the DOM is removed before React unmount.

---

## [0.26.0] — 2026-03-16

### Added

- **Autosave** — Pluggable autosave system with debounced (2s) and periodic (30s) saves, content deduplication, crash-recovery banner, and save-status indicator in the status bar. Five built-in storage providers: `LocalStorageProvider` (default), `SessionStorageProvider`, `FileSystemProvider` (Node/Electron/Tauri), `CloudProvider` (AWS S3, GCP, any HTTP endpoint with retry and presigned URL support), and `CustomProvider`. New `AutosaveManager` class and `createStorageProvider()` factory in `@remyxjs/core`. New `useAutosave` hook, `SaveStatus` component, and `RecoveryBanner` component in `@remyxjs/react`. New `autosave` prop on `RemyxEditor` (boolean or config object, default `false`). Events: `autosave:saving`, `autosave:saved`, `autosave:error`, `autosave:recovered`. Full TypeScript declarations.
- **Autosave tests** — 40 new tests across 3 files: `providers.test.js` (25 tests), `AutosaveManager.test.js` (15 tests), `useAutosave.test.jsx` (8 tests).

---

## [0.25.0] — 2026-03-16

### Added

- **Command Palette** — Searchable overlay listing all editor commands, organized by category (Text, Lists, Media, Layout, Advanced). Open via `Mod+Shift+P` keyboard shortcut or the new `commandPalette` toolbar button. Supports fuzzy search across labels, descriptions, and keywords. Includes `SLASH_COMMAND_ITEMS` catalog (19 built-in commands) and `filterSlashItems()` utility exported from `@remyxjs/core`. New `commandPalette` prop on `RemyxEditor` (default `true`).
- **Comprehensive Jest test suite** — 42 test files with 815 tests covering core engine, commands (16 modules), plugins (4), utilities (5), React hooks (4), React components (2), and config provider (1). Migrated from Vitest to Jest for consistent tooling.
- **Playwright e2e test suite** — 8 spec files covering editor basics, formatting, toolbar, keyboard shortcuts, themes, accessibility, fullscreen, and modals. *(Removed in a later release — see [Unreleased].)*
- **Unit test coverage** — Statements 82.85%, Branches 74.11%, Functions 77.41%, Lines 85.21% (up from ~67%).
- **Coverage HTML reports** — Unit coverage at `coverage/unit/index.html`.
- **New test scripts** — `npm test`, `npm run test:watch`, `npm run test:coverage`.
- **BENCHMARK.md** — Performance benchmark document covering build times, bundle sizes, test speed, lint speed, code-split chunk inventory, and improvement opportunities.

### Changed

- **Scaffolding moved to `@remyxjs/react`** — Project scaffolding CLI relocated from `create-remyx` to `@remyxjs/react/create/` and renamed to `create-remyx-app` (`npx create-remyx-app`). The `create-remyx` package is now reserved for a future interactive CLI wizard.
- **`create-remyx` repurposed** — Gutted scaffolding code; package now displays a redirect message. Will become an interactive editor configuration wizard (see ROADMAP.md).
- **Test runner migrated from Vitest to Jest** — All existing tests converted from `vi.*` to `jest.*` API. Added `jest.config.js` and `babel.config.js` for JSX transform and module resolution.
- **CONTRIBUTING.md updated** — Testing section now documents Jest workflows, test structure, and writing guidelines.
- **History test fix** — Corrected undo test assertion that expected wrong state after single undo step.
- **Root package.json version** — Updated from 0.23.0 to 0.24.0 to match all sub-packages.
- **`@remyxjs/react` peerDependencies** — `@remyxjs/core` constraint updated from `>=0.23.4` to `>=0.24.0`.

### Security

- **Audit fixes (commit 08d7117)** — Fixed 6 bugs, 26 security issues, 15 cleanup items, and 4 optimizations documented in TASKS.md.

---

## [@remyxjs/react 0.24.0] — 2026-03-15

### Added

- **ErrorBoundary** — `EditorErrorBoundary` component wraps the editor; accepts `onError` and `errorFallback` props.
- **`onError` callback prop** — Wired to engine events: `plugin:error`, `editor:error`, `upload:error`.
- **`baseHeadingLevel` prop** — Offsets heading levels to fit the host page's heading hierarchy (e.g., `baseHeadingLevel={2}` renders H1 as `<h2>`).
- **Skip navigation link** — Visually-hidden "Skip to editor content" link at the top of the editor for keyboard users.
- **Focus trapping in modals** — Tab/Shift+Tab cycles within open modals; focus restored on close.
- **WAI-ARIA menu pattern** — Full `role="menubar"`, `role="menu"`, `role="menuitem"`, arrow key navigation with Home/End support.
- **CONTRIBUTING.md** — Comprehensive contributing guide covering setup, architecture, plugins, commands, and PR process.

### Changed

- **Command registration refactored** — Repetitive `registerXCommands(engine)` calls replaced with `COMMAND_REGISTRARS` loop in `useEditorEngine` and `useRemyxEditor`.
- **Static inline styles to CSS classes** — `StatusBar`, `ImportDocumentModal` inline styles moved to `.rmx-*` CSS classes.
- **`eslint-disable` comments documented** — All 3 suppressed dependency warnings investigated and annotated as intentional (ref-based stable callback pattern).

---

## [@remyxjs/core 0.24.0] — 2026-03-15

### Added

- **Vitest test suite** — 8 test files covering EditorEngine, EventBus, CommandRegistry, History, Sanitizer, PluginManager, Selection, and utilities.
- **JSDoc type annotations** — Comprehensive `@param`/`@returns`/`@typedef` annotations on all core modules (EditorEngine, Selection, EventBus, CommandRegistry, History, Sanitizer, PluginManager, createPlugin).
- **`tsconfig.json`** — Root TypeScript config with `checkJs: true` for IDE type checking; `npm run typecheck` script.
- **Bundle analysis** — `rollup-plugin-visualizer` (conditional via `ANALYZE` env var); `npm run analyze:core`/`analyze:react` scripts.
- **`editor:error` event** — `init()` emits `{ phase, error }` on failure.
- **`plugin:error` event** — PluginManager emits on init/destroy failures for consumer error handling.
- **`upload:error` event** — Clipboard and DragDrop emit on uploadHandler rejection.
- **GitHub Actions CI** — `.github/workflows/ci.yml` runs lint, build, and test on every push/PR.
- **Husky + lint-staged** — Pre-commit hook runs `eslint --fix` on staged `.js`/`.jsx` files.
- **Source maps re-enabled** — Production builds emit `.map` files for debugging.

### Changed

- **Error handling hardened** — `EditorEngine.init()` wrapped in try/catch; modal export/import/upload operations show user-visible error states; `Selection.setRange()` catches detached-node errors.
- **CSS variables.css organized** — Section comment headers standardized throughout; utility classes added.
- **DevDependencies pinned** — All `^` ranges in devDependencies replaced with exact versions for reproducible builds.

---

## [Docs] — 2026-03-15

### Added

- **CONTRIBUTING.md** — Comprehensive contributing guide covering getting started, project structure, development workflow, adding commands, creating plugins, pull request process, code style guidelines, and commit message conventions.

---

## [@remyxjs/react 0.23.41] — 2026-03-15

### Changed

- **RemyxEditor refactored into sub-hooks** — Extracted `useResolvedConfig`, `usePortalAttachment`, and `useEditorRect` hooks; component reduced from 406 to ~230 lines.
- **Modals lazy-loaded** — All 9 modal components now use `React.lazy` + `Suspense`, deferring ~20-30 KB until first open.
- **Toolbar wrapped in `React.memo`** — Prevents re-renders when props haven't changed.
- **useSelection split** — Format and UI state managed separately with `shallowEqual` bail-out; DOM queries cached via `useRef`.
- **Resize/scroll listeners** — Replaced `window.addEventListener` with `ResizeObserver` + `requestAnimationFrame` throttle.
- **Unused React imports removed** — Removed unnecessary `React` default import from 16 files using the new JSX transform.
- **Package metadata added** — `description`, `keywords`, `repository`, `bugs`, `homepage`, `author`, `license`, and `sideEffects` fields.

---

## [@remyxjs/core 0.23.16] — 2026-03-15

### Fixed

- **Uninitialized `isMarkdownMode`** — Added `this.isMarkdownMode = false` to `EditorEngine` constructor.
- **AutolinkPlugin event listener leak** — Added `destroy()` method with `removeEventListener` for stored handler.
- **`dangerouslySetInnerHTML` fallback** — Prevents XSS when sanitizer returns empty string.
- **FindReplace index wrap** — `currentIndex % length` replaced with `Math.min(currentIndex, length - 1)` after replace.
- **`splitCell` creates `<td>` in `<thead>`** — Now checks `row.closest('thead')` to create `<th>` or `<td>` appropriately.
- **`Selection.restore()` silent failure** — Wrapped in try/catch with fallback to end of editor content.
- **History undo/redo race condition** — Disconnects `MutationObserver` before modifying `innerHTML`.
- **FindReplace negative index** — Added `length === 0` guard at start of replace command.
- **Paste font regex attribute order** — Changed `<font\s+face=` to `<font\s[^>]*?face=` for position-independent matching.

### Changed

- **Document converter split** — Monolithic `documentConverter.js` replaced with per-format modules using dynamic imports.
- **Paste cleaners modularized** — Source detection (Word, Google Docs, LibreOffice, Apple Pages) gates format-specific cleanup.
- **Theme config split** — `themeConfig.js` split into `themeConfig.js`, `themePresets.js`, and `toolbarItemTheme.js` for tree-shaking.
- **PDF worker opt-in** — `mammoth` and `pdfjs-dist` moved to optional peer dependencies.
- **Terser minification** — Replaced default esbuild minifier with Terser; `drop_console` and `drop_debugger` enabled.
- **Sourcemaps hidden** — Production builds no longer emit `.map` files.
- **CSS universal selector** — Changed `box-sizing: border-box` to `box-sizing: inherit` for `.rmx-editor *`.
- **Magic numbers extracted** — `HEADING_BASE_FONT_SIZE`, `HEADING_FONT_SIZE_STEP`, `GENERATED_ID_LENGTH`, `DEFAULT_EDITOR_HEIGHT`.
- **Package metadata added** — `description`, `keywords`, `repository`, `bugs`, `homepage`, `author`, `license`, and `sideEffects` fields.
- **`.gitignore` updated** — Added `.code-workspace`, `coverage/`, `.vitest/`, `.claude/`.

### Security

- **Dangerous tags removed entirely** — `script`, `style`, `svg`, `math`, `form`, `object`, `embed`, `applet`, `template` are removed with children instead of unwrapped.
- **`on*` event handler blocking** — Explicit check rejects any attribute starting with `on` regardless of allowlist.
- **File size limits** — 10 MB default limit on pasted/dropped images and document imports.
- **History re-sanitization** — Undo/redo re-sanitizes HTML before assigning to `innerHTML`.
- **Input type restriction** — `<input>` elements limited to `type="checkbox"` only.
- **`contenteditable` removed** — Stripped from allowed `div` attributes in schema.
- **CSS injection blocked** — `expression()`, `@import`, `behavior:`, `javascript:` blocked in style values.
- **Plugin API facade** — Third-party plugins receive restricted API; `requiresFullAccess: true` needed for direct engine access.

---

## [0.23.4] — 2026-03-14

### Added

- **Multi-package architecture** — Extracted `@remyxjs/core` (framework-agnostic engine) and `@remyxjs/react` (React components + hooks) from the monolithic `remyx-editor` package.
- **`create-remyx` CLI** — Scaffolding tool for new projects with JSX and TypeScript templates.
- **npm workspaces** — Monorepo setup with `packages/*` workspace configuration.
- **TypeScript declarations** — `.d.ts` files for all React components, hooks, and core exports.
- **MIT License** — Added LICENSE file to repo root.

### Removed

- **`remyx-editor` package** — Standalone package deleted; consumers use `@remyxjs/react` directly.

---

## Prior Releases

Releases before 0.23.4 were shipped as the monolithic `remyx-editor` package. See the [Roadmap](./ROADMAP.md) for feature history.
