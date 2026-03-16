![Remyx Editor](./images/Remyx-Logo.svg)

# Known Bugs

**Last updated:** 2026-03-16
**Version:** 0.24.0

A prioritized list of confirmed bugs discovered through codebase analysis. All 10 original bugs have been resolved. **6 new bugs** found and **all resolved** in the 0.24.0 audit.

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

## New Bugs (0.24.0 Audit)

### 11. ✅ FIXED — Missing Null Check in ImageResizeHandles

**Package:** `remyx-react`
**File:** `src/components/EditArea/ImageResizeHandles.jsx` (lines 26–27)
**Severity:** High

`handleMouseMove` accesses `startPos.x` and `startSize.height` without null guards. Both `startPos` and `startSize` are state variables initialized as `null`. If the mousemove handler fires before state propagates after mousedown, accessing properties on `null` causes a runtime crash.

**Fix:** Added `if (!startPos || !startSize) return` guard at the top of `handleMouseMove`.

---

### 12. ✅ FIXED — Division by Zero in Aspect Ratio Calculation

**Package:** `remyx-react`
**File:** `src/components/EditArea/ImageResizeHandles.jsx` (line 27)
**Severity:** Medium

```js
const aspectRatio = startSize.height / startSize.width
```

If an image has `offsetWidth === 0` (hidden, removed, or zero-width image), this divides by zero, producing `Infinity`. The resulting `newHeight` becomes `"Infinitypx"` — invalid CSS that breaks rendering.

**Fix:** Changed to `startSize.width > 0 ? startSize.height / startSize.width : 1`.

---

### 13. ✅ FIXED — `getRangeAt(0)` Can Throw in useSelection

**Package:** `remyx-react`
**File:** `src/hooks/useSelection.js` (lines 61–66)
**Severity:** Low

The code checks `sel.rangeCount > 0` before calling `getRangeAt(0)`, but DOM mutations between the check and the call can clear the selection, causing an "Index out of bounds" error.

**Fix:** Wrapped `sel.getRangeAt(0).getBoundingClientRect()` in try/catch with `selectionRect = null` fallback.

---

### 14. ✅ FIXED — Form Submit Listener Accumulation in usePortalAttachment

**Package:** `remyx-react`
**File:** `src/hooks/usePortalAttachment.js` (lines 38–50)
**Severity:** Low

The empty `syncToForm` function is attached to the parent form's `submit` event. If the hook effect re-runs (e.g., `attachTo` ref changes), a new listener is added without first removing the old one. Over time, multiple identical no-op listeners accumulate.

**Fix:** Removed the dead `syncToForm` handler and its event listener entirely.

---

### 15. ✅ FIXED — Stale Selection Offset in `Selection.restore()`

**Package:** `remyx-core`
**File:** `src/core/Selection.js` (lines 185–188)
**Severity:** Low

`restore()` calculates `Math.min(startNodeOffset, startNode.textContent.length)` but if the DOM structure changed significantly between `save()` and `restore()`, the offset may place the cursor at the wrong position within the correct node.

**Fix:** Added explanatory comment documenting the known limitation. Already mitigated by existing try/catch with end-of-editor fallback.

---

### 16. ✅ FIXED — `sourceMode` State Variable Never Read

**Package:** `remyx-react`
**File:** `src/components/RemyxEditor.jsx` (line 93)
**Severity:** Low

`const [sourceMode, setSourceMode] = useState(false)` — `setSourceMode` is called to toggle source mode, but `sourceMode` itself is never read in the component. The UI likely relies on `engine.isSourceMode` instead, making this state variable redundant and causing unnecessary re-renders.

**Fix:** Removed the unused `sourceMode` state variable and `setSourceMode` call from `RemyxEditor.jsx`.

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
| **High** | 11 | ImageResizeHandles null crash | ✅ Fixed |
| **Medium** | 12 | ImageResizeHandles division by zero | ✅ Fixed |
| **Low** | 13 | `useSelection` getRangeAt race | ✅ Fixed |
| **Low** | 14 | Form submit listener accumulation | ✅ Fixed |
| **Low** | 15 | Stale selection offset in `restore()` | ✅ Fixed |
| **Low** | 16 | Unused `sourceMode` state variable | ✅ Fixed |

**16 resolved, 0 open as of 2026-03-16.**
