![Remyx Editor](./images/Remyx-Logo.svg)

# Changelog

All notable changes to the Remyx Editor monorepo are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.25.0] — 2026-03-16

### Added

- **Comprehensive Jest test suite** — 42 test files with 815 tests covering core engine, commands (16 modules), plugins (4), utilities (5), React hooks (4), React components (2), and config provider (1). Migrated from Vitest to Jest for consistent tooling.
- **Playwright e2e test suite** — 8 spec files covering editor basics, formatting, toolbar, keyboard shortcuts, themes, accessibility, fullscreen, and modals.
- **Unit test coverage** — Statements 82.85%, Branches 74.11%, Functions 77.41%, Lines 85.21% (up from ~67%).
- **Coverage HTML reports** — Unit coverage at `coverage/unit/index.html`, e2e report at `coverage/e2e/`.
- **New test scripts** — `npm test`, `npm run test:watch`, `npm run test:coverage`, `npm run e2e`, `npm run e2e:report`.
- **BENCHMARK.md** — Performance benchmark document covering build times, bundle sizes, test speed, lint speed, code-split chunk inventory, and improvement opportunities.

### Changed

- **Scaffolding moved to `@remyx/react`** — Project scaffolding CLI relocated from `create-remyx` to `@remyx/react/create/` and renamed to `create-remyx-app` (`npx create-remyx-app`). The `create-remyx` package is now reserved for a future interactive CLI wizard.
- **`create-remyx` repurposed** — Gutted scaffolding code; package now displays a redirect message. Will become an interactive editor configuration wizard (see ROADMAP.md).
- **Test runner migrated from Vitest to Jest** — All existing tests converted from `vi.*` to `jest.*` API. Added `jest.config.js` and `babel.config.js` for JSX transform and module resolution.
- **CONTRIBUTING.md updated** — Testing section now documents Jest and Playwright workflows, test structure, and writing guidelines.
- **History test fix** — Corrected undo test assertion that expected wrong state after single undo step.
- **Root package.json version** — Updated from 0.23.0 to 0.24.0 to match all sub-packages.
- **`@remyx/react` peerDependencies** — `@remyx/core` constraint updated from `>=0.23.4` to `>=0.24.0`.

### Security

- **Audit fixes (commit 08d7117)** — Fixed 6 bugs, 26 security issues, 15 cleanup items, and 4 optimizations documented in BUGS.md, SECURITY.md, CLEANUP.md, and OPTIMIZATION.md.

---

## [@remyx/react 0.24.0] — 2026-03-15

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

## [@remyx/core 0.24.0] — 2026-03-15

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

## [@remyx/react 0.23.41] — 2026-03-15

### Changed

- **RemyxEditor refactored into sub-hooks** — Extracted `useResolvedConfig`, `usePortalAttachment`, and `useEditorRect` hooks; component reduced from 406 to ~230 lines.
- **Modals lazy-loaded** — All 9 modal components now use `React.lazy` + `Suspense`, deferring ~20-30 KB until first open.
- **Toolbar wrapped in `React.memo`** — Prevents re-renders when props haven't changed.
- **useSelection split** — Format and UI state managed separately with `shallowEqual` bail-out; DOM queries cached via `useRef`.
- **Resize/scroll listeners** — Replaced `window.addEventListener` with `ResizeObserver` + `requestAnimationFrame` throttle.
- **Unused React imports removed** — Removed unnecessary `React` default import from 16 files using the new JSX transform.
- **Package metadata added** — `description`, `keywords`, `repository`, `bugs`, `homepage`, `author`, `license`, and `sideEffects` fields.

---

## [@remyx/core 0.23.16] — 2026-03-15

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

- **Multi-package architecture** — Extracted `@remyx/core` (framework-agnostic engine) and `@remyx/react` (React components + hooks) from the monolithic `remyx-editor` package.
- **`create-remyx` CLI** — Scaffolding tool for new projects with JSX and TypeScript templates.
- **npm workspaces** — Monorepo setup with `packages/*` workspace configuration.
- **TypeScript declarations** — `.d.ts` files for all React components, hooks, and core exports.
- **MIT License** — Added LICENSE file to repo root.

### Removed

- **`remyx-editor` package** — Standalone package deleted; consumers use `@remyx/react` directly.

---

## Prior Releases

Releases before 0.23.4 were shipped as the monolithic `remyx-editor` package. See the [Roadmap](./ROADMAP.md) for feature history.
