![Remyx Editor](./images/Remyx-Logo.svg)

# Optimization Roadmap — Remyx Editor

**Created:** 2026-03-15
**Version:** 0.24.0
**Scope:** File size reduction and runtime performance across all packages

---

## Current Bundle Sizes

| Package | ES Module | CJS | CSS |
| --- | --- | --- | --- |
| `@remyx/core` | 172 KB | 130 KB | 25.5 KB |
| `@remyx/react` | 91 KB | 63 KB | 2.3 KB |

---

## Critical — Highest Impact

### ~~1. Eliminate Source Duplication Between `remyx-editor` and `@remyx/core`~~ ✅ Complete

The `remyx-editor` standalone package has been removed entirely. All source code now lives exclusively in `@remyx/core` and `@remyx/react`, eliminating ~75 KB of duplicate code.

---

### ~~2. Deduplicate CSS Across Packages~~ ✅ Complete

CSS now ships from `@remyx/core` only. `@remyx/react` ships only its component-specific CSS. The duplicate `remyx-editor` CSS has been removed along with the package.

---

### ~~3. Make PDF Worker Opt-In~~ ✅ Complete

Externalized all `pdfjs-dist` subpath imports via regex pattern in Vite config (`/pdfjs-dist\/.*/`). Moved `mammoth` and `pdfjs-dist` from `dependencies` to optional `peerDependencies`. Consumers only install these when they need DOCX/PDF import.

---

### ~~4. Lazy-Load Modal Components~~ ✅ Complete

All 9 modal components now use `React.lazy()` with dynamic imports and are wrapped in `<Suspense fallback={null}>`. Modals are only rendered when their `open` state is true, deferring ~20–30 KB from initial load.

---

## High — Significant Impact

### ~~5. Split Selection State Into Granular Atoms~~ ✅ Complete

`useSelection.js` now uses two separate `useState` calls — one for format state (15 fields) and one for UI state (4 fields). A `shallowEqual` bail-out prevents re-renders when a `selection:change` event fires but no values actually changed.

---

### ~~6. Stabilize `useSelection` Event Handler~~ ✅ Complete

`handleSelectionChange` was already wrapped in `useCallback` with `[]` dependencies. No additional changes needed.

---

### ~~7. Debounce Window Resize/Scroll Listeners~~ ✅ Complete

Replaced `window.addEventListener('resize')` with `ResizeObserver` on the editor element. Both resize and scroll updates are throttled via `requestAnimationFrame`. Extracted into a dedicated `useEditorRect()` hook.

---

### ~~8. Enable Terser Minification With Console Removal~~ ✅ Complete

Both Vite configs now use `minify: 'terser'` with `drop_console: true` and `drop_debugger: true`. Added `terser` as a devDependency to both packages.

---

## Medium — Measurable Impact

### ~~9. Split `documentConverter.js` by Format~~ ✅ Complete

Split the monolithic 392-line file into a `documentConverter/` directory with 9 files: `index.js` (dispatcher with dynamic imports), `shared.js` (common utilities), and 7 format-specific modules (`convertDocx.js`, `convertPdf.js`, `convertMarkdown.js`, `convertHtml.js`, `convertText.js`, `convertCsv.js`, `convertRtf.js`). Each converter is loaded on-demand.

---

### ~~10. Make Paste Cleaners Modular~~ ✅ Complete

Added source detection at the top of `cleanPastedHTML()` using regex patterns (`mso-` for Word, `docs-internal` for Google Docs, `<text:` for LibreOffice, `apple-content-edited` for Apple Pages). Source-specific cleanup pipelines now only run when the corresponding source is detected. Common cleanup always runs.

---

### ~~11. Cache DOM Queries in Selection Hot Path~~ ✅ Complete

Added a `useRef` cache for focused image/table DOM references in `useSelection.js`. The cache is only cleared on `content:change` events (when the DOM may have mutated), avoiding redundant `querySelector` and `closest` calls on every `selection:change` event.

---

### ~~12. Refactor `RemyxEditor.jsx` Into Sub-Hooks~~ ✅ Complete

Extracted three custom hooks: `useResolvedConfig()` (config resolution and merge), `usePortalAttachment()` (portal/textarea binding), and `useEditorRect()` (rect tracking with ResizeObserver). `RemyxEditor.jsx` is now ~230 lines of hook calls and JSX.

---

### ~~13. Restrict CSS Universal Selector~~ ✅ Complete

Changed the `.rmx-editor *` universal selector from `box-sizing: border-box` to `box-sizing: inherit`. The `.rmx-editor` root already sets `box-sizing: border-box`, so children inherit it through the cascade instead of matching a direct property assignment.

---

## Low — Polish

### ~~14. Hide Sourcemaps From Distribution~~ ✅ Complete

Both Vite configs now set `sourcemap: false`, removing `.map` files from published `dist/` output.

---

### ~~15. Document Tree-Shaking Best Practices~~ ✅ Complete

Added a "Tree-Shaking" section to the `@remyx/core` README documenting minimal vs full import patterns, optional heavy dependencies, and tree-shakeable theme modules.

---

### ~~16. Lazy-Load Theme Configuration Utilities~~ ✅ Complete

Split `themeConfig.js` (329 lines) into three tree-shakeable modules: `themeConfig.js` (core `createTheme` + `THEME_VARIABLES`), `themePresets.js` (`THEME_PRESETS`), and `toolbarItemTheme.js` (per-item toolbar theming utilities). Consumers who don't import presets or toolbar theming get those modules eliminated by their bundler.

---

### ~~17. Wrap `Toolbar` in `React.memo`~~ ✅ Complete

The `Toolbar` component is now wrapped in `React.memo`. Combined with the `shallowEqual` bail-out in `useSelection` (#5), toolbar re-renders are significantly reduced during editing.

---

## Summary

| Priority | Items | Estimated Size Savings | Performance Gain |
| --- | --- | --- | --- |
| Critical | #1–#4 ✅ | ~75 KB saved + 2.6 MB worker | Modal load deferred |
| High | #5–#8 ✅ | ~10 KB (terser) | 30–40% fewer re-renders |
| Medium | #9–#13 ✅ | ~25 KB (tree-shake) | 10–15% CPU in hot paths |
| Low | #14–#17 ✅ | ~15 KB | Better DX |
| **Total** | **17 items ✅** | **~145 KB + worker** | **Significant** |
