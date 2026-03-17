![Remyx Editor](./images/Remyx-Logo.svg)

# Optimization Roadmap — Remyx Editor

**Last updated:** 2026-03-16
**Version:** 0.26.0
**Scope:** Configuration ergonomics, user experience, runtime performance, bundle size, and rendering efficiency

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

---

## 0.26.0 Audit — New Findings

The following optimizations were identified during a comprehensive audit of the codebase at v0.26.0, spanning configuration ergonomics, rendering efficiency, core engine hot paths, bundle size, autosave, CSS, and event handling.

---

### High — Configuration Ergonomics

#### 28. Memoize `useResolvedConfig` Return Value

**File:** `remyx-react/src/hooks/useResolvedConfig.js`

The hook returns a new object literal on every render, causing all consumers (`RemyxEditor`, `StatusBar`, `Toolbar`, etc.) to re-render even when no config value changed. Wrapping the return in `useMemo` keyed on resolved fields would stabilize the reference.

**Estimated Impact:** 15–20% fewer cascading re-renders when parent state changes

#### 29. Deduplicate Toolbar Config Resolution

**File:** `remyx-react/src/hooks/useResolvedConfig.js` (lines 38–65)

Toolbar presets are resolved on every render by iterating through `TOOLBAR_PRESETS` and calling `getToolbarPreset()`. The result is deterministic for a given `toolbar` prop, so it can be memoized with `useMemo(() => resolveToolbar(toolbar), [toolbar])`.

**Estimated Impact:** Minor CPU savings per render; improves profiler flame graph clarity

#### 30. Stabilize `RemyxConfigProvider` Context Value

**File:** `remyx-react/src/components/ConfigProvider/RemyxConfigProvider.jsx`

The provider creates a new context value object on each render, causing all `useContext(RemyxConfigContext)` consumers to re-render. Wrapping in `useMemo` would prevent unnecessary propagation.

**Estimated Impact:** Prevents re-render cascade through the entire component tree

---

### High — React Rendering Efficiency

#### 31. Granular `useSelection` State Splits

**File:** `remyx-react/src/hooks/useSelection.js`

Despite the `shallowEqual` bail-out added in #5, the hook still computes all 15+ format fields on every `selection:change` event. Splitting into `useSelectionFormat()` (bold, italic, etc.) and `useSelectionUI()` (focused image, table cell) would allow consumers to subscribe to only the slice they need.

**Estimated Impact:** 20–30% fewer re-renders for components that only need format state (e.g., `Toolbar`)

#### 32. Reduce Unmemoized Object Creation in `RemyxEditor`

**File:** `remyx-react/src/components/RemyxEditor.jsx`

Multiple inline objects are created on each render and passed as props: `editorCallbacks`, `statusBarProps`, `toolbarProps`. Each triggers child re-renders. Stabilizing with `useMemo` keyed on relevant dependencies would reduce unnecessary work.

**Estimated Impact:** 10–15% fewer child component re-renders during typing

#### 33. Virtualize FloatingToolbar Position Calculation

**File:** `remyx-react/src/components/EditArea/FloatingToolbar.jsx`

Even with the `ResizeObserver` fix in #20, the positioning effect still runs `getBoundingClientRect()` on the selection range on every `selection:change`. Debouncing position updates by 50ms (matching typical selection interaction speed) would reduce layout thrashing without visible delay.

**Estimated Impact:** 5–10ms saved per selection change in large documents

---

### High — Core Engine Hot Paths

#### 34. Throttle MutationObserver in History

**File:** `remyx-core/src/core/History.js`

The `MutationObserver` callback fires on every DOM mutation (typing, formatting, paste). Each invocation calls `takeSnapshot()` which reads `innerHTML`. Coalescing mutations with `requestAnimationFrame` or a 100ms debounce would batch rapid changes into single snapshots.

**Estimated Impact:** 50–70% fewer `innerHTML` reads during continuous typing

#### 35. Cache Sanitizer Results for Repeated Content

**File:** `remyx-core/src/core/Sanitizer.js`

`sanitize()` is called on every paste, every undo/redo, and during history re-sanitization. For identical input strings (common during rapid undo/redo), a small LRU cache (5–10 entries) keyed on input hash would skip redundant parsing.

**Estimated Impact:** 3–5ms saved per undo/redo operation

#### 36. Use Structural Comparison for History Snapshots

**File:** `remyx-core/src/core/History.js` (lines 45–52)

Snapshot deduplication compares full `innerHTML` strings. For large documents (10,000+ characters), this becomes a significant allocation. A rolling hash or content-length + checksum comparison would reduce allocation pressure.

**Estimated Impact:** Lower GC pressure during rapid editing; measurable in large documents

#### 37. Reduce Redundant DOM Queries in Selection.js

**File:** `remyx-core/src/core/Selection.js`

`getState()` calls `getComputedStyle()` and multiple `closest()` traversals. In the hot path (every keyup, mouseup, selection change), these queries add up. Caching `getComputedStyle` results for the current block element and invalidating on `content:change` would reduce work.

**Estimated Impact:** 10–15% faster `getState()` calls

---

### Medium — Bundle Size

#### 38. Tree-Shakeable CSS Imports

**Files:** `remyx-core/vite.config.js`, `remyx-core/src/themes/variables.css`

The entire `variables.css` (25+ KB) is imported as a single file. Splitting into `variables-base.css` (core layout, ~8 KB), `variables-themes.css` (color presets, ~10 KB), and `variables-components.css` (modals, menus, ~7 KB) would let consumers import only what they use.

**Estimated Impact:** 8–15 KB CSS savings for minimal-UI consumers

#### 39. Optimize Vite Dependency Pre-Bundling

**File:** `remyx-core/vite.config.js`

The Vite config does not specify `optimizeDeps.include` or `optimizeDeps.exclude`. Adding explicit includes for frequently used deps (`turndown`, `marked`) and excludes for optional deps (`mammoth`, `pdfjs-dist`) would speed up dev server cold starts.

**Estimated Impact:** 1–2s faster dev server startup

#### 40. Lazy-Load Heavy React Components Beyond Modals

**File:** `remyx-react/src/components/RemyxEditor.jsx`

`FindReplaceModal`, `ExportModal`, and `ImportDocumentModal` are already lazy-loaded, but `MenuBar` (~8 KB) and `ContextMenu` (~4 KB) are eagerly loaded even when `menuBar={false}` or `contextMenu={false}`. Conditionally lazy-loading these based on config would defer unused code.

**Estimated Impact:** 4–12 KB deferred for consumers who disable menus

---

### Medium — Autosave Optimizations

#### 41. Deduplicate Autosave Across Multiple Editor Instances

**File:** `remyx-core/src/core/AutosaveManager.js`

When multiple `RemyxEditor` instances share the same `autosave.key`, each creates its own `AutosaveManager` with independent timers. A shared singleton registry keyed by `(provider, key)` would prevent redundant saves and timer accumulation.

**Estimated Impact:** Prevents N× timer overhead for N editors with same key

#### 42. Block Autosave Init Until Recovery Check Completes

**File:** `remyx-react/src/hooks/useAutosave.js`

`manager.init()` is called immediately, then `manager.checkRecovery()` runs asynchronously. This means the first content change could trigger a save before recovery is checked, potentially overwriting recoverable content. Awaiting `checkRecovery()` before `init()` would prevent this race condition.

**Estimated Impact:** Prevents potential data loss on fast-typing page reloads

---

### Medium — CSS Performance

#### 43. Audit Unused CSS Rules

**File:** `remyx-core/src/themes/variables.css`

The stylesheet contains rules for all 9 modal types, 5 toolbar presets, 4 theme presets, and utility classes. Consumers using minimal configurations still load all rules. A PurgeCSS or CSS Modules approach at the consumer level would eliminate dead rules.

**Estimated Impact:** Up to 40% CSS size reduction for minimal configurations

#### 44. Use `contain: layout style` on Editor Root

**File:** `remyx-core/src/themes/variables.css` (`.rmx-editor` rule)

Adding CSS containment to the editor root would prevent style recalculations inside the editor from triggering layout on the host page, and vice versa.

**Estimated Impact:** Faster style recalculation in complex host pages

---

### Low — Event System

#### 45. Prevent Duplicate EventBus Handlers

**File:** `remyx-core/src/core/EventBus.js`

`on()` does not check for duplicate handler registration. Components that re-render without proper cleanup can accumulate duplicate handlers. Adding a `Set`-based deduplication or warning in dev mode would catch accidental leaks.

**Estimated Impact:** Prevents subtle bugs; no size change

#### 46. Propagate EventBus Handler Errors

**File:** `remyx-core/src/core/EventBus.js`

If an event handler throws, the error is swallowed and subsequent handlers still fire. Adding a `try/catch` per handler with `console.error` in dev mode (stripped by Terser in production) would improve debuggability without affecting production bundle size.

**Estimated Impact:** Better DX; no production impact

---

### Low — Component-Level Polish

#### 47. Consolidate `useEditorRect` Listeners

**File:** `remyx-react/src/hooks/useEditorRect.js`

The hook sets up both a `ResizeObserver` and a `scroll` listener. When multiple components use this hook (or when `FloatingToolbar` has its own position effect), listeners compete. A shared observable rect (single `ResizeObserver` + `IntersectionObserver`) would consolidate measurements.

**Estimated Impact:** 1–2 fewer layout reads per frame; cleaner architecture

#### 48. Reduce `useCallback` Overhead in MenuBar

**File:** `remyx-react/src/components/MenuBar/MenuBar.jsx`

Every menu item's `onClick` is wrapped in `useCallback` with `[engine]` dependency. Since `engine` is stable across the component's lifetime, these callbacks are effectively static. Replacing with a single event-delegated handler using `data-command` attributes would reduce hook call count.

**Estimated Impact:** ~20 fewer `useCallback` calls per render; cleaner code

---

## Updated Summary

| Priority | Items | Estimated Size Savings | Performance Gain |
| --- | --- | --- | --- |
| Critical | #1–#4 ✅ | ~75 KB saved + 2.6 MB worker | Modal load deferred |
| High | #5–#8 ✅ | ~10 KB (terser) | 30–40% fewer re-renders |
| Medium | #9–#13 ✅ | ~25 KB (tree-shake) | 10–15% CPU in hot paths |
| Low | #14–#17 ✅ | ~15 KB | Better DX |
| **Subtotal (v0.24.0)** | **17 items ✅** | **~145 KB + worker** | **Significant** |
| High (0.24.0 audit) | #18 ✅, #20 ✅, #19, #21 | — | 30–50% fewer re-renders |
| Medium (0.24.0 audit) | #22–#24 | ~16–24 KB | Memory savings |
| Low (0.24.0 audit) | #25 ✅, #27 ✅, #26 | — | Smoother UX |
| High (0.26.0 audit) | #28–#37 | — | 50–70% fewer hot-path ops |
| Medium (0.26.0 audit) | #38–#44 | ~12–27 KB CSS + JS | Race condition fix, faster dev |
| Low (0.26.0 audit) | #45–#48 | — | Better DX, fewer hooks |
| **Total** | **48 items (21 ✅, 27 open)** | **~185 KB + worker** | **Major** |
