![Remyx Editor](./images/Remyx-Logo.svg)

# Changelog

All notable changes to the Remyx Editor monorepo are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **Code block syntax highlighting** — Language-specific syntax highlighting for `<pre><code>` blocks using custom lightweight tokenizers (zero external dependencies). Supports 11 languages: JavaScript/TypeScript, Python, CSS, SQL, JSON, Bash, Rust, Go, Java, and HTML with automatic language detection. New `SyntaxHighlightPlugin` built-in plugin with MutationObserver-based auto-highlighting, debounced to avoid disrupting contenteditable typing. Skips blocks the user is actively editing and re-highlights on blur. Theme-aware token colors via `.rmx-syn-*` CSS classes across all 6 themes. New `setCodeLanguage` and `getCodeLanguage` commands. Language selector dropdown overlay on focused code blocks in `@remyxjs/react`. Markdown round-trip preserves language identifiers (`` ```js ``, `` ```python ``). New exports: `SyntaxHighlightPlugin`, `SUPPORTED_LANGUAGES`, `LANGUAGE_MAP`, `detectLanguage`, `tokenize` from `@remyxjs/core`.
- **Source mode sanitization notification** — `SourceModal` now emits a `source:sanitized` event when the sanitizer strips unsafe content from user-edited HTML, so consumers can surface a warning.

### Removed

- **Playwright e2e test suite** — Removed `playwright.config.js`, `e2e/` directory (8 spec files), and `@playwright/test` dependency. The root repo does not serve a production web server; e2e tests will be revisited when needed.
- **Duplicate config files in `packages/`** — Removed `babel.config.js`, `eslint.config.js`, `jest.config.js`, and `tsconfig.json` from `packages/`. All tooling (lint, test, typecheck) now runs from the repo root only.
- **Redundant `packages/` devDependencies** — Stripped `packages/package.json` to only Nx and build/release scripts. Testing, linting, and type-checking deps live at the repo root.

### Changed

- **CONTRIBUTING.md** — Updated development workflow to clarify that lint, test, and typecheck commands run from the repo root, while build commands run from `packages/`.

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

### Security

- **Pinned runtime dependencies** — `marked`, `turndown`, and `turndown-plugin-gfm` in `@remyxjs/core` are now pinned to exact versions (no `^` ranges) to prevent unvetted patch updates.

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
