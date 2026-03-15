![Remyx Editor](./images/Remyx-Logo.svg)

# Security Audit — Remyx Editor

**Last audited:** 2026-03-15
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
| Critical | 1 | 0 |
| High | 3 | 0 |
| Medium | 6 | **2 ✅** |
| Low | 5 | **5 ✅** |
| Informational | 4 | **4 ✅** |

---

## Critical

### 1. Markdown Parser Does Not Block Raw HTML

**File:** `remyx-core/src/utils/markdownConverter.js`

The `marked` library is configured with `gfm: true` and `breaks: false` but does **not** disable raw HTML parsing. Markdown input containing raw HTML passes through `marked.parse()` and can produce executable output before the downstream sanitizer sees it.

**Attack vectors:**
- `[Click](javascript:alert('XSS'))` — `javascript:` in markdown links
- Raw `<img src=x onerror=alert(1)>` — HTML pass-through in markdown
- `![x](x "onerror=alert(1)")` — attribute injection via image title

**Impact:** The downstream sanitizer does strip `onerror` and `javascript:` hrefs in most cases, but this defense relies on a single layer. A schema relaxation, a new call site that skips sanitization, or a sanitizer bypass makes this directly exploitable.

**Recommended fix:**
```js
marked.setOptions({ gfm: true, breaks: false, html: false })
```
Additionally, override the `link` and `image` renderers to validate URL protocols.

---

## High

### 2. Data URI Images Allow SVG with Embedded Scripts

**Files:** `remyx-core/src/commands/images.js` (line 18), `remyx-core/src/core/Clipboard.js` (line 132), `remyx-core/src/core/DragDrop.js` (line 108)

When images are inserted via `insertImage()`, the `src` is assigned directly to `img.src` without type validation. A `data:image/svg+xml` URI can contain executable JavaScript (`<svg onload="...">`). This applies to all image paths: toolbar, paste, and drag-and-drop.

**Recommended fix:** Validate data URIs and block `image/svg+xml`. Allow only `png`, `jpeg`, `gif`, `webp`, `bmp`.

### 3. Embedded Media Iframes Have No `sandbox` Attribute

**File:** `remyx-core/src/commands/media.js` (lines 6-17)

Iframes created for YouTube/Vimeo/Dailymotion embeds lack `sandbox`. The `allow` attribute grants broad permissions (`accelerometer`, `clipboard-write`, `gyroscope`). Without `sandbox`, a compromised or spoofed embed URL gains full access to the parent page.

**Recommended fix:**
```js
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups')
iframe.setAttribute('allow', 'autoplay; picture-in-picture')
```

### 4. PDF Export Writes Unsanitized HTML via `document.write()`

**File:** `remyx-core/src/utils/exportUtils.js` (line 27)

`exportAsPDF()` interpolates editor HTML directly into `document.write()` without re-sanitizing. The `title` parameter is also unescaped. If any XSS payload survives the main sanitizer, it executes in the export iframe.

**Recommended fix:** Re-sanitize HTML before writing. HTML-encode the `title` parameter. Replace `document.write()` with DOM manipulation.

---

## Medium

### 5. Incomplete Protocol Validation on URL Attributes

**Files:** `remyx-core/src/core/Sanitizer.js`, `remyx-core/src/commands/links.js` (line 32), `remyx-react/src/hooks/useContextMenu.js` (line 113)

The sanitizer checks `javascript:` on `href` attributes during HTML parsing, but:
- Does **not** check `src` attributes on `img` or `iframe` tags
- The `editLink` command assigns `href` directly via `linkEl.href = href`, bypassing the sanitizer
- `window.open(linkEl.href)` in the context menu does not validate protocols

**Recommended fix:** Create a shared `validateUrl()` utility applied to all URL-bearing attributes and all command-level URL assignments. Block `javascript:`, `vbscript:`, and `data:text/html` protocols.

### 6. ~~Dangerous Tags Unwrapped Instead of Removed~~ ✅ FIXED

**File:** `remyx-core/src/core/Sanitizer.js`

**Fix applied:** Added `DANGEROUS_REMOVE_TAGS` Set containing `script`, `style`, `svg`, `math`, `form`, `object`, `embed`, `applet`, `template`. These tags are now removed entirely (including all children) instead of being unwrapped.

### 7. ~~No Explicit `on*` Event Handler Blocking~~ ✅ FIXED

**File:** `remyx-core/src/core/Sanitizer.js`

**Fix applied:** Added explicit check in `_cleanNode()` that rejects any attribute starting with `on` (e.g., `onclick`, `onerror`, `onload`) regardless of the allowlist, as defense-in-depth.

### 8. Iframe `allow` Attribute Values Not Validated

**File:** `remyx-core/src/constants/schema.js` (line 20)

The sanitizer schema allows the `allow` attribute on iframes without validating its value. Pasted HTML can grant dangerous permissions (`geolocation`, `camera`, `microphone`). The `sandbox` attribute is **not** in the allowlist, so restrictive sandboxing gets stripped.

**Recommended fix:** Remove `allow` from the iframe allowlist (or validate values). Add `sandbox` so restrictive pasting survives.

### 9. Paste Cleaning Does Not Block Inline SVG

**File:** `remyx-core/src/utils/pasteClean.js` (line 62)

The paste cleaner strips namespaced SVG (`<svg:path>`) but not plain `<svg>...</svg>`. The sanitizer unwraps `<svg>` (removes tag, keeps children), but SVG children could survive if the schema is extended.

**Recommended fix:**
```js
cleaned = cleaned.replace(/<svg[\s\S]*?<\/svg>/gi, '')
cleaned = cleaned.replace(/<math[\s\S]*?<\/math>/gi, '')
cleaned = cleaned.replace(/<object[\s\S]*?<\/object>/gi, '')
```

### 10. Document Import HTML Pass-Through

**File:** `remyx-core/src/utils/documentConverter.js`

`convertHtml()` returns raw file content with no pre-processing. Sanitization depends on all callers applying it downstream.

**Recommended fix:** Strip `<script>`, `<style>`, `<object>`, and `<embed>` tags. Apply `cleanPastedHTML()` to imported HTML.

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

### 20. `dangerouslySetInnerHTML` Fallback in Import Preview

**File:** `remyx-react/src/components/Modals/ImportDocumentModal.jsx` (line 104)

```jsx
dangerouslySetInnerHTML={{ __html: engine?.sanitizer?.sanitize(preview) || preview }}
```

If `engine?.sanitizer?.sanitize()` returns a falsy value (empty string, `null`, `undefined`), the **unsanitized** `preview` is rendered directly. This is a logic bug — an empty sanitized result should still be preferred over the raw input.

**Recommended fix:**
```jsx
dangerouslySetInnerHTML={{ __html: engine?.sanitizer ? engine.sanitizer.sanitize(preview) : '' }}
```

### 21. CSS Style Assignments Without Value Validation

**Files:** `remyx-core/src/commands/fontControls.js` (line 36), `remyx-core/src/commands/images.js` (lines 20-22, 40-72)

Direct `.style` property assignments from user input (font sizes, image dimensions, alignment) are not validated. While `.style` property assignment is safer than `setAttribute('style', ...)`, values should still be validated to prevent edge cases.

**Recommended fix:** Validate numeric values for dimensions. Validate color values with a regex.

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
1. Set `html: false` in marked configuration
2. Validate data URIs — block `image/svg+xml`
3. Add `sandbox` attribute to embedded media iframes
4. Validate URL protocols in `editLink`, `insertImage`, `insertLink`, and `window.open`
5. Fix `dangerouslySetInnerHTML` fallback in ImportDocumentModal

### High Priority
6. Re-sanitize HTML in `exportAsPDF()` and escape `title`
7. ~~Add `on*` event handler explicit blocking in Sanitizer~~ ✅
8. ~~Strip dangerous tags entirely (`svg`, `math`, `form`, `object`, `embed`) instead of unwrapping~~ ✅
9. Restrict iframe `allow` attribute values; add `sandbox` to allowlist

### Medium Priority
10. Block inline SVG/MathML in paste cleaner
11. Pre-clean imported HTML files
12. ~~Add file size limits for pasted/dropped images and document imports~~ ✅
13. ~~Restrict `<input>` to `type="checkbox"`~~ ✅
14. ~~Remove `contenteditable` from allowed `div` attributes~~ ✅
15. Validate CSS style values (colors, dimensions)
16. Pin third-party dependency versions

### Low Priority (All Resolved)
17. ~~Add CSS value validation in `_cleanStyles()`~~ ✅
18. Replace `document.write()` with DOM manipulation
19. ~~Provide restricted plugin API facade~~ ✅
20. ~~Migrate from `document.execCommand` to modern APIs~~ ✅ (documented)
21. Source mode sanitization notification
