# Optimization Roadmap — Remyx Editor

**Created:** 2026-03-15
**Version:** 0.23.0
**Scope:** File size reduction and runtime performance across all packages

---

## Current Bundle Sizes

| Package | ES Module | CJS | CSS |
| --- | --- | --- | --- |
| `@remyx/core` | 172 KB | 130 KB | 25.5 KB |
| `@remyx/react` | 91 KB | 63 KB | 2.3 KB |
| `remyx-editor` | 260 KB | 189 KB | 27.8 KB |
| PDF worker (per package) | 1,577 KB | 1,187 KB | — |

---

## Critical — Highest Impact

### 1. Eliminate Source Duplication Between `remyx-editor` and `@remyx/core`

`remyx-editor` contains complete copies of every core module (engine, commands, utils, plugins, constants, themes). This doubles maintenance and inflates the standalone bundle by ~50 KB.

**Current state:** Files are manually copied from `remyx-core/src/` to `remyx-editor/src/` with identical content.

**Target:** Refactor `remyx-editor` into a thin wrapper that re-exports from `@remyx/core` and only adds its own React components, hooks, and bundled CSS. The `remyx-editor` bundle should contain only the delta — not a second copy of the core.

**Estimated impact:** ~50 KB reduction in `remyx-editor` ES bundle.

---

### 2. Deduplicate CSS Across Packages

Theme CSS (`variables.css` at 1,317 lines, `dark.css` at 118 lines) is identical between `remyx-core` and `remyx-editor`. Users importing both get 25 KB of duplicate styles.

**Target:** Ship CSS from `@remyx/core` only. `@remyx/react` already imports via `@remyx/core/style.css`. `remyx-editor` should do the same internally during build instead of bundling its own copy.

**Estimated impact:** ~25 KB CSS reduction for users consuming multiple packages.

---

### 3. Make PDF Worker Opt-In

The `pdfjs-dist` worker file is 1.5 MB (ES) / 1.2 MB (CJS) and ships in every build even if the consumer never uses PDF import. `documentConverter.js` already lazy-loads the library at runtime, but Vite still bundles the worker.

**Options:**
- Configure Vite to externalize `pdfjs-dist` worker via `build.rollupOptions.external`
- Load worker from CDN at runtime (fallback already exists in `documentConverter.js`)
- Move `pdfjs-dist` to `optionalDependencies` or `peerDependencies`

**Estimated impact:** 1.5–2.6 MB removed from dist output per package.

---

### 4. Lazy-Load Modal Components

All modal components (`LinkModal`, `ImageModal`, `TablePickerModal`, `EmbedMediaModal`, `ExportModal`, `ImportDocumentModal`, `FindReplaceModal`, `AttachmentModal`) are statically imported in `RemyxEditor.jsx` but only rendered when the user opens them.

**Target:**
```jsx
const LinkModal = lazy(() => import('./Modals/LinkModal.jsx'))
const ImageModal = lazy(() => import('./Modals/ImageModal.jsx'))
// ...wrap renders in <Suspense fallback={null}>
```

**Estimated impact:** 20–30 KB deferred from initial load, loaded on-demand per modal.

---

## High — Significant Impact

### 5. Split Selection State Into Granular Atoms

`useSelection.js` returns a single object containing formats, `hasSelection`, `selectionRect`, `focusedImage`, and `focusedTable`. Any change to any field triggers a re-render of every component that reads selection state — including every toolbar button.

**Target:** Split into independent `useState` calls or use `useReducer` with selective updates. Components should only re-render when their specific slice changes.

**Estimated impact:** 30–40% reduction in React re-renders during editing.

---

### 6. Stabilize `useSelection` Event Handler

`handleSelectionChange` in `useSelection.js` is recreated on every render because it's not wrapped in `useCallback`. The `useEffect` that subscribes to `selection:change` depends on it, causing the listener to be torn down and reattached continuously.

**Fix:**
```js
const handleSelectionChange = useCallback((formats) => {
  setState(prev => ({ ...prev, ...formats }))
}, [])
```

**Estimated impact:** Eliminates unnecessary effect re-runs on every render cycle.

---

### 7. Debounce Window Resize/Scroll Listeners

`RemyxEditor.jsx` attaches `resize` and `scroll` handlers that call `getBoundingClientRect()` synchronously. During scroll or resize, this triggers layout recalculation on every frame.

**Target:** Debounce with 100–150 ms delay, or use `ResizeObserver` for the editor element and remove the window listener.

**Estimated impact:** Eliminates layout thrashing during scroll/resize.

---

### 8. Enable Terser Minification With Console Removal

Vite defaults to esbuild minification which is fast but produces slightly larger output than Terser. Production builds also retain `console.warn` and `console.error` calls.

**Target:**
```js
build: {
  minify: 'terser',
  terserOptions: {
    compress: { drop_console: true, passes: 2 },
  },
}
```

**Estimated impact:** 8–12% size reduction across all bundles.

---

## Medium — Measurable Impact

### 9. Split `documentConverter.js` by Format

This 391-line file handles 7 document formats (DOCX, PDF, Markdown, HTML, plaintext, CSV, RTF) in a single module. RTF conversion alone is 40+ lines of regex. Most consumers only need 1–2 formats.

**Target:** Split into `documentConverter/formats/docx.js`, `pdf.js`, `csv.js`, `rtf.js`, etc. with a dispatcher that dynamically imports only the needed converter.

**Estimated impact:** 15–25 KB tree-shakeable when unused formats are excluded.

---

### 10. Make Paste Cleaners Modular

`pasteClean.js` handles Microsoft Word, Google Docs, LibreOffice, and Apple Pages in a single pipeline. All regex patterns and cleanup passes run regardless of the paste source.

**Target:** Detect the paste source (Word uses `mso-*` classes, Google Docs uses `docs-internal` IDs) and run only the relevant cleaner. Export individual cleaners for consumers who want minimal bundles.

**Estimated impact:** 5–10 KB for consumers who opt into minimal cleanup.

---

### 11. Cache DOM Queries in Selection Hot Path

`useSelection.js` runs `node.querySelector(':scope > img')` and `node.closest('table')` on every `selectionchange` event — which fires on every keystroke and mouse movement.

**Target:** Cache the focused image/table reference in the `Selection` class and only update when `content:change` fires (which is less frequent than `selectionchange`).

**Estimated impact:** 10–15% CPU reduction during heavy editing in complex documents.

---

### 12. Refactor `RemyxEditor.jsx` Into Sub-Hooks

At 407 lines, `RemyxEditor.jsx` mixes portal logic, config resolution, state management, modal management, and rect tracking in a single component. This makes it hard to optimize individual concerns.

**Target:** Extract into `usePortalAttachment()`, `useResolvedConfig()`, `useEditorRect()` hooks. Aim for <250 lines in the main component.

**Estimated impact:** Enables fine-grained memoization and easier future optimization.

---

### 13. Restrict CSS Universal Selector

```css
.rmx-editor *, .rmx-editor *::before, .rmx-editor *::after {
  box-sizing: border-box;
}
```

This applies to every descendant element. In large documents with thousands of elements, the browser must evaluate this selector for every node.

**Target:** Scope to direct children and known element types, or use `inherit` from `.rmx-editor`.

**Estimated impact:** Minor CSS parsing speedup in large documents.

---

## Low — Polish

### 14. Hide Sourcemaps From Distribution

Production builds include sourcemaps that add ~10 KB per bundle. Consumers rarely need library sourcemaps.

**Target:** Set `build.sourcemap: 'hidden'` or `false` for production builds.

**Estimated impact:** ~10 KB per bundle removed from published packages.

---

### 15. Document Tree-Shaking Best Practices

Consumers importing `* from '@remyx/core'` pull in all commands and utilities. Document minimal import patterns:

```js
// Minimal — tree-shakeable
import { EditorEngine, Sanitizer } from '@remyx/core'

// Full — pulls everything
import * as Remyx from '@remyx/core'
```

**Estimated impact:** Helps consumers achieve smaller bundles without code changes.

---

### 16. Lazy-Load Theme Configuration Utilities

`themeConfig.js` (328 lines) with `createTheme()`, `applyTheme()`, and the full `THEME_VARIABLES` map is bundled for all consumers even though most use the default theme.

**Target:** Provide as a separate subpath export: `import { createTheme } from '@remyx/core/theme'`.

**Estimated impact:** ~5 KB reduction for consumers not using custom themes.

---

### 17. Wrap `Toolbar` in `React.memo`

The `Toolbar` component itself is not wrapped in `React.memo`, so it re-renders whenever its parent renders — even if `config`, `engine`, and `selectionState` haven't changed. Individual toolbar items (`ToolbarButton`, `ToolbarDropdown`, etc.) are already memoized but the parent is not.

**Estimated impact:** 20–30% fewer component tree re-renders during editing.

---

## Summary

| Priority | Items | Estimated Size Savings | Performance Gain |
| --- | --- | --- | --- |
| Critical | #1–#4 | ~95 KB + 2.6 MB worker | Modal load deferred |
| High | #5–#8 | ~10 KB (terser) | 30–40% fewer re-renders |
| Medium | #9–#13 | ~25 KB (tree-shake) | 10–15% CPU in hot paths |
| Low | #14–#17 | ~15 KB | Better DX |
| **Total** | **17 items** | **~145 KB + worker** | **Significant** |
