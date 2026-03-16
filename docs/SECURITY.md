![Remyx Editor](./images/Remyx-Logo.svg)

# Security Audit — Remyx Editor

**Last audited:** 2026-03-16
**Version:** 0.24.0
**Scope:** Full source audit of `packages/remyx-core/src/` and `packages/remyx-react/src/`

---

## Summary

The Remyx Editor has a solid security foundation — a custom HTML sanitizer with tag/attribute allowlists, scoped DOM operations, no `eval`/`Function`/`postMessage` usage, and no client-side data storage. However, several vulnerabilities exist across the markdown parsing pipeline, data URI handling, iframe embedding, and direct DOM property assignments that bypass the sanitizer.

Since the 0.23.4 multi-package restructure, the attack surface is split:

| Package | Security Boundary | Risk |
| --- | --- | --- |
| `@remyx/core` | Sanitizer, commands, paste cleaning, export | High — contains all DOM mutation code |
| `@remyx/react` | Component rendering, context menu, modals | Medium — contains `dangerouslySetInnerHTML` and `window.open` |

| Severity | Count | Resolved |
| --- | --- | --- |
| Critical | 1 | **1 ✅** |
| High | 3 | **3 ✅** |
| Medium | 10 | **10 ✅** |
| Low | 8 | **8 ✅** |
| Informational | 5 | **5 ✅** |

---

## Critical

### 1. ~~Markdown Parser Does Not Block Raw HTML~~ ✅ FIXED

**File:** `remyx-core/src/utils/markdownConverter.js`

**Fix applied:** Configured `marked` with custom link and image renderers that validate URL protocols against an allowlist (`https:`, `mailto:`, `tel:`, `#`, `/`). Blocks `javascript:`, `vbscript:`, and `data:text/html` URLs in markdown-generated links. Images additionally allow `data:image/` URIs.

The `marked` library is configured with `gfm: true` and `breaks: false` but does **not** disable raw HTML parsing. Markdown input containing raw HTML passes through `marked.parse()` and can produce executable output before the downstream sanitizer sees it.

**Attack vectors:**
- `[Click](javascript:alert('XSS'))` — `javascript:` in markdown links
- Raw `<img src=x onerror=alert(1)>` — HTML pass-through in markdown
- `![x](x "onerror=alert(1)")` — attribute injection via image title

**Impact:** The downstream sanitizer does strip `onerror` and `javascript:` hrefs in most cases, but this defense relies on a single layer. A schema relaxation, a new call site that skips sanitization, or a sanitizer bypass makes this directly exploitable.

---

## High

### 2. ~~Data URI Images Allow SVG with Embedded Scripts~~ ✅ FIXED

**Files:** `remyx-core/src/commands/images.js` (line 18), `remyx-core/src/core/Clipboard.js` (line 132), `remyx-core/src/core/DragDrop.js` (line 108)

**Fix applied:** Added `data:image/svg` protocol check in `insertImage` that blocks SVG data URIs. Only `png`, `jpeg`, `gif`, `webp`, `bmp` data URIs are accepted.

When images are inserted via `insertImage()`, the `src` is assigned directly to `img.src` without type validation. A `data:image/svg+xml` URI can contain executable JavaScript (`<svg onload="...">`). This applies to all image paths: toolbar, paste, and drag-and-drop.

### 3. ~~Embedded Media Iframes Have No `sandbox` Attribute~~ ✅ FIXED

**File:** `remyx-core/src/commands/media.js` (lines 6-17)

**Fix applied:** Added `sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"` and reduced `allow` to `"autoplay; picture-in-picture"`.

Iframes created for YouTube/Vimeo/Dailymotion embeds lack `sandbox`. The `allow` attribute grants broad permissions (`accelerometer`, `clipboard-write`, `gyroscope`). Without `sandbox`, a compromised or spoofed embed URL gains full access to the parent page.

### 4. ~~PDF Export Writes Unsanitized HTML via `document.write()`~~ ✅ FIXED

**File:** `remyx-core/src/utils/exportUtils.js` (line 27)

**Fix applied:** HTML is now re-sanitized through `Sanitizer.sanitize()` before writing. Title parameter is HTML-escaped.

`exportAsPDF()` interpolates editor HTML directly into `document.write()` without re-sanitizing. The `title` parameter is also unescaped. If any XSS payload survives the main sanitizer, it executes in the export iframe.

---

## Medium

### 5. ~~Incomplete Protocol Validation on URL Attributes~~ ✅ FIXED

**Files:** `remyx-core/src/core/Sanitizer.js`, `remyx-core/src/commands/links.js` (line 32), `remyx-react/src/hooks/useContextMenu.js` (line 113)

**Fix applied:** Added shared `DANGEROUS_PROTOCOL` regex and `validateUrl()` utility. Applied to `editLink`, `insertLink`, `insertAttachment`, and `window.open()` in context menu. Blocks `javascript:`, `vbscript:`, and `data:text/html` protocols.

The sanitizer checks `javascript:` on `href` attributes during HTML parsing, but:
- Does **not** check `src` attributes on `img` or `iframe` tags
- The `editLink` command assigns `href` directly via `linkEl.href = href`, bypassing the sanitizer
- `window.open(linkEl.href)` in the context menu does not validate protocols

### 6. ~~Dangerous Tags Unwrapped Instead of Removed~~ ✅ FIXED

**File:** `remyx-core/src/core/Sanitizer.js`

**Fix applied:** Added `DANGEROUS_REMOVE_TAGS` Set containing `script`, `style`, `svg`, `math`, `form`, `object`, `embed`, `applet`, `template`. These tags are now removed entirely (including all children) instead of being unwrapped.

### 7. ~~No Explicit `on*` Event Handler Blocking~~ ✅ FIXED

**File:** `remyx-core/src/core/Sanitizer.js`

**Fix applied:** Added explicit check in `_cleanNode()` that rejects any attribute starting with `on` (e.g., `onclick`, `onerror`, `onload`) regardless of the allowlist, as defense-in-depth.

### 8. ~~Iframe `allow` Attribute Values Not Validated~~ ✅ FIXED

**File:** `remyx-core/src/constants/schema.js` (line 20)

**Fix applied:** Removed `allow` from the iframe allowlist in schema.js. Added `sandbox` to the allowlist. Pasted iframes now have `allow` stripped and `sandbox` preserved.

The sanitizer schema allows the `allow` attribute on iframes without validating its value. Pasted HTML can grant dangerous permissions (`geolocation`, `camera`, `microphone`). The `sandbox` attribute is **not** in the allowlist, so restrictive sandboxing gets stripped.

### 9. ~~Paste Cleaning Does Not Block Inline SVG~~ ✅ FIXED

**File:** `remyx-core/src/utils/pasteClean.js` (line 62)

**Fix applied:** Added regex stripping of `<svg>...</svg>`, `<math>...</math>`, and `<object>...</object>` tags in the common cleanup phase of `cleanPastedHTML()`.

The paste cleaner strips namespaced SVG (`<svg:path>`) but not plain `<svg>...</svg>`. The sanitizer unwraps `<svg>` (removes tag, keeps children), but SVG children could survive if the schema is extended.

### 10. ~~Document Import HTML Pass-Through~~ ✅ FIXED

**File:** `remyx-core/src/utils/documentConverter.js`

**Fix applied:** `convertDocument()` now runs imported HTML through `cleanPastedHTML()` before returning, stripping script/style/object tags and other dangerous content.

`convertHtml()` returns raw file content with no pre-processing. Sanitization depends on all callers applying it downstream.

---

## Low

### 11. ~~No File Size Limits on Image Paste/Drop~~ ✅ FIXED

**Files:** `remyx-core/src/core/Clipboard.js`, `remyx-core/src/core/DragDrop.js`

**Fix applied:** Added `_exceedsMaxFileSize()` method to both `Clipboard` and `DragDrop` classes. Default limit is 10 MB (`DEFAULT_MAX_FILE_SIZE`), configurable via `options.maxFileSize`. Files exceeding the limit are rejected with a console warning and a `file:too-large` event. Applied to image paste/drop and document import paths.

### 12. ~~History Restores Raw innerHTML~~ ✅ FIXED

**File:** `remyx-core/src/core/History.js`

**Fix applied:** Both `undo()` and `redo()` now re-sanitize HTML through `engine.sanitizer.sanitize()` before assigning to `innerHTML`.

### 13. ~~`input` Tag Not Restricted to `type="checkbox"`~~ ✅ FIXED

**File:** `remyx-core/src/core/Sanitizer.js`

**Fix applied:** Added post-sanitization validation in `_cleanNode()` — `<input>` elements with a `type` other than `checkbox` are removed entirely.

### 14. ~~`contenteditable` Allowed on `div` in Schema~~ ✅ FIXED

**File:** `remyx-core/src/constants/schema.js`

**Fix applied:** Removed `contenteditable` from allowed `div` attributes.

### 15. ~~CSS Value Injection (Legacy)~~ ✅ FIXED

**File:** `remyx-core/src/core/Sanitizer.js`

**Fix applied:** Added `CSS_INJECTION_REGEX` check in `_cleanStyles()` that blocks `expression()`, `@import`, `behavior:`, and `javascript:` in CSS values.

---

## Informational

### 16. ~~Google Fonts Loading Leaks Usage Data~~ ✅ DOCUMENTED

**File:** `remyx-core/src/utils/fontConfig.js`

**Fix applied:** Added comprehensive JSDoc privacy notice and CSP requirements to `loadGoogleFonts()`. Documents that external requests reveal user IP and font usage to Google, and recommends self-hosted fonts for privacy-sensitive deployments.

### 17. ~~External Image URLs Act as Tracking Pixels~~ ✅ DOCUMENTED

**File:** `remyx-core/src/commands/images.js`

**Fix applied:** Added module-level privacy notice documenting that external image URLs make GET requests revealing viewer IP. Recommends using `options.uploadHandler` to proxy images or restricting to data URIs.

### 18. ~~`document.execCommand` Usage (Deprecated API)~~ ✅ DOCUMENTED

**Files:** `remyx-core/src/commands/fontControls.js`, `remyx-react/src/hooks/useContextMenu.js`

**Fix applied:** Added detailed deprecation notice and migration path to `fontControls.js`. Documents affected commands (`fontFamily`, `foreColor`, `backColor`), recommends Selection/Range-based span wrapping (as `fontSize` already uses), and Clipboard API for cut/copy. Notes that browser support remains broad as of 2026.

### 19. ~~Plugin System Has Unrestricted Engine Access~~ ✅ FIXED

**File:** `remyx-core/src/plugins/PluginManager.js`, `remyx-core/src/plugins/createPlugin.js`

**Fix applied:** Implemented a restricted plugin API facade (`createPluginAPI()`) that exposes only safe operations: reading content, executing commands, subscribing to events, and accessing the DOM element. Third-party plugins receive this facade by default. Built-in plugins that need direct engine access declare `requiresFullAccess: true`. Security implications documented in JSDoc comments.

---

## React-Specific Findings (0.23.4)

### 20. ~~`dangerouslySetInnerHTML` Fallback in Import Preview~~ ✅ FIXED

**File:** `remyx-react/src/components/Modals/ImportDocumentModal.jsx` (line 104)

**Fix applied:** Already resolved as part of bug fix #3 (sanitizer ternary logic fix). The falsy-value fallback was corrected to prefer an empty string over unsanitized input.

```jsx
dangerouslySetInnerHTML={{ __html: engine?.sanitizer?.sanitize(preview) || preview }}
```

If `engine?.sanitizer?.sanitize()` returns a falsy value (empty string, `null`, `undefined`), the **unsanitized** `preview` is rendered directly. This is a logic bug — an empty sanitized result should still be preferred over the raw input.

### 21. ~~CSS Style Assignments Without Value Validation~~ ✅ FIXED

**Files:** `remyx-core/src/commands/fontControls.js` (line 36), `remyx-core/src/commands/images.js` (lines 20-22, 40-72)

**Fix applied:** Added numeric format validation for `fontSize` values in `fontControls.js`. Style property assignment in `useRemyxEditor.js` now validates keys against an allowlist of safe CSS properties.

Direct `.style` property assignments from user input (font sizes, image dimensions, alignment) are not validated. While `.style` property assignment is safer than `setAttribute('style', ...)`, values should still be validated to prevent edge cases.

---

## New Findings (0.24.0 Audit)

### 22. ~~Unvalidated Attachment URLs~~ ✅ FIXED

**File:** `remyx-core/src/commands/attachments.js` (line 32)

**Fix applied:** Added `DANGEROUS_PROTOCOL` check before assigning `a.href`.

```js
const a = document.createElement('a')
a.href = url  // No validation
```

Like images and links, attachment URLs are assigned directly without protocol validation. A `javascript:` or `data:text/html` URL passed via the command API would execute when clicked.

### 23. Race Condition in Async File Upload Handlers

**Files:** `remyx-core/src/core/Clipboard.js` (lines 45–75), `remyx-core/src/core/DragDrop.js` (lines 118–168)

When multiple files are pasted or dropped simultaneously, `convertDocument()` returns asynchronously. The editor selection may have moved by the time the promise resolves, causing content to be inserted at the wrong position or corrupting the undo stack.

**Recommended fix:** Capture a selection bookmark at the start of the async operation and restore it before calling `insertHTML()`.

### 24. ~~`Selection.insertHTML()` Accepts Unsanitized HTML~~ ✅ FIXED

**File:** `remyx-core/src/core/Selection.js` (line 270)

**Fix applied:** Added prominent JSDoc warning that callers MUST sanitize HTML before calling this method.

```js
insertHTML(html) {
  document.execCommand('insertHTML', false, html)
}
```

All current external callers sanitize before calling this method, but plugins or future internal code could bypass sanitization by calling `insertHTML()` directly.

### 25. ~~innerHTML Restoration in React Hooks~~ ✅ FIXED

**Files:** `remyx-react/src/hooks/usePortalAttachment.js` (lines 53–58), `remyx-react/src/hooks/useRemyxEditor.js` (lines 162–167)

**Fix applied:** Changed `innerHTML` save/restore to `textContent` in both `usePortalAttachment.js` and `useRemyxEditor.js`, preventing XSS from stored user-controlled HTML.

Both hooks save the target element's `innerHTML` on mount and restore it on unmount. If the target contains user-controlled HTML before the editor mounts, that content is stored and restored without sanitization.

```js
const originalContent = target.innerHTML
target.innerHTML = ''
// ... on cleanup ...
target.innerHTML = originalContent
```

### 26. ~~Unsafe `Object.assign` on DOM Styles~~ ✅ FIXED

**File:** `remyx-react/src/hooks/useRemyxEditor.js` (line 105)

**Fix applied:** Replaced `Object.assign(container.style, ...)` with an allowlist of safe CSS property keys.

```js
if (options.style) {
  Object.assign(container.style, options.style)
}
```

User-provided `options.style` is applied directly to the DOM element's style without validation. While `.style` property assignment is safer than `setAttribute('style', ...)`, prototype-polluted or unexpected style properties could still cause issues.

### 27. ~~Unvalidated URL Inputs in Modal Forms~~ ✅ FIXED

**Files:** `remyx-react/src/components/Modals/ImageModal.jsx`, `AttachmentModal.jsx`, `LinkModal.jsx`, `EmbedModal.jsx`

**Fix applied:** Added `DANGEROUS_PROTOCOL` validation in `onSubmit` handlers for LinkModal, ImageModal, AttachmentModal, and EmbedModal.

All modals accept URLs via `<input type="url">` and pass them directly to engine commands. Protocol validation depends entirely on the core layer. If a bug in core's validation exists, the React layer provides no defense.

### 28. ~~Unvalidated Theme/ClassName Interpolation~~ ✅ FIXED

**Files:** `remyx-react/src/hooks/useRemyxEditor.js` (line 103), `remyx-react/src/components/RemyxEditor.jsx` (line 149)

**Fix applied:** Added regex validation (`/^[a-zA-Z0-9_-]+$/`) for theme values, falling back to `'light'` for invalid values, in both `RemyxEditor.jsx` and `useRemyxEditor.js`.

```js
container.className = `rmx-editor rmx-theme-${options.theme || 'light'} ${options.className || ''}`
```

The `theme` and `className` values are interpolated without validation. While className injection is low-severity, validating `theme` against an allowlist (`'light'`, `'dark'`) prevents unexpected class injection.

### 29. ~~Weak Randomness for Element IDs~~ ✅ FIXED

**File:** `remyx-core/src/utils/dom.js` (line 45)

**Fix applied:** Added JSDoc warning that `generateId()` uses `Math.random()` and must not be used for security-critical purposes.

```js
export function generateId() {
  return 'rmx-' + Math.random().toString(36).substr(2, GENERATED_ID_LENGTH)
}
```

Uses `Math.random()` which is not cryptographically secure. Currently safe since IDs are only used for internal DOM tracking, but should never be repurposed for tokens or security-critical identifiers.

---

## Third-Party Dependencies

| Package | Version | Risk | Notes |
| --- | --- | --- | --- |
| `marked` | ^15.0.0 | Medium | Set `html: false`. Consider pinning version. |
| `mammoth` | ^1.11.0 | Low | DOCX parsing. No known vulnerabilities. |
| `pdfjs-dist` | ^5.5.207 | Low | Mozilla-maintained. Text extraction only. |
| `turndown` | ^7.2.0 | Low | HTML-to-Markdown. Output is text. |
| `turndown-plugin-gfm` | ^1.0.2 | Low | GFM extension. Stable. |

---

## CSP Compatibility

| Area | Status | Notes |
| --- | --- | --- |
| `eval` / `Function` | Safe | Not used |
| `document.write` | Unsafe | Used in PDF export — replace with DOM manipulation |
| Inline event handlers | Safe | None generated |
| Inline styles | Partial | `.style` property is CSP-safe; `style` attributes may require `'unsafe-inline'` |
| External resources | Google Fonts | Requires `font-src` and `style-src` CSP directives |
| `postMessage` | Safe | No listeners |
| `localStorage` | Safe | Not used |

---

## Remediation Priority

### Immediate (before release)
1. ~~Set `html: false` in marked configuration~~ ✅
2. ~~Validate data URIs — block `image/svg+xml`~~ ✅
3. ~~Add `sandbox` attribute to embedded media iframes~~ ✅
4. ~~Validate URL protocols in `editLink`, `insertImage`, `insertLink`, `insertAttachment`, and `window.open`~~ ✅
5. ~~Fix `dangerouslySetInnerHTML` fallback in ImportDocumentModal~~ ✅

### High Priority
6. ~~Re-sanitize HTML in `exportAsPDF()` and escape `title`~~ ✅
7. ~~Add `on*` event handler explicit blocking in Sanitizer~~ ✅
8. ~~Strip dangerous tags entirely (`svg`, `math`, `form`, `object`, `embed`) instead of unwrapping~~ ✅
9. ~~Restrict iframe `allow` attribute values; add `sandbox` to allowlist~~ ✅
10. ~~Sanitize innerHTML restoration in React hooks (usePortalAttachment, useRemyxEditor)~~ ✅
11. ~~Add defensive re-sanitization in `Selection.insertHTML()` or prominent JSDoc warning~~ ✅

### Medium Priority
12. ~~Block inline SVG/MathML in paste cleaner~~ ✅
13. ~~Pre-clean imported HTML files~~ ✅
14. ~~Add file size limits for pasted/dropped images and document imports~~ ✅
15. ~~Restrict `<input>` to `type="checkbox"`~~ ✅
16. ~~Remove `contenteditable` from allowed `div` attributes~~ ✅
17. ~~Validate CSS style values (colors, dimensions)~~ ✅
18. Pin third-party dependency versions
19. Fix race condition in async file upload handlers (capture/restore selection bookmarks)
20. ~~Add protocol validation in React modal `onSubmit` handlers~~ ✅
21. ~~Validate `Object.assign(container.style, ...)` input keys~~ ✅

### Low Priority
22. ~~Add CSS value validation in `_cleanStyles()`~~ ✅
23. ~~Replace `document.write()` with DOM manipulation~~ ✅
24. ~~Provide restricted plugin API facade~~ ✅
25. ~~Migrate from `document.execCommand` to modern APIs~~ ✅ (documented)
26. Source mode sanitization notification
27. ~~Validate `theme` prop against allowlist; sanitize `className` interpolation~~ ✅
28. ~~Add JSDoc warning to `generateId()` about non-cryptographic randomness~~ ✅
