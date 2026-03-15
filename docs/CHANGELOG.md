![Remyx Editor](./images/Remyx-Logo.svg)

# Changelog

All notable changes to the Remyx Editor monorepo are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Infra] — 2026-03-15

### Added

- **Jest test framework** — Replaced Vitest with Jest + Babel for unit testing across the monorepo. Multi-project configuration (`remyx-core`, `remyx-react`) with `jest-environment-jsdom`.
- **Babel configuration** — Added `babel.config.js` with `@babel/preset-env` (node: current) and `@babel/preset-react` (automatic runtime) for ESM + JSX transform in tests.
- **344 unit tests** — 311 `@remyx/core` tests across 15 suites + 33 `@remyx/react` tests across 3 suites.
- **New `@remyx/core` test suites** — KeyboardManager, markdownConverter, platform, themeConfig, toolbarConfig, fontConfig, themePresets (86 new tests).
- **New `@remyx/react` test suites** — useModal hook (13 tests), ToolbarButton component (10 tests), ToolbarDropdown component (10 tests).
- **Playwright e2e tests** — 109 end-to-end tests covering editor initialization, text formatting, lists, links, tables, undo/redo, keyboard shortcuts, and more.

### Removed

- **Vitest** — Removed `vitest` dependency, `vitest.config.js`, and all Vitest-specific imports (`vi.fn`, `vi.spyOn`, `import from 'vitest'`).

### Changed

- **Test commands** — `npm run test` now runs `npx nx run-many -t test` (Jest); `npm run test:watch` now runs `jest --watch`.
- **Nx project targets** — `test` targets in `project.json` files updated from `vitest run --project X` to `jest --selectProjects X`.

---

## [Infra] — 2026-03-15

### Added

- **Nx integration** — Installed `nx` and `@nx/js` for task orchestration, caching, and release management.
- **`project.json` for all packages** — `remyx-core` (library), `remyx-react` (library), `create-remyx` (application) with build/dev/lint/test/analyze targets.
- **Dependency-aware builds** — `remyx-react` build automatically triggers `remyx-core` build first via `dependsOn: ["^build"]`.
- **Nx caching** — Task results cached locally in `.nx/cache/`; repeated builds replay instantly.
- **Affected commands** — `npm run affected:build`, `affected:test`, `affected:lint` run tasks only on changed packages.
- **`npm run graph`** — Interactive dependency graph visualization.
- **`npm run release` / `release:dry`** — Nx release for versioning and npm publishing with dry-run preview.
- **NX.md** — Comprehensive guide covering workspace setup, task running, npm publishing (first-time setup through CI automation), and troubleshooting.

### Changed

- **Root scripts migrated to Nx** — `build:all`, `build:core`, `build:react`, `lint`, `test`, `analyze:*` now use `npx nx` for caching and dependency ordering.
- **`@remyx/core` dev dependency** — Changed from registry version to `file:../remyx-core` in `@remyx/react` for local workspace resolution.

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

- **Unit test suite** — 8 test files covering EditorEngine, EventBus, CommandRegistry, History, Sanitizer, PluginManager, Selection, and utilities.
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
- **`.gitignore` updated** — Added `.code-workspace`, `coverage/`, `.claude/`.

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
