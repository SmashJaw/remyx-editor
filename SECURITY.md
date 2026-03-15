# Security Audit — Remyx Editor

**Last audited:** 2026-03-14
**Version:** 0.23.0
**Scope:** Full source audit of `packages/remyx-core/src/` and `packages/remyx-react/src/`

---

## Summary

The Remyx Editor has a solid security foundation — a custom HTML sanitizer with tag/attribute allowlists, scoped DOM operations, no `eval`/`Function`/`postMessage` usage, and no client-side data storage. However, several vulnerabilities exist across the markdown parsing pipeline, data URI handling, iframe embedding, and direct DOM property assignments that bypass the sanitizer.

Since the 0.23.0 multi-package restructure, the attack surface is split:

| Package | Security Boundary | Risk |
| --- | --- | --- |
| `@remyx/core` | Sanitizer, commands, paste cleaning, export | High — contains all DOM mutation code |
| `@remyx/react` | Component rendering, context menu, modals | Medium — contains `dangerouslySetInnerHTML` and `window.open` |

| Severity | Count |
| --- | --- |
| Critical | 1 |
| High | 3 |
| Medium | 6 |
| Low | 5 |
| Informational | 4 |

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

### 6. Dangerous Tags Unwrapped Instead of Removed

**File:** `remyx-core/src/core/Sanitizer.js`

When a tag is not in the allowlist, the sanitizer keeps children and removes only the tag. For `<script>` this is safe, but `<svg>`, `<math>`, `<form>`, `<object>`, `<embed>`, and `<template>` may have harmful child structures that survive unwrapping.

**Recommended fix:** Maintain a blocklist of tags removed entirely (including children): `script`, `style`, `svg`, `math`, `form`, `object`, `embed`, `applet`, `template`.

### 7. No Explicit `on*` Event Handler Blocking

**File:** `remyx-core/src/core/Sanitizer.js`

Event handler attributes (`onclick`, `onerror`, etc.) are implicitly blocked because they're not in the allowlist. There is no explicit blocklist as defense-in-depth. A future schema change could inadvertently allow them.

**Recommended fix:** Add an explicit check rejecting any attribute starting with `on` regardless of the allowlist.

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

### 11. No File Size Limits on Image Paste/Drop

**Files:** `remyx-core/src/core/Clipboard.js` (line 134), `remyx-core/src/core/DragDrop.js` (line 110)

Images pasted or dropped without an `uploadHandler` are read as base64 data URLs with no size cap. Document imports (`documentConverter.js`) also have no file size limits. A large file (hundreds of MB) could crash the browser.

**Recommended fix:** Add a configurable max file size (default 10 MB) and show a warning. Apply limits in both paste/drop and document import paths.

### 12. History Restores Raw innerHTML

**File:** `remyx-core/src/core/History.js` (lines 78, 99)

`undo()` and `redo()` set `innerHTML` directly from stored snapshots without re-sanitizing.

**Recommendation:** Sanitize before restoring, or audit all DOM paths to ensure they sanitize.

### 13. `input` Tag Not Restricted to `type="checkbox"`

**File:** `remyx-core/src/constants/schema.js`

The schema allows `<input>` with `type` and `checked` but doesn't restrict `type` to `checkbox`. Pasted content could inject `text`, `hidden`, `password`, or `submit` inputs for phishing.

**Recommended fix:** Validate `type="checkbox"` post-sanitization and strip other input types.

### 14. `contenteditable` Allowed on `div` in Schema

**File:** `remyx-core/src/constants/schema.js`

Pasted HTML with `<div contenteditable="true">` creates nested contenteditable regions with unpredictable behavior.

**Recommended fix:** Remove `contenteditable` from allowed `div` attributes.

### 15. CSS Value Injection (Legacy)

**File:** `remyx-core/src/core/Sanitizer.js`

`_cleanStyles()` validates property names but not values. CSS `expression()` (IE-only, deprecated) and `@import` in values are not blocked. Very low risk on modern browsers.

**Recommended fix (defense-in-depth):**
```js
if (/expression\(|@import|behavior:|javascript:/i.test(value)) continue
```

---

## Informational

### 16. Google Fonts Loading Leaks Usage Data

**File:** `remyx-core/src/utils/fontConfig.js`

`loadGoogleFonts()` makes external requests to `fonts.googleapis.com`, revealing user IP and font usage. Document this behavior and consider a self-hosted font option.

### 17. External Image URLs Act as Tracking Pixels

**File:** `remyx-core/src/commands/images.js`

Images inserted via URL make GET requests when rendered, leaking viewer IP. Document this for privacy-sensitive deployments.

### 18. `document.execCommand` Usage (Deprecated API)

**Files:** `remyx-core/src/commands/fontControls.js` (lines 5, 52, 69, 71), `remyx-react/src/hooks/useContextMenu.js` (lines 99-103)

`document.execCommand` is deprecated and may be removed. Used for font family, font color, background color, and clipboard operations (cut/copy/selectAll). Plan migration to Input Events and Clipboard APIs.

### 19. Plugin System Has Unrestricted Engine Access

**File:** `remyx-core/src/plugins/PluginManager.js`

Plugins receive the full engine reference. A malicious plugin could bypass sanitization, overwrite commands, or exfiltrate content. Provide a restricted API facade and document security implications.

---

## React-Specific Findings (0.23.0)

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
7. Add `on*` event handler explicit blocking in Sanitizer
8. Strip dangerous tags entirely (`svg`, `math`, `form`, `object`, `embed`) instead of unwrapping
9. Restrict iframe `allow` attribute values; add `sandbox` to allowlist

### Medium Priority
10. Block inline SVG/MathML in paste cleaner
11. Pre-clean imported HTML files
12. Add file size limits for pasted/dropped images and document imports
13. Restrict `<input>` to `type="checkbox"`
14. Remove `contenteditable` from allowed `div` attributes
15. Validate CSS style values (colors, dimensions)
16. Pin third-party dependency versions

### Low Priority
17. Add CSS value validation in `_cleanStyles()`
18. Replace `document.write()` with DOM manipulation
19. Provide restricted plugin API facade
20. Migrate from `document.execCommand` to modern APIs
21. Source mode sanitization notification
