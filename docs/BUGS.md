![Remyx Editor](./images/Remyx-Logo.svg)

# Known Bugs

**Last updated:** 2026-03-15
**Version:** 0.24.0

A prioritized list of confirmed bugs discovered through codebase analysis. **All 10 bugs have been resolved.**

---

## Critical

### 1. ✅ FIXED — Uninitialized `isMarkdownMode` property

**Package:** `remyx-core`
**File:** `src/core/EditorEngine.js`
**Fix:** Added `this.isMarkdownMode = false` to the `EditorEngine` constructor.

---

## High

### 2. ✅ FIXED — AutolinkPlugin event listener leak

**Package:** `remyx-core`
**File:** `src/plugins/builtins/AutolinkPlugin.js`
**Fix:** Added `destroy()` method that calls `removeEventListener` for the stored `keydown` handler reference.

---

### 3. ✅ FIXED — `dangerouslySetInnerHTML` fallback exposes unsanitized content

**Package:** `remyx-react`
**File:** `src/components/Modals/ImportDocumentModal.jsx`
**Fix:** Replaced `engine?.sanitizer?.sanitize(preview) || preview` with `engine?.sanitizer ? engine.sanitizer.sanitize(preview) : ''` to prevent XSS when sanitizer returns empty string.

---

## Medium

### 4. ✅ FIXED — FindReplace index jumps to start after replacing last match

**Package:** `remyx-core`
**File:** `src/commands/findReplace.js`
**Fix:** Changed `currentIndex % currentMatches.length` to `Math.min(currentIndex, currentMatches.length - 1)` after replace operations.

---

### 5. ✅ FIXED — `splitCell` creates `<td>` elements inside `<thead>` rows

**Package:** `remyx-core`
**File:** `src/commands/tables.js`
**Fix:** Added `row.closest('thead')` check to determine whether to create `<th>` or `<td>` elements when splitting cells. Applied to both same-row and subsequent-row cell creation.

---

### 6. ✅ FIXED — `Selection.restore()` fails silently when DOM structure changes

**Package:** `remyx-core`
**File:** `src/core/Selection.js`
**Fix:** Wrapped `setRange()` in try/catch with fallback that places cursor at end of editor content when restoration fails.

---

## Low

### 7. ✅ FIXED — History undo/redo race condition with MutationObserver

**Package:** `remyx-core`
**File:** `src/core/History.js`
**Fix:** Added `_disconnectObserver()` and `_reconnectObserver()` methods. Undo/redo now disconnects the MutationObserver before modifying innerHTML and reconnects after, eliminating the async race window.

---

### 8. ✅ FIXED — FindReplace accesses negative array index when no matches exist

**Package:** `remyx-core`
**File:** `src/commands/findReplace.js`
**Fix:** Added `currentMatches.length === 0` guard at the start of the replace command's execute function.

---

### 9. ✅ NOT A BUG — `useContextMenu` stale engine reference

**Package:** `remyx-react`
**File:** `src/hooks/useContextMenu.js`
**Resolution:** On inspection, `handleContextMenu` is already wrapped in `useCallback` with `[engine]` as a dependency. When `engine` changes, `handleContextMenu` changes, which triggers the `useEffect` to re-run and properly tear down/reattach event listeners. The dependency chain `engine → handleContextMenu → useEffect` already prevents stale closures.

---

### 10. ✅ FIXED — Paste cleaning regex assumes fixed `<font>` attribute order

**Package:** `remyx-core`
**File:** `src/utils/pasteClean.js`
**Fix:** Changed `<font\s+face=` to `<font\s[^>]*?face=` (and same for `color` and `size`) so attributes are matched regardless of their position in the tag.

---

## Summary

| Priority | # | Bug | Status |
| --- | --- | --- | --- |
| **Critical** | 1 | Uninitialized `isMarkdownMode` | ✅ Fixed |
| **High** | 2 | AutolinkPlugin event listener leak | ✅ Fixed |
| **High** | 3 | `dangerouslySetInnerHTML` unsanitized fallback | ✅ Fixed |
| **Medium** | 4 | FindReplace index wrap after last replace | ✅ Fixed |
| **Medium** | 5 | `splitCell` creates `<td>` in `<thead>` | ✅ Fixed |
| **Medium** | 6 | `Selection.restore()` silent failure | ✅ Fixed |
| **Low** | 7 | History undo/redo MutationObserver race | ✅ Fixed |
| **Low** | 8 | FindReplace negative index access | ✅ Fixed |
| **Low** | 9 | `useContextMenu` stale engine closure | ✅ Not a bug |
| **Low** | 10 | Paste font regex attribute order | ✅ Fixed |

**All 10 bugs resolved as of 2026-03-15.**
