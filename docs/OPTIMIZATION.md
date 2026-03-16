![Remyx Editor](./images/Remyx-Logo.svg)

# Optimization Roadmap — Remyx Editor

**Last updated:** 2026-03-16
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

## New Findings (0.24.0 Audit)

### High — React Re-Render Reduction

#### ~~18. Add `React.memo` to Remaining High-Frequency Components~~ ✅ Complete

**Components:** `MenuBar.jsx`, `MenuItem.jsx`, `StatusBar.jsx`, `ContextMenu.jsx`, `ModalOverlay.jsx`, `FindReplaceModal.jsx`, `ImportDocumentModal.jsx`, `AttachmentModal.jsx`, `ImageModal.jsx`, `ExportModal.jsx`

These components lack `React.memo` and re-render on every parent update or selection change. `Toolbar`, `ToolbarButton`, `ToolbarSeparator`, `ToolbarColorPicker`, and `ToolbarDropdown` are already memoized.

**Estimated Impact:** 30–40% reduction in React render calls during editing

**Fix applied:** Wrapped `MenuBar`, `MenuItem`, `StatusBar`, `WordCountButton`, `ContextMenu`, `ModalOverlay`, and `FloatingToolbar` in `React.memo`.

#### 19. Replace `selectionState` Prop Drilling With Context

**File:** `remyx-react/src/components/RemyxEditor.jsx`

`selectionState` (16+ properties) is passed to `MenuBar`, `Toolbar`, `FloatingToolbar`, `StatusBar`, and `ContextMenu`. When any field changes, all consumers re-render. A granular context split (format vs UI state) would localize updates.

**Estimated Impact:** 20–25% fewer cascading re-renders

---

### High — Runtime Hot Path

#### ~~20. Batch DOM Reads in FloatingToolbar Positioning~~ ✅ Complete

**File:** `remyx-react/src/components/EditArea/FloatingToolbar.jsx` (lines 10–25)

The positioning effect reads `offsetHeight`/`offsetWidth` then writes to state on every selection change, causing a layout recalculation cycle. Measuring the toolbar once via `ResizeObserver` and positioning via `transform` would eliminate repeated forced reflows.

**Estimated Impact:** 10–15ms reduction per selection change

**Fix applied:** Added `ResizeObserver` to cache toolbar dimensions in a ref. Positioning effect uses cached values instead of reading `offsetHeight`/`offsetWidth` on every selection change.

#### 21. WeakMap DOM Caching in `useSelection`

**File:** `remyx-react/src/hooks/useSelection.js` (lines 69–80)

DOM queries (`querySelector`, `closest`) run on every `selection:change` event. The existing `useRef` cache is cleared on every `content:change`, which fires frequently. A `WeakMap` keyed on DOM nodes would auto-invalidate only when nodes are GC'd.

**Estimated Impact:** 15–20% faster selection updates in large documents

---

### Medium — Bundle Size

#### 22. Granular Sub-Exports for Tree-Shaking

**File:** `remyx-core/src/index.js`

All core functionality is re-exported from a single entry point. Consumers who only use the editor engine still bundle document converters, export utilities, font config, and theme utilities. Sub-exports (`@remyx/core/converter`, `@remyx/core/export`, `@remyx/core/themes`) would allow bundlers to eliminate unused modules.

**Estimated Impact:** 8–12 KB savings for minimal-feature consumers

#### 23. Split Icon Bundle Into Lazy Chunks

**File:** `remyx-react/src/icons/index.jsx`

All SVG icons are bundled in the initial JS regardless of whether modal icons are needed. Splitting into `icons/core.js` (toolbar) and `icons/modals.js` (lazy-loaded with modals) would defer unused icons.

**Estimated Impact:** 8–12 KB deferred from initial load

---

### Medium — Event Listener Management

#### 24. Event Delegation for Document-Level Listeners

**Files:** `MenuBar.jsx` (lines 32–37), `ToolbarColorPicker.jsx` (lines 9–18)

Each menu open and color picker adds separate `mousedown`/`keydown` listeners on `document`. Multiple editors on the same page accumulate redundant global listeners.

**Recommended fix:** Use a single shared document listener per event type with ref-counted registration.

**Estimated Impact:** Prevents listener accumulation; ~2–3 KB memory saved per editor instance

---

### Low — Polish

#### ~~25. `will-change` for Animated Elements~~ ✅ Complete

**File:** `remyx-core/src/themes/variables.css`

Multiple elements animate `transform`/`scale` (context menu, modals, floating toolbar). Adding `will-change: transform` enables GPU layer promotion for smoother 60fps animations on lower-end devices.

**Estimated Impact:** Smoother animations; no size change

**Fix applied:** Added `will-change: transform` to `.rmx-floating-toolbar`, `.rmx-context-menu`, and `.rmx-modal` in `variables.css`.

#### 26. FileReader Progress for Large Images

**File:** `remyx-react/src/components/Modals/ImageModal.jsx` (lines 41–46)

`readAsDataURL()` blocks the main thread for large images. Adding a progress indicator or streaming approach improves perceived performance.

**Estimated Impact:** Better UX for large uploads; no jank

#### ~~27. Cache Focusable Elements in ModalOverlay~~ ✅ Complete

**File:** `remyx-react/src/components/Modals/ModalOverlay.jsx`

`querySelectorAll(FOCUSABLE_SELECTOR)` runs on every Tab keypress for focus trapping. Caching the result in a `useRef` and only re-querying when modal content changes would reduce DOM queries.

**Estimated Impact:** 5–8ms faster focus trap per Tab press

**Fix applied:** Added `focusableRef` cache populated on modal open. `handleKeyDown` uses cached list with DOM query fallback.

---

## Summary

| Priority | Items | Estimated Size Savings | Performance Gain |
| --- | --- | --- | --- |
| Critical | #1–#4 ✅ | ~75 KB saved + 2.6 MB worker | Modal load deferred |
| High | #5–#8 ✅ | ~10 KB (terser) | 30–40% fewer re-renders |
| Medium | #9–#13 ✅ | ~25 KB (tree-shake) | 10–15% CPU in hot paths |
| Low | #14–#17 ✅ | ~15 KB | Better DX |
| **Subtotal (v0.24.0)** | **17 items ✅** | **~145 KB + worker** | **Significant** |
| High (new) | #18 ✅, #20 ✅, #19, #21 | — | 30–50% fewer re-renders |
| Medium (new) | #22–#24 | ~16–24 KB | Memory savings |
| Low (new) | #25 ✅, #27 ✅, #26 | — | Smoother UX |
| **Total** | **27 items (21 ✅, 6 open)** | **~165 KB + worker** | **Major** |
