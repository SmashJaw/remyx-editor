import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import { marked } from 'marked'

// Lazy singletons — zero overhead when outputFormat is 'html'
let turndownInstance = null
let markedConfigured = false

function getTurndown() {
  if (!turndownInstance) {
    turndownInstance = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      fence: '```',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
    })
    turndownInstance.use(gfm)

    // Preserve <br> as markdown line breaks
    turndownInstance.addRule('lineBreak', {
      filter: 'br',
      replacement: () => '  \n',
    })

    // Handle editor-specific task list checkboxes
    turndownInstance.addRule('taskCheckbox', {
      filter(node) {
        return (
          node.nodeName === 'INPUT' &&
          node.type === 'checkbox' &&
          node.classList.contains('rmx-task-checkbox')
        )
      },
      replacement(content, node) {
        return node.checked ? '[x] ' : '[ ] '
      },
    })

    // Preserve language identifier on fenced code blocks (data-language attribute)
    turndownInstance.addRule('fencedCodeBlockWithLanguage', {
      filter(node) {
        return (
          node.nodeName === 'PRE' &&
          node.firstChild &&
          node.firstChild.nodeName === 'CODE'
        )
      },
      replacement(content, node) {
        const code = node.firstChild
        const language = code.getAttribute('data-language') || ''
        const text = code.textContent
        return `\n\n\`\`\`${language}\n${text}\n\`\`\`\n\n`
      },
    })

    // Preserve underline as <u> tag in markdown (non-standard but useful)
    turndownInstance.addRule('underline', {
      filter: ['u'],
      replacement(content) {
        return `<u>${content}</u>`
      },
    })
  }
  return turndownInstance
}

// Safe URL protocol allowlist for markdown-generated links and images
const SAFE_URL_PROTOCOL = /^(https?:|mailto:|tel:|#|\/)/i

function ensureMarkedConfigured() {
  if (!markedConfigured) {
    marked.setOptions({
      gfm: true,
      breaks: false,
    })

    // Override link and image renderers to block dangerous protocols (javascript:, vbscript:, data:text/html)
    const renderer = new marked.Renderer()
    renderer.link = ({ href, title, tokens }) => {
      const text = marked.Parser.parseInline(tokens)
      if (href && !SAFE_URL_PROTOCOL.test(href)) {
        return text
      }
      const titleAttr = title ? ` title="${title.replace(/"/g, '&quot;')}"` : ''
      return `<a href="${href}"${titleAttr}>${text}</a>`
    }
    renderer.image = ({ href, title, text }) => {
      if (href && !SAFE_URL_PROTOCOL.test(href) && !href.startsWith('data:image/')) {
        return text || ''
      }
      const titleAttr = title ? ` title="${title.replace(/"/g, '&quot;')}"` : ''
      return `<img src="${href}" alt="${text || ''}"${titleAttr} />`
    }
    // Preserve language identifiers on fenced code blocks as data-language attributes
    renderer.code = ({ text, lang }) => {
      const langAttr = lang ? ` data-language="${lang.replace(/"/g, '&quot;')}"` : ''
      const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return `<pre${langAttr}><code${langAttr}>${escaped}</code></pre>\n`
    }

    marked.use({ renderer })

    markedConfigured = true
  }
}

/**
 * Convert HTML to Markdown (GFM)
 * @param {string} html
 * @returns {string}
 */
export function htmlToMarkdown(html) {
  if (!html || html === '<p><br></p>') return ''
  return getTurndown().turndown(html)
}

/**
 * Convert Markdown to HTML
 * @param {string} md
 * @returns {string}
 */
export function markdownToHtml(md) {
  if (!md) return ''
  ensureMarkedConfigured()
  return marked.parse(md)
}
