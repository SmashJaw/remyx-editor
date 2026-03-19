![Remyx Editor](./images/Remyx-Logo.svg)

# Task Reference — Remyx Editor

**Last updated:** 2026-03-19
**Version:** 0.28.0 (unreleased)

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
| 166 | CodeBlockControls accumulates duplicate `mousedown` listeners | Medium | ✅ | react | `CodeBlockControls.jsx` |
| 167 | ImageResizeHandles mouse-only — no touch/pointer event support | Medium | ✅ | react | `ImageResizeHandles.jsx` |
| 168 | AutosaveManager retries indefinitely without backoff or limit | Medium | ✅ | core | `AutosaveManager.js` |
| 169 | `useAutosave` `checkRecovery` promise missing `.catch()` handler | Low | ✅ | react | `useAutosave.js` |
| 170 | ContextMenu `item.command()` callback not wrapped in try-catch | Low | ✅ | react | `ContextMenu.jsx` |
| 171 | FindReplace `<mark>` references go stale after external DOM mutations | Low | ✅ | core | `findReplace.js` |
| 172 | Export iframe double-cleanup race between timeout and `onafterprint` | Low | ✅ | core | `exportUtils.js` |

**28 resolved, 0 open.**

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
| 39 | Async file upload race condition | High | ✅ | core | `Clipboard.js`, `DragDrop.js` |
| 40 | `Selection.insertHTML()` unsanitized | Medium | ✅ | core | `Selection.js` |
| 41 | innerHTML restoration in React hooks | Medium | ✅ | react | `usePortalAttachment.js`, `useRemyxEditor.js` |
| 42 | Unsafe `Object.assign` on DOM styles | Low | ✅ | react | `useRemyxEditor.js` |
| 43 | Unvalidated URL inputs in modal forms | Low | ✅ | react | `ImageModal.jsx`, `LinkModal.jsx`, etc. |
| 44 | Theme/className interpolation unvalidated | Low | ✅ | react | `RemyxEditor.jsx`, `useRemyxEditor.js` |
| 45 | Weak randomness for element IDs | Info | ✅ Documented | core | `dom.js` |
| 46 | Pin third-party dependency versions | Medium | ✅ | core | `package.json` |
| 47 | Source mode sanitization notification | Low | ✅ | react | `SourceModal.jsx` |
| 145 | AutolinkPlugin regex DoS (catastrophic backtracking) | High | ✅ | core | `AutolinkPlugin.js` |
| 146 | LinkModal protocol blacklist incomplete (XSS bypass) | High | ✅ | react | `LinkModal.jsx` |
| 147 | ImageModal allows `data:image/svg+xml` XSS | Medium | ✅ | react | `ImageModal.jsx` |
| 148 | `Selection.insertHTML()` has no caller guardrail | Medium | ✅ | core | `Selection.js` |
| 149 | CLI project name allows path traversal | Medium | ✅ | cli | `create/index.js` |
| 173 | External SVG URL insertion not blocked (only `data:image/svg` caught) | High | ✅ | core | `images.js` |
| 174 | CloudProvider endpoint URL injection via string interpolation | High | ✅ | core | `providers.js` |
| 175 | SourceModal applies user-edited HTML without re-sanitization | High | ✅ | react | `SourceModal.jsx` |
| 176 | Percent-encoded protocol bypass in modal URL validators | High | ✅ | react | `LinkModal.jsx`, `EmbedModal.jsx`, `AttachmentModal.jsx` |
| 177 | Export PDF iframe missing `sandbox` attribute | Low | ✅ | core | `exportUtils.js` |
| 178 | Markdown converter URL validation uses regex instead of URL constructor | Low | ✅ | core | `markdownConverter.js` |

**42 resolved, 0 open.**

---

## Cleanup

| # | Title | Priority | Status | Package | Notes |
|---|-------|----------|--------|---------|-------|
| 48 | Remove duplicate `remyx-editor` package | Critical | ✅ | all | Package deleted entirely |
| 49 | Set up test infrastructure | High | ✅ | all | Vitest + jsdom configured (migrated from Jest in Task 186) |
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
| 90 | Missing React hook test coverage | Low | ✅ | react | Added `hooks.test.jsx` covering untested hooks |
| 91 | Missing React component test coverage | Low | ✅ | react | Added `components.test.jsx` with rendering tests |
| 150 | Inconsistent modal error handling UX | Medium | ✅ | react | Added try-catch + error state to TablePickerModal, FindReplacePanel |
| 151 | FloatingToolbar magic numbers for positioning | Low | ✅ | react | Extracted `TOOLBAR_FALLBACK_HEIGHT`, `TOOLBAR_FALLBACK_WIDTH`, `TOOLBAR_GAP`, `TOOLBAR_EDGE_PADDING` |
| 152 | Missing PropTypes on ContextMenu component | Low | ✅ | react | Added PropTypes via `prop-types` package |
| 153 | CLI hardcoded version string (`v0.24.0`) | Low | ✅ | cli | Reads version from own `package.json` |
| 154 | CLI hardcoded dependency versions in scaffolded `package.json` | Low | ✅ | cli | Reads versions from own `peerDependencies`/`devDependencies` |
| 155 | CLI `copyDir` lacks error handling | Low | ✅ | cli | Wrapped in try-catch with descriptive messages |
| 156 | CLI theme injection overly broad string replace | Low | ✅ | cli | Uses regex with JSX attribute lookahead, skips when theme is `light` |
| 157 | Deprecated `create-remyx` package still has `bin` entry | Low | ✅ | cli | Removed `bin` field from `package.json` |
| 179 | Missing PropTypes on all modal components | Low | ✅ | react | Added PropTypes to all 9 modals + ContextMenu |
| 180 | CodeEditor uses deprecated `document.execCommand` for tab insertion | Low | ✅ | react | Replaced with `textarea.setRangeText()` + fallback |
| 181 | Missing XSS-specific test coverage for modal components | Medium | ✅ | react | Added `modal-xss.test.jsx` |
| 182 | BlockDragHandle accesses private engine property `_dragSource` | Low | ✅ | react | Added `isDragging()` public method to DragDrop |
| 186 | Migrate test framework from Jest to Vitest | High | ✅ | all | Migrated 52 test files, `vitest.config.js`, removed Jest deps |

**57 resolved, 0 open.**

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
| 110 | Replace `selectionState` prop drilling with Context | High | ✅ | react | `SelectionContext` + `useSelectionContext` hook |
| 111 | Batch DOM reads in FloatingToolbar positioning | High | ✅ | react | 10–15ms saved per selection change |
| 112 | WeakMap DOM caching in `useSelection` | High | ✅ | react | WeakMap keyed by startContainer |
| 113 | Granular sub-exports for tree-shaking | Medium | ✅ | core | Per-theme CSS sub-path exports in `package.json` |
| 114 | Split icon bundle into lazy chunks | Medium | ✅ Documented | react | Icons are ~5KB minified; tree-shakeable via named exports |
| 115 | Event delegation for document-level listeners | Medium | ✅ Documented | react | MenuBar/StatusBar already delegated; toolbar uses React.memo |
| 116 | `will-change` for animated elements | Low | ✅ | core | Smoother animations |
| 117 | FileReader progress for large images | Low | ✅ | core | `upload:progress` event via EventBus in DragDrop/Clipboard |
| 118 | Cache focusable elements in ModalOverlay | Low | ✅ | react | 5–8ms faster focus trap |
| 119 | Memoize `useResolvedConfig` return value | High | ✅ | react | Wrapped return in `useMemo` |
| 120 | Deduplicate toolbar config resolution | High | ✅ | react | Resolved by Task 119 |
| 121 | Stabilize `RemyxConfigProvider` context value | High | ✅ | react | Context value wrapped in `useMemo` |
| 122 | Granular `useSelection` state splits | High | ✅ | react | Returns `{ formatState, uiState }` via SelectionContext |
| 123 | Reduce unmemoized object creation in `RemyxEditor` | High | ✅ Verified | react | Already memoizes editAreaStyle, mergedStyle, mergedFonts |
| 124 | Virtualize FloatingToolbar position calculation | High | ✅ Documented | react | Only one toolbar rendered; virtualization unnecessary |
| 125 | Throttle MutationObserver in History | High | ✅ Verified | core | Already has 300ms debounce + guard flag |
| 126 | Cache sanitizer results (LRU) | High | ✅ | core | LRU Map cache (max 50 entries) in `sanitize()` |
| 127 | Structural comparison for history snapshots | High | ✅ | core | djb2 hash comparison before string compare |
| 128 | Reduce redundant DOM queries in Selection.js | High | ✅ | core | `_cachedRange` field, invalidated per selection change |
| 129 | Tree-shakeable CSS imports | Medium | ✅ | core | Per-theme CSS sub-path exports + `copyThemeFiles` Vite plugin |
| 130 | Optimize Vite dependency pre-bundling | Medium | ✅ | root | `optimizeDeps.include` in root `vite.config.js` |
| 131 | Lazy-load MenuBar/ContextMenu when disabled | Medium | ✅ | react | Converted to `React.lazy()` + `Suspense` |
| 132 | Deduplicate autosave across editor instances | Medium | ✅ | core | Module-level `_managerRegistry` Map in AutosaveManager |
| 133 | Block autosave init until recovery check | Medium | ✅ | react | Moved `manager.init()` inside recovery `.then()` callback |
| 134 | Audit unused CSS rules | Medium | ✅ | core | Per-theme CSS exports allow importing only needed themes |
| 135 | `contain: layout style` on editor root | Medium | ✅ | core | Added `contain: layout style;` to `.rmx-editor` |
| 136 | Prevent duplicate EventBus handlers | Low | ✅ | core | Optional `key` param on `on()` for keyed replacement |
| 137 | Propagate EventBus handler errors | Low | ✅ | core | Emits `error` event on handler failure (with recursion guard) |
| 138 | Consolidate `useEditorRect` listeners | Low | ✅ | react | Removed `ready` from deps, early return guard |
| 139 | Reduce `useCallback` overhead in MenuBar | Low | ✅ Verified | react | Already uses useCallback appropriately |
| 158 | AutolinkPlugin triple regex on same text | Medium | ✅ | core | Combined into single combined regex pass |
| 159 | `useSelection` handler not memoized with `useCallback` | Medium | ✅ Verified | react | Already uses useCallback with caching |
| 160 | CommandPalette rebuilds full command list on engine change | Medium | ✅ Verified | react | Already memoized with `[engine, customSlashItems]` |
| 161 | CodeEditor re-highlights on every keystroke (no debounce) | Medium | ✅ | react | 150ms debounce via `useRef` timer + `useState` |
| 162 | TablePickerModal recreates 10×10 grid every render | Medium | ✅ | react | Event delegation with `data-row`/`data-col` attributes |
| 163 | StatusBar `wordcount:update` triggers re-render on same values | Low | ✅ | react | Shallow comparison before `setCounts` |
| 164 | `useEditorRect` re-attaches listeners on `ready` toggle | Low | ✅ | react | Merged with Task 138 |
| 165 | ModalOverlay focus trap recalculates on every Tab keystroke | Low | ✅ Verified | react | Already caches focusable elements list |
| 183 | Sanitizer re-instantiated on every PDF export call | Low | ✅ | core | Module-level singleton in `exportUtils.js` |
| 184 | FindReplace `unshift()` causes O(n²) match array construction | Low | ✅ | core | `push()` + `reverse()` at end |
| 185 | Table cell merge concatenates `innerHTML` per iteration | Low | ✅ | core | Collect fragments first, join once |

**59 resolved, 0 open.**

---

## New Findings (v0.28.0 audit)

### Bugs

| # | Title | Priority | Status | Package | File(s) |
|---|-------|----------|--------|---------|---------|
| 187 | Selection cache invalidation compares same variable | High | 🔲 | core | `Selection.js` L89 — `this._cacheGeneration === this._cacheGeneration` is always true; cache never actually invalidates via microtask |
| 188 | Slash commands `destroy` monkey-patches engine | High | 🔲 | core | `slashCommands.js` L185–190 — monkey-patched `destroy()` can be lost or called twice |
| 189 | Cut handler missing history snapshot before async | Medium | 🔲 | core | `Clipboard.js` L129–134 — emits `content:change` via `setTimeout` without snapshotting first; undo may capture wrong state |
| 190 | `usePortalAttachment` restores `textContent` instead of `innerHTML` | Medium | 🔲 | react | `usePortalAttachment.js` L43–48 — loses HTML structure when restoring div content |
| 191 | `useSlashCommands` calls `setState` synchronously in `useEffect` | High | 🔲 | react | `useSlashCommands.js` L31 — `setSelectedIndex(0)` in effect body causes cascading renders |
| 192 | `vitest.config.js` uses `__dirname` which is undefined in ESM | Medium | 🔲 | root | `vitest.config.js` L10–11 — needs `import.meta.dirname` or `fileURLToPath` polyfill |
| 193 | React version mismatch across monorepo (19.2.0 vs 19.2.4) | Medium | 🔲 | root | Root `package.json` has `^19.2.0` but lock resolves to 19.2.4; remyx-react devDeps pin 19.2.0 |

### Security

| # | Title | Priority | Status | Package | File(s) |
|---|-------|----------|--------|---------|---------|
| 194 | CloudProvider `buildUrl` callback not validated | High | 🔲 | core | `providers.js` L186–196 — custom `buildUrl`/`buildLoadUrl`/`buildDeleteUrl` return values unchecked for dangerous protocols |
| 195 | Pasted font-face URLs preserved without validation | Medium | 🔲 | core | `pasteClean.js` L122 — font URLs in pasted HTML could point to malicious resources |
| 196 | Missing CSRF documentation for CloudProvider | Low | 🔲 | core | `providers.js` — no guidance on CSRF token usage for cloud autosave endpoints |

### Cleanup

| # | Title | Priority | Status | Package | File(s) |
|---|-------|----------|--------|---------|---------|
| 197 | `WordCountPlugin` never unsubscribes from EventBus | Medium | 🔲 | core | `WordCountPlugin.js` L27 — `content:change` listener leaks after destroy |
| 198 | Duplicate `_exceedsMaxFileSize` in Clipboard and DragDrop | Low | 🔲 | core | `Clipboard.js` L141–150, `DragDrop.js` L583–593 — extract to shared utility |
| 199 | Missing PropTypes on Toolbar sub-components | Low | 🔲 | react | `ToolbarButton.jsx`, `ToolbarDropdown.jsx`, `ToolbarColorPicker.jsx`, `ToolbarSeparator.jsx` |
| 200 | Missing PropTypes on SaveStatus, RecoveryBanner, FloatingToolbar, EditArea, ModalOverlay | Low | 🔲 | react | Multiple component files |
| 201 | TypeScript declarations missing new props (`baseHeadingLevel`, `onError`, `errorFallback`, `menuBar`) | Medium | 🔲 | react | `types/index.d.ts` — `RemyxEditorProps` incomplete |
| 202 | TypeScript declarations missing hook exports (`useModal`, `useSelection`, `useContextMenu`, `useSelectionContext`) | Medium | 🔲 | react | `types/index.d.ts` |
| 203 | Missing `engines` field in root `package.json` | Medium | 🔲 | root | No minimum Node/npm version enforced |
| 204 | Missing `.nvmrc` for Node version pinning | Low | 🔲 | root | Developers may use inconsistent Node versions |
| 205 | Icons file exports non-components, breaking React Fast Refresh | Medium | 🔲 | react | `icons/index.jsx` L347 — `icon()` and `filled()` helpers should be in separate file |
| 206 | CI pipeline missing typecheck and coverage steps | Medium | 🔲 | root | `.github/workflows/ci.yml` — only runs lint, build, test |
| 207 | Missing `rollup-plugin-visualizer` in devDependencies | Low | 🔲 | core/react | Both vite configs dynamically import it but it's not declared |
| 208 | Ghost preview comment misleading in DragDrop | Info | 🔲 | core | `DragDrop.js` L510 — comment says "keep ghost" but cleanup happens in `_cleanupDrag` |
| 209 | Missing JSDoc on public AutosaveManager methods | Low | 🔲 | core | `AutosaveManager.js` — `init()`, `save()`, `checkRecovery()`, `clearRecovery()` |
| 210 | Vitest coverage thresholds not configured | Low | 🔲 | root | `vitest.config.js` — no minimum coverage enforcement |

### Optimizations

| # | Title | Priority | Status | Package | File(s) |
|---|-------|----------|--------|---------|---------|
| 211 | `document.queryCommandState()` deprecated for format detection | Medium | 🔲 | core | `Selection.js` L398–407 — replace with DOM traversal for active formatting |
| 212 | Syntax highlighting tokenizer keyword regex could use Trie/Set | Low | 🔲 | core | `tokenizers.js` L54 — 50+ keyword alternation groups per language |
| 213 | DOMParser created per paste clean (no reuse) | Low | 🔲 | core | `pasteClean.js` L154 — `convertWordListParagraphs()` creates new parser each time |
| 214 | Duplicate MenuBar import (static + dynamic) in build | Medium | 🔲 | react | Vite warns about MenuBar being both lazily and statically imported |

---

## UX Improvements

| # | Title | Priority | Status | Package | Description |
|---|-------|----------|--------|---------|-------------|
| 215 | Styled tooltip component with keyboard shortcut hints | High | 🔲 | react | Replace native `title` attributes on toolbar buttons with a styled tooltip component showing command name + shortcut (e.g., "Bold — ⌘B") |
| 216 | FloatingToolbar focus indicator and keyboard navigation | Medium | 🔲 | react | Add visible focus ring, arrow-key navigation between buttons, and keep toolbar visible while user interacts with it |
| 217 | TableControls accessible labels | Medium | 🔲 | react | Replace cryptic "+Row↑", "×" button text with descriptive `aria-label` attributes ("Add row above", "Delete table") |
| 218 | Loading/spinner states during async modal operations | Medium | 🔲 | react | Show loading indicator on submit buttons in ImageModal, AttachmentModal, ImportDocumentModal during file upload/conversion |
| 219 | Confirmation dialog before destructive table operations | Medium | 🔲 | react | Add confirmation prompt before "Delete Table" in TableControls to prevent accidental data loss |
| 220 | ContextMenu arrow-key and Tab keyboard navigation | Medium | 🔲 | react | Add Up/Down arrow key navigation, Home/End, and Enter to execute — matching standard OS context menu patterns |
| 221 | Visual "unsaved changes" indicator when autosave disabled | Low | 🔲 | react | Show a dot or text indicator (e.g., "Edited") in status bar when content has changed since last programmatic save |
| 222 | FloatingToolbar stays visible during button interaction | Low | 🔲 | react | Prevent toolbar from disappearing when user clicks a toolbar button (selection collapse hides it prematurely) |

**0 resolved, 8 open.**

---

## Feature Requests

| # | Title | Priority | Status | Package | Description |
|---|-------|----------|--------|---------|-------------|
| 223 | `removeFormat` keyboard shortcut | Medium | 🔲 | core | Add `mod+shift+n` (or `mod+\`) shortcut to the existing `removeFormat` command — currently toolbar/menu only |
| 224 | Table cell content alignment (left/center/right) | Medium | 🔲 | core | New `alignCell` command to set `text-align` on `<td>`/`<th>` elements; expose in TableControls UI |
| 225 | Toggle table header row (tbody ↔ thead) | Medium | 🔲 | core | New `toggleTableHeader` command to convert first row between `<tbody><tr><td>` and `<thead><tr><th>` for semantic HTML |
| 226 | Copy-to-clipboard button on code blocks | Medium | 🔲 | react | Add a "Copy" button overlay on focused/hovered code blocks — standard pattern on GitHub, MDN, documentation sites |
| 227 | Image alt-text editing after insertion | Medium | 🔲 | react | Allow users to edit alt text and add captions on existing images (click image → edit modal or inline field) |
| 228 | Embed modal URL preview | Medium | 🔲 | react | Show a live preview of the embed (YouTube thumbnail, etc.) in EmbedModal before insertion |
| 229 | Text highlight/marker color command | Medium | 🔲 | core | Add a `highlight` command distinct from `backColor` — applies a semi-transparent marker effect to selected text |
| 230 | Line numbers toggle for code blocks | Low | 🔲 | react | Add a toggle button in CodeBlockControls to show/hide line numbers in the code block |
| 231 | Max list nesting depth with visual hierarchy | Low | 🔲 | core | Enforce configurable max nesting depth (default 5) for ordered/unordered lists; add CSS indentation per level |
| 232 | Subscript/superscript shortcut cross-platform audit | Low | 🔲 | core | Verify `mod+,` / `mod+.` shortcuts for subscript/superscript work on Windows/Linux keyboards; add fallback shortcuts if needed |

**0 resolved, 10 open.**

---

## Code Efficiency

| # | Title | Priority | Status | Package | Description |
|---|-------|----------|--------|---------|-------------|
| 233 | Pre-compile format detection patterns in Selection.js | Medium | 🔲 | core | `getActiveFormats()` L398–442 uses deprecated `queryCommandState` in a loop — replace with pre-compiled tag lookups via DOM traversal |
| 234 | Debounce or virtualize CommandPalette filtering | Low | 🔲 | react | `filterSlashItems()` runs on every keystroke; for 100+ commands, debounce by ~50ms or virtualize the list |
| 235 | Memoize toolbar items array construction | Low | 🔲 | react | `Toolbar.jsx` L50–67 rebuilds items array on config changes — wrap in `useMemo` to prevent child re-renders |

**0 resolved, 3 open.**

---

## Quick Stats

| Category | Total | Done | Open |
|----------|-------|------|------|
| Bugs | 35 | 28 | 7 |
| Security | 45 | 42 | 3 |
| Cleanup | 71 | 57 | 14 |
| Optimizations | 63 | 59 | 4 |
| UX | 8 | 0 | 8 |
| Features | 10 | 0 | 10 |
| Efficiency | 3 | 0 | 3 |
| **Total** | **235** | **186** | **49** |

---

## Open Tasks by Priority

### High
| # | Title | Category |
|---|-------|----------|
| 187 | Selection cache invalidation compares same variable | BUG |
| 188 | Slash commands `destroy` monkey-patches engine | BUG |
| 191 | `useSlashCommands` calls `setState` synchronously in `useEffect` | BUG |
| 194 | CloudProvider `buildUrl` callback not validated | SEC |
| 215 | Styled tooltip component with keyboard shortcut hints | UX |

### Medium
| # | Title | Category |
|---|-------|----------|
| 189 | Cut handler missing history snapshot before async | BUG |
| 190 | `usePortalAttachment` restores `textContent` instead of `innerHTML` | BUG |
| 192 | `vitest.config.js` uses `__dirname` in ESM | BUG |
| 193 | React version mismatch across monorepo | BUG |
| 195 | Pasted font-face URLs preserved without validation | SEC |
| 197 | `WordCountPlugin` never unsubscribes from EventBus | CLN |
| 201 | TypeScript declarations missing new props | CLN |
| 202 | TypeScript declarations missing hook exports | CLN |
| 203 | Missing `engines` field in root `package.json` | CLN |
| 205 | Icons file breaks React Fast Refresh | CLN |
| 206 | CI pipeline missing typecheck and coverage | CLN |
| 211 | `document.queryCommandState()` deprecated | OPT |
| 214 | Duplicate MenuBar import in build | OPT |
| 216 | FloatingToolbar focus indicator and keyboard navigation | UX |
| 217 | TableControls accessible labels | UX |
| 218 | Loading/spinner states during async modal operations | UX |
| 219 | Confirmation dialog before destructive table operations | UX |
| 220 | ContextMenu arrow-key keyboard navigation | UX |
| 223 | `removeFormat` keyboard shortcut | FEAT |
| 224 | Table cell content alignment (left/center/right) | FEAT |
| 225 | Toggle table header row (tbody ↔ thead) | FEAT |
| 226 | Copy-to-clipboard button on code blocks | FEAT |
| 227 | Image alt-text editing after insertion | FEAT |
| 228 | Embed modal URL preview | FEAT |
| 229 | Text highlight/marker color command | FEAT |
| 233 | Pre-compile format detection patterns in Selection.js | EFF |

### Low
| # | Title | Category |
|---|-------|----------|
| 196 | Missing CSRF documentation for CloudProvider | SEC |
| 198 | Duplicate `_exceedsMaxFileSize` in Clipboard/DragDrop | CLN |
| 199 | Missing PropTypes on Toolbar sub-components | CLN |
| 200 | Missing PropTypes on SaveStatus, RecoveryBanner, etc. | CLN |
| 204 | Missing `.nvmrc` | CLN |
| 207 | Missing `rollup-plugin-visualizer` devDep | CLN |
| 209 | Missing JSDoc on AutosaveManager methods | CLN |
| 210 | Vitest coverage thresholds not configured | CLN |
| 212 | Tokenizer keyword regex could use Trie/Set | OPT |
| 213 | DOMParser created per paste clean | OPT |
| 221 | Visual "unsaved changes" indicator | UX |
| 222 | FloatingToolbar stays visible during interaction | UX |
| 230 | Line numbers toggle for code blocks | FEAT |
| 231 | Max list nesting depth with visual hierarchy | FEAT |
| 232 | Subscript/superscript shortcut cross-platform audit | FEAT |
| 234 | Debounce or virtualize CommandPalette filtering | EFF |
| 235 | Memoize toolbar items array construction | EFF |

### Info
| # | Title | Category |
|---|-------|----------|
| 208 | Ghost preview comment misleading | CLN |
