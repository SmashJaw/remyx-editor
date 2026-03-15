# Known Bugs

**Last updated:** 2026-03-14
**Version:** 0.23.0

A prioritized list of confirmed bugs discovered through codebase analysis.

---

## Critical

### 1. Uninitialized `isMarkdownMode` property

**Package:** `remyx-core`
**File:** `src/core/EditorEngine.js`

`EditorEngine` never initializes `this.isMarkdownMode` in its constructor, but multiple modules reference it:

- `commands/markdownToggle.js` — toggles between `true`/`false`
- `hooks/useEditorEngine.js` — reads it for state sync
- `hooks/useRemyxEditor.js` — reads it for UI updates

On first access, `engine.isMarkdownMode` is `undefined` rather than `false`. This can cause the markdown toggle to behave unexpectedly on the first click (e.g., toggling from `undefined` to `true` works, but strict `=== false` checks would fail).

**Fix:** Add `this.isMarkdownMode = false;` to the `EditorEngine` constructor.

---

## High

### 2. AutolinkPlugin event listener leak

**Package:** `remyx-core`
**File:** `src/plugins/AutolinkPlugin.js`

The `AutolinkPlugin` registers a `keydown` event listener on the editor element in its `init()` method but has no `destroy()` method to remove it. When the editor is destroyed and re-created (common in React), the old listener remains attached to the DOM element, causing:

- Memory leaks
- Duplicate autolink processing
- Potential errors if the old listener references a destroyed engine

**Fix:** Add a `destroy()` method that calls `removeEventListener` for the `keydown` handler. Store the handler reference in `init()` so it can be removed.

---

### 3. `dangerouslySetInnerHTML` fallback exposes unsanitized content

**Package:** `remyx-react`
**File:** `src/components/Modals/ImportDocumentModal.jsx`

```jsx
dangerouslySetInnerHTML={{ __html: engine?.sanitizer?.sanitize(preview) || preview }}
```

If the sanitizer returns an empty string (falsy) — which is valid for empty or all-malicious content — the `||` operator falls through to the raw unsanitized `preview` string. This is an XSS vector.

**Fix:** Use a ternary instead of `||`:
```jsx
dangerouslySetInnerHTML={{ __html: engine?.sanitizer ? engine.sanitizer.sanitize(preview) : '' }}
```

**Cross-reference:** SECURITY.md finding #20.

---

## Medium

### 4. FindReplace index jumps to start after replacing last match

**Package:** `remyx-core`
**File:** `src/commands/findReplace.js`

After replacing the last match in a document, `currentIndex` wraps around via modulo to `0`, jumping the selection to the first match. The expected behavior is to either stay at the end or advance to the next logical position (which would be index 0, but with user-visible feedback that wrapping occurred).

**Fix:** After a replace, clamp `currentIndex` to `Math.min(currentIndex, matches.length - 1)` when matches remain, or set to `0` with a "wrapped around" indicator.

---

### 5. `splitCell` creates `<td>` elements inside `<thead>` rows

**Package:** `remyx-core`
**File:** `src/commands/table.js`

When splitting a merged cell that spans into or resides in a `<thead>` row, the split creates `<td>` elements instead of `<th>` elements. This produces invalid table structure and can break styling.

**Fix:** Check whether the target row is inside a `<thead>` element and create `<th>` elements accordingly:
```js
const cellTag = row.closest('thead') ? 'th' : 'td';
```

---

### 6. `Selection.restore()` fails silently when DOM structure changes

**Package:** `remyx-core`
**File:** `src/core/Selection.js`

`Selection.restore()` attempts to restore a previously saved DOM Range. If the DOM structure changed between `save()` and `restore()` (which happens during undo/redo, paste, and some command executions), `addRange()` can throw or silently place the cursor in the wrong position. There is no fallback logic to handle this.

**Fix:** Wrap `addRange()` in a try/catch and fall back to placing the cursor at the end of the editor content area when restoration fails.

---

## Low

### 7. History undo/redo race condition with MutationObserver

**Package:** `remyx-core`
**File:** `src/core/History.js`

The `_isPerformingUndoRedo` flag is set synchronously, but the `MutationObserver` callback fires asynchronously. Between the flag being set and the observer firing, there is a brief window where mutations from the undo/redo operation could be observed and incorrectly recorded as new changes. This can corrupt the undo stack in fast repeated undo/redo operations.

**Fix:** Disconnect the `MutationObserver` before performing undo/redo and reconnect it after, instead of relying on a boolean flag.

---

### 8. FindReplace accesses negative array index when no matches exist

**Package:** `remyx-core`
**File:** `src/commands/findReplace.js`

When `currentMatches` is empty and a replace operation is attempted, `currentMatches[currentIndex]` can access index `-1` (since `currentIndex` may be decremented to `-1`). This returns `undefined` and the replace silently does nothing, but it's an unintended code path that could cause issues if the array implementation changes.

**Fix:** Guard replace operations with an early return when `currentMatches.length === 0`.

---

### 9. `useContextMenu` stale engine reference

**Package:** `remyx-react`
**File:** `src/hooks/useContextMenu.js`

The `engine` variable is used inside a `useEffect` callback but is not included in the dependency array. If the engine instance changes (e.g., editor re-initialization), the context menu handler continues referencing the old, potentially destroyed engine.

**Fix:** Add `engine` to the `useEffect` dependency array and ensure proper cleanup of the old listener.

---

### 10. Paste cleaning regex assumes fixed `<font>` attribute order

**Package:** `remyx-core`
**File:** `src/utils/paste.js`

The regex that extracts the `face` attribute from `<font>` tags assumes it appears first in the tag. If the tag has `color` or `size` before `face` (e.g., `<font color="red" face="Arial">`), the regex fails to match and the font information is lost during paste cleaning.

**Fix:** Use a more flexible regex that matches `face` anywhere in the tag, or parse the attribute with a proper DOM method:
```js
const span = document.createElement('span');
span.innerHTML = fontTag;
const face = span.querySelector('font')?.getAttribute('face');
```

---

## Summary

| Priority | # | Bug | Package |
| --- | --- | --- | --- |
| **Critical** | 1 | Uninitialized `isMarkdownMode` | remyx-core |
| **High** | 2 | AutolinkPlugin event listener leak | remyx-core |
| **High** | 3 | `dangerouslySetInnerHTML` unsanitized fallback | remyx-react |
| **Medium** | 4 | FindReplace index wrap after last replace | remyx-core |
| **Medium** | 5 | `splitCell` creates `<td>` in `<thead>` | remyx-core |
| **Medium** | 6 | `Selection.restore()` silent failure | remyx-core |
| **Low** | 7 | History undo/redo MutationObserver race | remyx-core |
| **Low** | 8 | FindReplace negative index access | remyx-core |
| **Low** | 9 | `useContextMenu` stale engine closure | remyx-react |
| **Low** | 10 | Paste font regex attribute order | remyx-core |
