/**
 * Paste cleaning pipeline for rich text from various sources.
 * Handles Microsoft Word, Google Docs, LibreOffice, Apple Pages,
 * and other rich text editors.
 *
 * Source detection runs only the relevant cleaner pipeline,
 * avoiding unnecessary regex passes for unrelated sources.
 */

// Pre-compiled regex patterns for list detection (hoisted from inner loop)
const BULLET_PATTERN = /^[\s]*[·•●○◦▪▫–—-]\s*/
const NUMBER_PATTERN = /^[\s]*\d+[.)]\s*/
const LETTER_PATTERN = /^[\s]*[a-zA-Z][.)]\s*/
const INDENT_PATTERN = /margin-left|padding-left|text-indent/i
// Combined list-prefix strip pattern (single regex instead of 3 separate .replace calls)
const LIST_PREFIX_PATTERN = /^[\s]*(?:[·•●○◦▪▫–—-]|\d+[.)]|[a-zA-Z][.)])\s*/

export function cleanPastedHTML(html) {
  if (!html) return ''

  let cleaned = html

  // ── Strip meta/head wrappers that some sources include (always run) ──
  cleaned = cleaned.replace(/<meta[^>]*>/gi, '')
  cleaned = cleaned.replace(/<\/?html[^>]*>/gi, '')
  cleaned = cleaned.replace(/<head[\s\S]*?<\/head>/gi, '')
  cleaned = cleaned.replace(/<\/?body[^>]*>/gi, '')
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '')
  cleaned = cleaned.replace(/<title[\s\S]*?<\/title>/gi, '')
  // Strip dangerous embedded content (SVG can contain scripts, MathML can contain exploits)
  cleaned = cleaned.replace(/<svg[\s\S]*?<\/svg>/gi, '')
  cleaned = cleaned.replace(/<math[\s\S]*?<\/math>/gi, '')
  cleaned = cleaned.replace(/<object[\s\S]*?<\/object>/gi, '')
  cleaned = cleaned.replace(/<link[^>]*>/gi, '')

  // ── Detect paste source ──
  const isWord = /mso-|class="Mso|<o:p|<w:/.test(html)
  const isGoogleDocs = /docs-internal|id="h\.[a-z0-9]+"/.test(html)
  const isGoogleSheets = /google-sheets-html-origin/.test(html)
  const isLibreOffice = /<text:|<office:|class="P\d+"/.test(html)
  const isApplePages = /apple-content-edited|class="[sp]\d+"/.test(html)

  // ── Microsoft Word cleanup (only if Word detected) ──
  if (isWord) {
    cleaned = cleaned.replace(/<!--\[if[\s\S]*?endif\]-->/gi, '')
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '')
    cleaned = cleaned.replace(/<o:p[\s\S]*?<\/o:p>/gi, '')
    cleaned = cleaned.replace(/<w:[\s\S]*?<\/w:[\s\S]*?>/gi, '')
    cleaned = cleaned.replace(/<m:[\s\S]*?<\/m:[\s\S]*?>/gi, '')
    cleaned = cleaned.replace(/<\/?(xml|st1|v:|o:)[^>]*>/gi, '')

    // Remove mso-* styles (Word-specific CSS)
    cleaned = cleaned.replace(/\s*mso-[^:]+:[^;"]+;?/gi, '')

    // Remove class="Mso*" (Word paragraph classes)
    cleaned = cleaned.replace(/\s*class="Mso[^"]*"/gi, '')

    // Remove Word-specific attributes
    cleaned = cleaned.replace(/\s*lang="[^"]*"/gi, '')
  }

  // ── Google Docs cleanup (only if Google Docs detected) ──
  if (isGoogleDocs) {
    cleaned = cleaned.replace(/<b\s+id="docs-internal[^"]*"[^>]*>([\s\S]*?)<\/b>/gi, '$1')
    cleaned = cleaned.replace(/\s*id="docs-internal[^"]*"/gi, '')
    cleaned = cleaned.replace(/\s*id="h\.[a-z0-9]+"/gi, '')
    cleaned = cleaned.replace(/\s*class="c\d+"/gi, '')
    cleaned = cleaned.replace(/\s*dir="ltr"/gi, '')
    cleaned = cleaned.replace(/\s*role="presentation"/gi, '')

    // Google Docs wraps content in span with inline styles for weight/style
    // Convert <span style="font-weight: 700"> to <strong>
    cleaned = cleaned.replace(
      /<span\s+style="[^"]*font-weight:\s*(700|bold)[^"]*">([\s\S]*?)<\/span>/gi,
      '<strong>$2</strong>'
    )
    cleaned = cleaned.replace(
      /<span\s+style="[^"]*font-style:\s*italic[^"]*">([\s\S]*?)<\/span>/gi,
      '<em>$2</em>'
    )
    cleaned = cleaned.replace(
      /<span\s+style="[^"]*text-decoration:\s*line-through[^"]*">([\s\S]*?)<\/span>/gi,
      '<s>$2</s>'
    )
  }

  // ── LibreOffice / OpenOffice cleanup (only if LibreOffice detected) ──
  if (isLibreOffice) {
    cleaned = cleaned.replace(/<\/?(text|office|table|draw|style|number|fo|svg):[^>]*>/gi, '')
    cleaned = cleaned.replace(/\s*class="P\d+"/gi, '')
    cleaned = cleaned.replace(/\s*class="T\d+"/gi, '')
    cleaned = cleaned.replace(/\s*class="Table\d+"/gi, '')
  }

  // ── Google Sheets cleanup (only if Google Sheets detected) ──
  if (isGoogleSheets) {
    cleaned = cleaned.replace(/<google-sheets-html-origin[\s\S]*?\/>/gi, '')
    cleaned = cleaned.replace(/<\/?google-sheets-html-origin[^>]*>/gi, '')
    cleaned = cleaned.replace(/<col[^>]*>/gi, '')
    cleaned = cleaned.replace(/<\/?colgroup[^>]*>/gi, '')
  }

  // ── Excel cleanup (Excel tables use mso- styles like Word) ──
  if (isWord && /<table/i.test(html)) {
    // Strip Excel-specific xmlns attributes
    cleaned = cleaned.replace(/\s*xmlns:[a-z]="[^"]*"/gi, '')
    // Remove <col> and <colgroup> tags from Excel tables
    cleaned = cleaned.replace(/<col[^>]*>/gi, '')
    cleaned = cleaned.replace(/<\/?colgroup[^>]*>/gi, '')
  }

  // ── Apple Pages / iWork cleanup (only if Apple Pages detected) ──
  if (isApplePages) {
    cleaned = cleaned.replace(/\s*class="(s|p)\d+"/gi, '')
    cleaned = cleaned.replace(/<div\s+apple-content-edited="true"[^>]*>/gi, '<div>')
  }

  // ── Common cleanup (always run) ──

  // Remove empty style attributes
  cleaned = cleaned.replace(/\s*style="\s*"/gi, '')

  // Remove empty class attributes
  cleaned = cleaned.replace(/\s*class="\s*"/gi, '')

  // Remove empty spans (no attributes)
  cleaned = cleaned.replace(/<span\s*>([\s\S]*?)<\/span>/gi, '$1')

  // Normalize whitespace in tags
  cleaned = cleaned.replace(/<(\w+)\s+>/g, '<$1>')

  // Remove empty paragraphs (except intentional line breaks)
  cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, '')

  // Remove empty divs
  cleaned = cleaned.replace(/<div[^>]*>\s*<\/div>/gi, '')

  // ── Font tag conversion (always run) ──
  // Use flexible regexes that match attributes anywhere in the tag (not just first position)
  cleaned = cleaned.replace(/<font\s[^>]*?face="([^"]*)"[^>]*>([\s\S]*?)<\/font>/gi,
    '<span style="font-family: $1">$2</span>')
  cleaned = cleaned.replace(/<font\s[^>]*?color="([^"]*)"[^>]*>([\s\S]*?)<\/font>/gi,
    '<span style="color: $1">$2</span>')
  cleaned = cleaned.replace(/<font\s[^>]*?size="([^"]*)"[^>]*>([\s\S]*?)<\/font>/gi, '$2')
  cleaned = cleaned.replace(/<\/?font[^>]*>/gi, '')

  // ── Normalize semantic tags (always run) ──
  cleaned = cleaned.replace(/<b(\s|>)/gi, '<strong$1')
  cleaned = cleaned.replace(/<\/b>/gi, '</strong>')
  cleaned = cleaned.replace(/<i(\s|>)/gi, '<em$1')
  cleaned = cleaned.replace(/<\/i>/gi, '</em>')

  // ── Convert Word-style list paragraphs to real lists (only if Word detected) ──
  if (isWord) {
    cleaned = convertWordListParagraphs(cleaned)
  }

  // ── Final whitespace cleanup ──
  cleaned = cleaned.replace(/(<br\s*\/?\s*>){3,}/gi, '<br><br>')

  return cleaned.trim()
}


/**
 * Detect Word-style list paragraphs and convert them to proper HTML lists.
 * Word often exports lists as:
 *   <p style="margin-left:36pt;text-indent:-18pt">·  Item text</p>
 *   <p style="margin-left:36pt;text-indent:-18pt">1.  Item text</p>
 */
function convertWordListParagraphs(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html')
  const paragraphs = doc.querySelectorAll('p')

  let inList = false
  let listType = null
  let listEl = null

  for (const p of paragraphs) {
    const text = p.textContent.trim()
    const style = p.getAttribute('style') || ''
    const hasIndent = INDENT_PATTERN.test(style)

    const isBullet = BULLET_PATTERN.test(text)
    const isNumber = NUMBER_PATTERN.test(text) || LETTER_PATTERN.test(text)

    if ((isBullet || isNumber) && hasIndent) {
      const type = isBullet ? 'ul' : 'ol'

      if (!inList || listType !== type) {
        listEl = doc.createElement(type)
        p.parentNode.insertBefore(listEl, p)
        inList = true
        listType = type
      }

      const li = doc.createElement('li')
      // Single combined regex instead of 3 separate .replace() calls
      li.innerHTML = p.innerHTML.replace(LIST_PREFIX_PATTERN, '')
      listEl.appendChild(li)
      p.parentNode.removeChild(p)
    } else {
      inList = false
      listType = null
      listEl = null
    }
  }

  return doc.body.innerHTML
}


/**
 * Detect whether plain text looks like Markdown content.
 * Returns true if the text contains enough markdown patterns
 * to justify converting it rather than treating it as plain text.
 *
 * @param {string} text - Plain text to check
 * @returns {boolean}
 */
// Pre-compiled markdown detection patterns (avoid recompilation per line)
const MD_HEADING = /^#{1,6}\s+\S/
const MD_UNORDERED = /^[-*+]\s+\S/
const MD_ORDERED = /^\d+[.)]\s+\S/
const MD_TASK = /^[-*+]\s+\[[ xX]\]\s/
const MD_BLOCKQUOTE = /^>\s/
const MD_HR = /^([-*_])\1{2,}$/
const MD_CODE_FENCE = /^```/
const MD_BOLD = /\*\*[^*]+\*\*/
const MD_BOLD_ALT = /__[^_]+__/
const MD_ITALIC = /(?<!\w)\*[^*\s][^*]*\*(?!\w)/
const MD_LINK = /\[.+\]\(.+\)/
const MD_IMAGE = /!\[.*\]\(.+\)/
const MD_TABLE = /^\|.+\|/
const MD_TABLE_SEP = /^\|[\s-:|]+\|$/
const MD_INLINE_CODE = /`[^`]+`/

export function looksLikeMarkdown(text) {
  if (!text || text.length < 3) return false

  const lines = text.split('\n')
  let markdownSignals = 0
  let totalNonEmptyLines = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    totalNonEmptyLines++

    if (MD_HEADING.test(trimmed)) { markdownSignals += 2; continue }
    if (MD_UNORDERED.test(trimmed)) { markdownSignals++; continue }
    if (MD_ORDERED.test(trimmed)) { markdownSignals++; continue }
    if (MD_TASK.test(trimmed)) { markdownSignals += 2; continue }
    if (MD_BLOCKQUOTE.test(trimmed)) { markdownSignals++; continue }
    if (MD_HR.test(trimmed)) { markdownSignals++; continue }
    if (MD_CODE_FENCE.test(trimmed)) { markdownSignals += 2; continue }
    if (MD_BOLD.test(trimmed) || MD_BOLD_ALT.test(trimmed)) { markdownSignals++; continue }
    if (MD_ITALIC.test(trimmed)) { markdownSignals++; continue }
    if (MD_LINK.test(trimmed)) { markdownSignals++; continue }
    if (MD_IMAGE.test(trimmed)) { markdownSignals += 2; continue }
    if (MD_TABLE.test(trimmed)) { markdownSignals++; continue }
    if (MD_TABLE_SEP.test(trimmed)) { markdownSignals++; continue }
    if (MD_INLINE_CODE.test(trimmed)) { markdownSignals++; continue }
  }

  if (totalNonEmptyLines === 0) return false

  // If at least 30% of non-empty lines have markdown signals,
  // or if there are 2+ signals total, it's probably markdown
  const ratio = markdownSignals / totalNonEmptyLines
  return ratio >= 0.3 || markdownSignals >= 2
}
