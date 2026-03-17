![Remyx Editor](./images/Remyx-Logo.svg)

# Task Reference — Remyx Editor

**Last updated:** 2026-03-17
**Version:** 0.27.0

A single reference for every bug, security fix, cleanup item, and optimization across the Remyx Editor monorepo. Say **"do task 42"** or **"do Sanitizer LRU Cache"** and it gets done.

Replaces: ~~BUGS.md~~, ~~SECURITY.md~~, ~~CLEANUP.md~~, ~~OPTIMIZATION.md~~

---

## How to Read This File

- **Status:** ✅ = done, 🔲 = open
- **Category prefix:** `BUG`, `SEC`, `CLN`, `OPT`
- **Priority:** Critical / High / Medium / Low / Info
- Each task has a unique **number** and a short **title**. Use either to reference it.

---

## Bugs

| # | Title | Priority | Status | Package | File(s) |
|---|-------|----------|--------|---------|---------|
| 1 | Uninitialized `isMarkdownMode` | Critical | ✅ | core | `EditorEngine.js` |
| 2 | AutolinkPlugin event listener leak | High | ✅ | core | `AutolinkPlugin.js` |
| 3 | `dangerouslySetInnerHTML` unsanitized fallback | High | ✅ | react | `ImportDocumentModal.jsx` |
| 4 | FindReplace index wrap after last replace | Medium | ✅ | core | `findReplace.js` |
| 5 | `splitCell` creates `<td>` in `<thead>` | Medium | ✅ | core | `tables.js` |
| 6 | `Selection.restore()` silent failure | Medium | ✅ | core | `Selection.js` |
| 7 | History undo/redo MutationObserver race | Low | ✅ | core | `History.js` |
| 8 | FindReplace negative index access | Low | ✅ | core | `findReplace.js` |
| 9 | `useContextMenu` stale engine closure | Low | ✅ Not a bug | react | `useContextMenu.js` |
| 10 | Paste font regex attribute order | Low | ✅ | core | `pasteClean.js` |
| 11 | ImageResizeHandles null crash | High | ✅ | react | `ImageResizeHandles.jsx` |
| 12 | ImageResizeHandles division by zero | Medium | ✅ | react | `ImageResizeHandles.jsx` |
| 13 | `useSelection` getRangeAt race | Low | ✅ | react | `useSelection.js` |
| 14 | Form submit listener accumulation | Low | ✅ | react | `usePortalAttachment.js` |
| 15 | Stale selection offset in `restore()` | Low | ✅ | core | `Selection.js` |
| 16 | Unused `sourceMode` state variable | Low | ✅ | react | `RemyxEditor.jsx` |
| 140 | Clipboard file upload race condition (multi-file) | High | ✅ | core | `Clipboard.js` |
| 141 | `splitCell` wrong column in multi-row tables | High | ✅ | core | `tables.js` |
| 142 | `useAutosave` stale `onRecover` closure | Medium | ✅ | react | `useAutosave.js` |
| 143 | History stale snapshot comparison (whitespace) | Medium | ✅ | core | `History.js` |
| 144 | `useRemyxEditor` form submit listener leak on DOM removal | Medium | ✅ | react | `useRemyxEditor.js` |

**21 resolved, 0 open.**

---

## Security

| # | Title | Priority | Status | Package | File(s) |
|---|-------|----------|--------|---------|---------|
| 17 | Markdown parser raw HTML pass-through | Critical | ✅ | core | `markdownConverter.js` |
| 18 | Data URI SVG with embedded scripts | High | ✅ | core | `images.js`, `Clipboard.js`, `DragDrop.js` |
| 19 | Iframe embeds missing `sandbox` | High | ✅ | core | `media.js` |
| 20 | PDF export unsanitized `document.write()` | High | ✅ | core | `exportUtils.js` |
| 21 | Incomplete protocol validation on URLs | Medium | ✅ | core | `Sanitizer.js`, `links.js`, `useContextMenu.js` |
| 22 | Dangerous tags unwrapped not removed | Medium | ✅ | core | `Sanitizer.js` |
| 23 | No explicit `on*` event handler blocking | Medium | ✅ | core | `Sanitizer.js` |
| 24 | Iframe `allow` attribute not validated | Medium | ✅ | core | `schema.js` |
| 25 | Paste cleaning misses inline SVG | Medium | ✅ | core | `pasteClean.js` |
| 26 | Document import HTML pass-through | Medium | ✅ | core | `documentConverter.js` |
| 27 | No file size limits on image paste/drop | Low | ✅ | core | `Clipboard.js`, `DragDrop.js` |
| 28 | History restores raw innerHTML | Low | ✅ | core | `History.js` |
| 29 | `input` tag not restricted to checkbox | Low | ✅ | core | `Sanitizer.js` |
| 30 | `contenteditable` allowed on div | Low | ✅ | core | `schema.js` |
| 31 | CSS value injection (legacy) | Low | ✅ | core | `Sanitizer.js` |
| 32 | Google Fonts leaks usage data | Info | ✅ Documented | core | `fontConfig.js` |
| 33 | External image URLs as tracking pixels | Info | ✅ Documented | core | `images.js` |
| 34 | `document.execCommand` deprecated API | Info | ✅ Documented | core | `fontControls.js` |
| 35 | Plugin system unrestricted engine access | Info | ✅ | core | `PluginManager.js`, `createPlugin.js` |
| 36 | `dangerouslySetInnerHTML` import preview | Medium | ✅ | react | `ImportDocumentModal.jsx` |
| 37 | CSS style assignments without validation | Medium | ✅ | core/react | `fontControls.js`, `images.js` |
| 38 | Unvalidated attachment URLs | Medium | ✅ | core | `attachments.js` |
| 39 | Async file upload race condition | Medium | 🔲 | core | `Clipboard.js`, `DragDrop.js` |
| 40 | `Selection.insertHTML()` unsanitized | Medium | ✅ | core | `Selection.js` |
| 41 | innerHTML restoration in React hooks | Medium | ✅ | react | `usePortalAttachment.js`, `useRemyxEditor.js` |
| 42 | Unsafe `Object.assign` on DOM styles | Low | ✅ | react | `useRemyxEditor.js` |
| 43 | Unvalidated URL inputs in modal forms | Low | ✅ | react | `ImageModal.jsx`, `LinkModal.jsx`, etc. |
| 44 | Theme/className interpolation unvalidated | Low | ✅ | react | `RemyxEditor.jsx`, `useRemyxEditor.js` |
| 45 | Weak randomness for element IDs | Info | ✅ Documented | core | `dom.js` |
| 46 | Pin third-party dependency versions | Medium | 🔲 | core | `package.json` |
| 47 | Source mode sanitization notification | Low | 🔲 | react | — |
| 145 | AutolinkPlugin regex DoS (catastrophic backtracking) | High | ✅ | core | `AutolinkPlugin.js` |
| 146 | LinkModal protocol blacklist incomplete (XSS bypass) | High | ✅ | react | `LinkModal.jsx` |
| 147 | ImageModal allows `data:image/svg+xml` XSS | Medium | ✅ | react | `ImageModal.jsx` |
| 148 | `Selection.insertHTML()` has no caller guardrail | Medium | ✅ | core | `Selection.js` |
| 149 | CLI project name allows path traversal | Medium | ✅ | cli | `create/index.js` |

**32 resolved, 3 open.**

---

## Cleanup

| # | Title | Priority | Status | Package | Notes |
|---|-------|----------|--------|---------|-------|
| 48 | Remove duplicate `remyx-editor` package | Critical | ✅ | all | Package deleted entirely |
| 49 | Set up test infrastructure | High | ✅ | all | Jest + jsdom configured |
| 50 | Core engine tests | High | ✅ | core | EditorEngine, commands, sanitizer, history, plugins, utils |
| 51 | React hook tests | High | ✅ | react | useContextMenu, useEditorEngine, etc. |
| 52 | React component tests | High | ✅ | react | RemyxEditor rendering tests |
| 53 | ~~E2E tests~~ | High | 🔲 | all | Removed (no production web server); revisit later |
| 54 | Package metadata (`description`, `keywords`, etc.) | High | ✅ | core/react | Both packages updated |
| 55 | Add `sideEffects` field | High | ✅ | core/react | `["*.css"]` for core, `false` for react |
| 56 | Add `tsconfig.json` | High | ✅ | all | Root tsconfig, `npm run typecheck` |
| 57 | Bundle analysis tooling | High | ✅ | all | `rollup-plugin-visualizer`, `npm run analyze:*` |
| 58 | Error handling — unhandled promise rejections | High | ✅ | react | Try/catch in all modals |
| 59 | Error handling — EditorEngine init | High | ✅ | core | `editor:error` event on failure |
| 60 | Error handling — file upload errors | High | ✅ | core | `upload:error` event |
| 61 | Error handling — plugin init/destroy | High | ✅ | core | `plugin:error` event |
| 62 | Refactor `RemyxEditor.jsx` into sub-hooks | High | ✅ | react | Extracted 3 hooks, ~230 lines |
| 63 | Refactor command registration loop | High | ✅ | react | `COMMAND_REGISTRARS` array pattern |
| 64 | Toolbar `React.memo` | Medium | ✅ | react | Wrapped all toolbar components |
| 65 | Accessibility — WAI-ARIA menu pattern | Medium | ✅ | react | Full menubar/menu/menuitem roles |
| 66 | Accessibility — focus trapping in modals | Medium | ✅ | react | Tab cycle + focus restore |
| 67 | Accessibility — skip navigation link | Medium | ✅ | react | "Skip to editor content" |
| 68 | Accessibility — `baseHeadingLevel` prop | Medium | ✅ | react | Heading offset for host page |
| 69 | `useSelection` split + shallowEqual | Medium | ✅ | react | Format/UI state separated |
| 70 | `useEffect` dependency suppression docs | Medium | ✅ | react | All 3 instances annotated |
| 71 | JSDoc type annotations on all core modules | Medium | ✅ | core | 8 modules annotated |
| 72 | Inline styles moved to CSS classes | Medium | ✅ | react | `StatusBar`, `ImportDocumentModal` |
| 73 | CSS `variables.css` section headers | Medium | ✅ | core | Clear comment organization |
| 74 | Magic numbers extracted to constants | Low | ✅ | core/react | 4 constants extracted |
| 75 | Remove unnecessary React default imports | Low | ✅ | react | 16 files cleaned |
| 76 | `.gitignore` updated | Low | ✅ | all | `.claude/`, `coverage/`, etc. |
| 77 | CONTRIBUTING.md | Low | ✅ | docs | Setup, architecture, PR process |
| 78 | CHANGELOG.md | Low | ✅ | docs | Keep-a-Changelog format |
| 79 | LICENSE file | Low | ✅ | root | MIT license |
| 80 | Pin devDependency versions | Low | ✅ | all | Exact versions, no `^` |
| 81 | ErrorBoundary component | Low | ✅ | react | `EditorErrorBoundary` + `onError` prop |
| 82 | Lazy-load heavy modules (PDF, DOCX) | Low | ✅ | core | Dynamic imports per format |
| 83 | Pre-commit hooks (Husky + lint-staged) | Low | ✅ | all | `*.{js,jsx}` auto-linted |
| 84 | GitHub Actions CI | Low | ✅ | all | lint, build, test on push/PR |
| 85 | ESLint config — test globals, node env | High | ✅ | all | Config blocks added |
| 86 | React hooks violations — ref access patterns | High | ✅ | react | Documented intentional patterns |
| 87 | Dead code removal | Medium | ✅ | all | 5 files cleaned |
| 88 | React Refresh compatibility | Medium | ✅ | react | Moved `useRemyxConfig` to own file |
| 89 | Version mismatch — `@remyxjs/core` devDep | Low | ✅ | react | Updated to 0.24.0 |
| 90 | Missing React hook test coverage | Low | 🔲 | react | Needs `@testing-library/react-hooks` |
| 91 | Missing React component test coverage | Low | 🔲 | react | Needs full rendering setup |
| 150 | Inconsistent modal error handling UX | Medium | 🔲 | react | All modal components |
| 151 | FloatingToolbar magic numbers for positioning | Low | 🔲 | react | `FloatingToolbar.jsx` |
| 152 | Missing PropTypes on ContextMenu component | Low | 🔲 | react | `ContextMenu.jsx` |
| 153 | CLI hardcoded version string (`v0.24.0`) | Low | 🔲 | cli | `create/index.js` |
| 154 | CLI hardcoded dependency versions in scaffolded `package.json` | Low | 🔲 | cli | `create/index.js` |
| 155 | CLI `copyDir` lacks error handling | Low | 🔲 | cli | `create/index.js` |
| 156 | CLI theme injection overly broad string replace | Low | 🔲 | cli | `create/index.js` |
| 157 | Deprecated `create-remyx` package still has `bin` entry | Low | 🔲 | cli | `create-remyx/package.json` |

**89 resolved, 10 open.**

---

## Optimizations

| # | Title | Priority | Status | Package | Estimated Impact |
|---|-------|----------|--------|---------|-----------------|
| 92 | Eliminate source duplication (`remyx-editor`) | Critical | ✅ | all | ~75 KB saved |
| 93 | Deduplicate CSS across packages | Critical | ✅ | core | CSS from core only |
| 94 | Make PDF worker opt-in | Critical | ✅ | core | 2.6 MB worker deferred |
| 95 | Lazy-load modal components | Critical | ✅ | react | ~20–30 KB deferred |
| 96 | Split selection state into granular atoms | High | ✅ | react | 30–40% fewer re-renders |
| 97 | Stabilize `useSelection` event handler | High | ✅ | react | Already stable |
| 98 | Debounce window resize/scroll listeners | High | ✅ | react | `ResizeObserver` + rAF |
| 99 | Enable Terser with console removal | High | ✅ | all | ~10 KB saved |
| 100 | Split `documentConverter.js` by format | Medium | ✅ | core | ~25 KB tree-shakeable |
| 101 | Modular paste cleaners | Medium | ✅ | core | Source-specific pipelines |
| 102 | Cache DOM queries in selection hot path | Medium | ✅ | react | `useRef` cache |
| 103 | Refactor `RemyxEditor.jsx` into sub-hooks | Medium | ✅ | react | 3 extracted hooks |
| 104 | Restrict CSS universal selector | Medium | ✅ | core | `inherit` instead of `border-box` |
| 105 | Hide sourcemaps from distribution | Low | ✅ | all | Smaller dist |
| 106 | Document tree-shaking best practices | Low | ✅ | core | README section |
| 107 | Lazy-load theme config utilities | Low | ✅ | core | 3 tree-shakeable modules |
| 108 | Wrap `Toolbar` in `React.memo` | Low | ✅ | react | Fewer toolbar re-renders |
| 109 | `React.memo` on remaining high-freq components | High | ✅ | react | 30–40% fewer renders |
| 110 | Replace `selectionState` prop drilling with Context | High | 🔲 | react | 20–25% fewer cascading re-renders |
| 111 | Batch DOM reads in FloatingToolbar positioning | High | ✅ | react | 10–15ms saved per selection change |
| 112 | WeakMap DOM caching in `useSelection` | High | 🔲 | react | 15–20% faster selection updates |
| 113 | Granular sub-exports for tree-shaking | Medium | 🔲 | core | 8–12 KB savings |
| 114 | Split icon bundle into lazy chunks | Medium | 🔲 | react | 8–12 KB deferred |
| 115 | Event delegation for document-level listeners | Medium | 🔲 | react | ~2–3 KB memory per instance |
| 116 | `will-change` for animated elements | Low | ✅ | core | Smoother animations |
| 117 | FileReader progress for large images | Low | 🔲 | react | Better upload UX |
| 118 | Cache focusable elements in ModalOverlay | Low | ✅ | react | 5–8ms faster focus trap |
| 119 | Memoize `useResolvedConfig` return value | High | 🔲 | react | 15–20% fewer cascading re-renders |
| 120 | Deduplicate toolbar config resolution | High | 🔲 | react | Minor CPU savings |
| 121 | Stabilize `RemyxConfigProvider` context value | High | 🔲 | react | Prevents full-tree re-render |
| 122 | Granular `useSelection` state splits | High | 🔲 | react | 20–30% fewer re-renders |
| 123 | Reduce unmemoized object creation in `RemyxEditor` | High | 🔲 | react | 10–15% fewer child re-renders |
| 124 | Virtualize FloatingToolbar position calculation | High | 🔲 | react | 5–10ms per selection change |
| 125 | Throttle MutationObserver in History | High | 🔲 | core | 50–70% fewer `innerHTML` reads |
| 126 | Cache sanitizer results (LRU) | High | 🔲 | core | 3–5ms per undo/redo |
| 127 | Structural comparison for history snapshots | High | 🔲 | core | Lower GC pressure |
| 128 | Reduce redundant DOM queries in Selection.js | High | 🔲 | core | 10–15% faster `getState()` |
| 129 | Tree-shakeable CSS imports | Medium | 🔲 | core | 8–15 KB CSS savings |
| 130 | Optimize Vite dependency pre-bundling | Medium | 🔲 | core | 1–2s faster dev start |
| 131 | Lazy-load MenuBar/ContextMenu when disabled | Medium | 🔲 | react | 4–12 KB deferred |
| 132 | Deduplicate autosave across editor instances | Medium | 🔲 | core | Prevents N× timer overhead |
| 133 | Block autosave init until recovery check | Medium | 🔲 | react | Prevents data loss race |
| 134 | Audit unused CSS rules | Medium | 🔲 | core | Up to 40% CSS savings |
| 135 | `contain: layout style` on editor root | Medium | 🔲 | core | Faster style recalc |
| 136 | Prevent duplicate EventBus handlers | Low | 🔲 | core | Prevents subtle bugs |
| 137 | Propagate EventBus handler errors | Low | 🔲 | core | Better DX |
| 138 | Consolidate `useEditorRect` listeners | Low | 🔲 | react | Fewer layout reads |
| 139 | Reduce `useCallback` overhead in MenuBar | Low | 🔲 | react | ~20 fewer hook calls |
| 158 | AutolinkPlugin triple regex on same text | Medium | 🔲 | core | ~60–80% CPU reduction |
| 159 | `useSelection` handler not memoized with `useCallback` | Medium | 🔲 | react | Fewer re-renders |
| 160 | CommandPalette rebuilds full command list on engine change | Medium | 🔲 | react | Cache command list |
| 161 | CodeEditor re-highlights on every keystroke (no debounce) | Medium | 🔲 | react | Major perf win for long code |
| 162 | TablePickerModal recreates 10×10 grid every render | Medium | 🔲 | react | Memoize grid or event delegation |
| 163 | StatusBar `wordcount:update` triggers re-render on same values | Low | 🔲 | react | Shallow compare counts |
| 164 | `useEditorRect` re-attaches listeners on `ready` toggle | Low | 🔲 | react | Remove `ready` from deps |
| 165 | ModalOverlay focus trap recalculates on every Tab keystroke | Low | 🔲 | react | Cache on modal open |

**21 resolved, 35 open.**

---

## Quick Stats

| Category | Total | Done | Open |
|----------|-------|------|------|
| Bugs | 21 | 21 | 0 |
| Security | 36 | 32 | 3 |
| Cleanup | 52 | 42 | 10 |
| Optimizations | 56 | 21 | 35 |
| **Total** | **165** | **116** | **48** |

---

## Open Tasks by Priority

### High
| # | Title | Category |
|---|-------|----------|
| 110 | Replace `selectionState` prop drilling with Context | OPT |
| 112 | WeakMap DOM caching in `useSelection` | OPT |
| 119 | Memoize `useResolvedConfig` return value | OPT |
| 120 | Deduplicate toolbar config resolution | OPT |
| 121 | Stabilize `RemyxConfigProvider` context value | OPT |
| 122 | Granular `useSelection` state splits | OPT |
| 123 | Reduce unmemoized object creation in `RemyxEditor` | OPT |
| 124 | Virtualize FloatingToolbar position calculation | OPT |
| 125 | Throttle MutationObserver in History | OPT |
| 126 | Cache sanitizer results (LRU) | OPT |
| 127 | Structural comparison for history snapshots | OPT |
| 128 | Reduce redundant DOM queries in Selection.js | OPT |

### Medium
| # | Title | Category |
|---|-------|----------|
| 39 | Async file upload race condition | SEC |
| 46 | Pin third-party dependency versions | SEC |
| 150 | Inconsistent modal error handling UX | CLN |
| 113 | Granular sub-exports for tree-shaking | OPT |
| 114 | Split icon bundle into lazy chunks | OPT |
| 115 | Event delegation for document-level listeners | OPT |
| 129 | Tree-shakeable CSS imports | OPT |
| 130 | Optimize Vite dependency pre-bundling | OPT |
| 131 | Lazy-load MenuBar/ContextMenu when disabled | OPT |
| 132 | Deduplicate autosave across editor instances | OPT |
| 133 | Block autosave init until recovery check | OPT |
| 134 | Audit unused CSS rules | OPT |
| 135 | `contain: layout style` on editor root | OPT |
| 158 | AutolinkPlugin triple regex on same text | OPT |
| 159 | `useSelection` handler not memoized with `useCallback` | OPT |
| 160 | CommandPalette rebuilds full command list on engine change | OPT |
| 161 | CodeEditor re-highlights on every keystroke (no debounce) | OPT |
| 162 | TablePickerModal recreates 10×10 grid every render | OPT |

### Low
| # | Title | Category |
|---|-------|----------|
| 47 | Source mode sanitization notification | SEC |
| 90 | Missing React hook test coverage | CLN |
| 91 | Missing React component test coverage | CLN |
| 151 | FloatingToolbar magic numbers for positioning | CLN |
| 152 | Missing PropTypes on ContextMenu component | CLN |
| 153 | CLI hardcoded version string (`v0.24.0`) | CLN |
| 154 | CLI hardcoded dependency versions in scaffolded `package.json` | CLN |
| 155 | CLI `copyDir` lacks error handling | CLN |
| 156 | CLI theme injection overly broad string replace | CLN |
| 157 | Deprecated `create-remyx` package still has `bin` entry | CLN |
| 117 | FileReader progress for large images | OPT |
| 136 | Prevent duplicate EventBus handlers | OPT |
| 137 | Propagate EventBus handler errors | OPT |
| 138 | Consolidate `useEditorRect` listeners | OPT |
| 139 | Reduce `useCallback` overhead in MenuBar | OPT |
| 163 | StatusBar `wordcount:update` triggers re-render on same values | OPT |
| 164 | `useEditorRect` re-attaches listeners on `ready` toggle | OPT |
| 165 | ModalOverlay focus trap recalculates on every Tab keystroke | OPT |
