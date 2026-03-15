# Cleanup & Technical Debt

**Last updated:** 2026-03-14
**Version:** 0.23.0

A prioritized list of cleanup tasks, code quality improvements, and technical debt across the Remyx Editor monorepo.

---

## Critical — Duplicate Code

The multi-package restructure (Steps 1-2) copied files into `remyx-core/` and `remyx-react/` but left the originals in `remyx-editor/`. All three packages now contain overlapping source code. This is the single biggest maintenance risk.

- [ ] **Remove duplicate core files from `remyx-editor/src/`** — The following directories exist identically in both `remyx-editor/src/` and `remyx-core/src/`: `core/`, `commands/`, `plugins/`, `utils/`, `constants/`, `config/`, `themes/`. Once Step 3 of PLANNED_PACKAGES.md converts `remyx-editor` into a thin meta-package that re-exports `@remyx/core` + `@remyx/react`, these ~49 files can be deleted from `remyx-editor/src/`.
- [ ] **Remove duplicate React files from `remyx-editor/src/`** — The following directories exist identically in both `remyx-editor/src/` and `remyx-react/src/`: `components/`, `hooks/`, `icons/`, `config/`. Once the meta-package conversion is done, these ~33 files can be deleted.
- [ ] **Duplicate CSS themes** — `remyx-editor/src/themes/` (variables.css, light.css, dark.css) are identical copies of `remyx-core/src/themes/`. Remove after Step 3.
- [ ] **Duplicate dependencies** — `remyx-editor/package.json` lists `mammoth`, `marked`, `pdfjs-dist`, `turndown`, `turndown-plugin-gfm` which are already in `remyx-core`. After Step 3, these should be removed from `remyx-editor` and inherited via `@remyx/core`.

> **Blocked on:** Step 3 of PLANNED_PACKAGES.md (backward-compatible meta-package conversion)

---

## High — Missing Tests

No test files exist anywhere in the monorepo. This is the biggest quality gap.

- [ ] **Set up test infrastructure** — Add Vitest as the test runner (already using Vite for builds)
- [ ] **Core engine tests** — `EditorEngine` init/destroy, `getHTML`/`setHTML`, `executeCommand`, `isEmpty`, `focus`/`blur`
- [ ] **Command tests** — Each of the 16 command register functions needs at least basic assertions
- [ ] **Sanitizer tests** — XSS prevention, tag allowlisting, attribute filtering, style cleaning
- [ ] **History tests** — Undo/redo, snapshot management, stack limits
- [ ] **Plugin system tests** — `createPlugin`, `PluginManager.register`, lifecycle hooks
- [ ] **Utility tests** — `htmlToMarkdown`, `markdownToHtml`, `cleanPastedHTML`, `looksLikeMarkdown`, `convertDocument`, `exportAsPDF`
- [ ] **React hook tests** — `useEditorEngine`, `useRemyxEditor`, `useSelection`, `useModal`
- [ ] **Component tests** — `RemyxEditor` rendering with various prop combinations
- [ ] **E2E tests** — Playwright for toolbar interactions, paste handling, drag-and-drop, modals

---

## High — Package Metadata

All three `package.json` files are missing npm metadata fields needed for discoverability.

- [ ] **Add `description`** to `remyx-core`, `remyx-react`, and `remyx-editor` package.json
- [ ] **Add `keywords`** — `["wysiwyg", "editor", "rich-text", "contenteditable", ...]`
- [ ] **Add `repository`** — `{ "type": "git", "url": "...", "directory": "packages/remyx-core" }`
- [ ] **Add `bugs`** and `homepage` URLs
- [ ] **Add `author`** and `license` fields
- [ ] **Add `sideEffects`** field for tree-shaking — `["*.css"]` for core, `false` for react

---

## High — Build Configuration

- [ ] **`remyx-editor` missing `cssFileName: 'style'`** — Its Vite config doesn't set `cssFileName`, so the output CSS filename may be inconsistent with core and react packages
- [ ] **`remyx-editor` doesn't externalize `@remyx/core`** — After Step 3, the meta-package should externalize `@remyx/core` and `@remyx/react` to avoid double-bundling
- [ ] **No `tsconfig.json`** — Even though the source is JS, a root `tsconfig.json` with `allowJs: true` would enable IDE type checking and make the `.d.ts` files in `remyx-react/src/types/` actually consumable
- [ ] **No bundle analysis** — Add `rollup-plugin-visualizer` or `vite-bundle-analyzer` to track bundle size regressions

---

## High — Error Handling

- [ ] **Unhandled promise rejections** — `convertDocument()`, `exportAsPDF()`, `exportAsDocx()` return promises but callers in modals don't always have comprehensive error recovery
- [ ] **EditorEngine constructor** — No try/catch around `contentEditable` setup; a misconfigured element could throw silently
- [ ] **Selection.js `commitSelection`** — Stores DOM range without error handling; can throw if the DOM state is unexpected
- [ ] **File upload errors** — `uploadHandler` rejections should surface user-visible errors, not just console warnings
- [ ] **Plugin initialization** — `PluginManager` catches errors but only logs them; add an `onError` callback

---

## High — Component Size

These components are oversized and should be refactored:

- [ ] **`RemyxEditor.jsx` (406 lines)** — Extract portal/attach logic into a custom hook, extract modal rendering into a `<ModalContainer>` sub-component, extract keyboard shortcut wiring
- [ ] **`Toolbar.jsx` (232 lines)** — Extract the command execution logic into a shared hook or utility used by both Toolbar and MenuBar
- [ ] **`useEditorEngine.js` (~200 lines)** — The command registration block is repetitive; consider a loop over a registry array

---

## Medium — Accessibility

- [ ] **Toolbar buttons missing `aria-pressed`** — Toggle buttons (bold, italic, etc.) should have `aria-pressed={isActive}` for screen readers
- [ ] **Toolbar buttons missing `aria-label`** — Icon-only buttons need text labels; currently only have `title` attributes
- [ ] **Modal overlays missing `role="dialog"`** — `ModalOverlay.jsx` should set `role="dialog"` and `aria-modal="true"`
- [ ] **Color picker swatches** — No `aria-label` describing the color (e.g., "Red", "Blue")
- [ ] **Menu bar** — Should implement WAI-ARIA menu pattern: `role="menubar"`, `role="menu"`, `role="menuitem"`, `aria-haspopup`, `aria-expanded`
- [ ] **Focus management in modals** — Verify focus is trapped inside open modals and restored on close
- [ ] **Skip navigation** — No skip link for keyboard users to jump past the toolbar to content
- [ ] **Heading hierarchy** — The editor should respect the host page's heading level (configurable base level)

---

## Medium — React Performance

- [ ] **Missing `React.memo`** — Pure components that receive stable props should be memoized:
  - `ToolbarButton` — re-renders on every selection change even if its active state hasn't changed
  - `ToolbarSeparator` — stateless, never needs to re-render
  - `MenuItem` — can be memoized on `selectionState` active check
- [ ] **`useSelection` polling** — Check if `selectionchange` event listener is efficient; avoid unnecessary state updates when selection hasn't meaningfully changed
- [ ] **`useEffect` dependency warnings suppressed** — 6 instances of `// eslint-disable-line react-hooks/exhaustive-deps` across `RemyxEditor.jsx`, `useEditorEngine.js`, and `useRemyxEditor.js`. These need investigation to determine if they cause stale closure bugs or are legitimate optimizations.

---

## Medium — TypeScript

- [ ] **Core modules have no type annotations** — All `.js` files in `remyx-core/src/` lack JSDoc `@param`/`@returns` comments. Adding these would improve IDE autocomplete for JS consumers and could generate `.d.ts` files automatically.
- [ ] **`remyx-react/src/types/index.d.ts` is isolated** — The type declarations aren't verified against the actual source. Types could drift. Consider generating from JSDoc or adding a CI type-check step.
- [ ] **No `tsconfig.json` in any package** — Even a minimal config with `checkJs: true` would catch type errors in IDE

---

## Medium — CSS

- [ ] **Extensive inline styles** — Many components use `style={{...}}` props instead of CSS classes. Examples:
  - `ImportDocumentModal.jsx` — preview container styles (lines 94-103)
  - `ToolbarColorPicker.jsx` — swatch grid and color buttons
  - `StatusBar.jsx` — layout styles
  - `FloatingToolbar.jsx` — positioning styles (justified: dynamic positioning)
- [ ] **No CSS minification verification** — Check that Vite's CSS output is properly minified for production
- [ ] **`variables.css` is 1317 lines** — Consider splitting into logical sections or using CSS layers

---

## Low — Git Hygiene

- [ ] **`.DS_Store` tracked in git** — Add to `.gitignore` and remove from index: `git rm --cached .DS_Store packages/.DS_Store`
- [ ] **Stale file deletions** — `git status` shows deleted files from root (`PLANNED_PACKAGES.md`, `README.md`, `ROADMAP.md`, `SECURITY.md`) that were moved to `packages/`. Stage the deletions.
- [ ] **`.claude/` directory** — Decide whether to gitignore or track Claude session files
- [ ] **Add `.gitignore` entries** — IDE workspace files (`.code-workspace`), coverage reports (`coverage/`), Vitest cache (`.vitest/`)

---

## Low — Code Style

- [ ] **Magic numbers** — Extract to named constants:
  - Font size calculation: `22 - (parseInt(o.tag?.[1]) || 0) * 2` in `Toolbar.jsx`
  - ID generation length `9` in `dom.js`
  - Default editor height `300` (already a prop default, but used in multiple places)
- [ ] **Inconsistent React import** — Some files use `import React, { useState }` (needed for older JSX transforms), others omit the default import. With the new JSX transform (`react/jsx-runtime`), the default import is unnecessary.
- [ ] **`"default" is imported from external module "react" but never used`** — Vite build warns about 27 files importing `React` default unnecessarily. Remove unused default imports.

---

## Low — Documentation

- [ ] **No CONTRIBUTING.md** — Add contributor guidelines, development setup, and PR process
- [ ] **No CHANGELOG.md** — Track version changes for consumers
- [ ] **No LICENSE file** — README says MIT but there's no LICENSE file at the repo root or in packages
- [ ] **API docs** — Consider generating API documentation from JSDoc comments (TypeDoc or similar)
- [ ] **Storybook / examples** — The demo app in `src/App.jsx` is good but could be a standalone Storybook for visual testing

---

## Low — Dependencies

- [ ] **Pin dependency versions** — All deps use `^` ranges. For a library, this is fine for consumers, but consider using exact versions in `devDependencies` for reproducible builds.
- [ ] **Audit for vulnerabilities** — Run `npm audit` regularly
- [ ] **Unused dev dependencies** — Check if `eslint-plugin-react-refresh` is needed in the root package (only relevant for the dev app)
- [ ] **Consider bundling `marked` and `turndown`** — These are bundled into the output anyway; making them regular dependencies adds to the consumer's `node_modules` size without benefit. Alternatively, make them optional/lazy-loaded.

---

## Informational — Future Improvements

These aren't bugs or debt — they're enhancements worth considering:

- [ ] **Error boundaries** — Wrap `<RemyxEditor>` in a React error boundary so a crash doesn't take down the host app
- [ ] **`onError` callback prop** — Let consumers handle editor errors gracefully
- [ ] **Lazy-load heavy modules** — `pdfjs-dist` and `mammoth` are large; dynamic import on first use
- [ ] **Web Worker for sanitization** — Move HTML sanitization off the main thread for large documents
- [ ] **Source maps** — Ensure `.map` files are generated for all production builds
- [ ] **CDN build** — Add a UMD/IIFE build for `<script>` tag consumers
- [ ] **Pre-commit hooks** — Add Husky + lint-staged for automatic linting on commit
- [ ] **CI pipeline** — GitHub Actions workflow for build + lint + test on every PR

---

## Priority Order

| Priority | Category | Items | Blocked On |
| --- | --- | --- | --- |
| **1** | Duplicate code removal | 4 items | Step 3 (meta-package) |
| **2** | Test infrastructure | 10 items | — |
| **3** | Package metadata | 6 items | — |
| **4** | Build config fixes | 4 items | — |
| **5** | Error handling | 5 items | — |
| **6** | Component refactoring | 3 items | — |
| **7** | Accessibility | 8 items | — |
| **8** | React performance | 3 items | — |
| **9** | TypeScript | 3 items | — |
| **10** | CSS cleanup | 3 items | — |
| **11** | Git hygiene | 4 items | — |
| **12** | Code style | 3 items | — |
| **13** | Documentation | 5 items | — |
| **14** | Dependencies | 4 items | — |
| **15** | Future improvements | 8 items | — |
