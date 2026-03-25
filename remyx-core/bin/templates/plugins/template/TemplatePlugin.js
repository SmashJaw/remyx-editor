/**
 * TemplatePlugin — Merge tags, conditional blocks, repeatable sections,
 * live preview with sample data, and pre-built template library.
 *
 * Merge tag syntax: {{variable_name}}
 * Conditionals:    {{#if condition}}...{{/if}}
 * Loops:           {{#each items}}...{{/each}}
 *
 * Tags are rendered as inline chips: <span class="rmx-merge-tag" data-tag="name">{{name}}</span>
 */

import { createPlugin } from '@remyxjs/core'

// ---------------------------------------------------------------------------
// Template parsing & rendering
// ---------------------------------------------------------------------------

/** Match merge tags: {{variable}} */
const TAG_REGEX = /\{\{([^{}]+)\}\}/g

/** Match block tags: {{#if x}}...{{/if}} and {{#each x}}...{{/each}} */
const BLOCK_IF_REGEX = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g
const BLOCK_EACH_REGEX = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g

/**
 * Render a template string with data.
 * Processes {{#each}}, {{#if}}, and {{variable}} tags.
 * @param {string} template
 * @param {Object} data
 * @returns {string}
 */
export function renderTemplate(template, data) {
  if (!template || !data) return template || ''
  let result = template

  // Process {{#each items}}...{{/each}}
  result = result.replace(BLOCK_EACH_REGEX, (_, key, body) => {
    const arr = data[key]
    if (!Array.isArray(arr)) return ''
    return arr.map(item => {
      let rendered = body
      if (typeof item === 'object' && item !== null) {
        rendered = renderTemplate(body, { ...data, ...item })
      } else {
        rendered = rendered.replace(/\{\{this\}\}/g, String(item))
      }
      return rendered
    }).join('')
  })

  // Process {{#if condition}}...{{/if}}
  result = result.replace(BLOCK_IF_REGEX, (_, key, body) => {
    return data[key] ? renderTemplate(body, data) : ''
  })

  // Process {{variable}} tags
  result = result.replace(TAG_REGEX, (_, key) => {
    const trimmed = key.trim()
    return trimmed in data ? String(data[trimmed]) : `{{${trimmed}}}`
  })

  return result
}

/**
 * Extract all unique tag names from a template string.
 * @param {string} template
 * @returns {string[]}
 */
export function extractTags(template) {
  if (!template) return []
  const tags = new Set()
  const matches = template.matchAll(/\{\{(?:#(?:if|each)\s+)?(\w+)\}\}/g)
  for (const m of matches) tags.add(m[1])
  return Array.from(tags)
}

// ---------------------------------------------------------------------------
// Pre-built template library
// ---------------------------------------------------------------------------

/** @type {Map<string, { name: string, category: string, html: string, sampleData: Object }>} */
const _templateLibrary = new Map()

const BUILTIN_TEMPLATES = [
  {
    id: 'email',
    name: 'Email',
    category: 'Communication',
    html: '<p>Dear {{recipient_name}},</p><p>{{body}}</p><p>Best regards,<br>{{sender_name}}<br>{{sender_title}}</p>',
    sampleData: { recipient_name: 'John Doe', body: 'Thank you for your interest in our product.', sender_name: 'Jane Smith', sender_title: 'Sales Manager' },
  },
  {
    id: 'invoice',
    name: 'Invoice',
    category: 'Business',
    html: '<h2>Invoice #{{invoice_number}}</h2><p>Date: {{date}}</p><p>Bill to: <strong>{{client_name}}</strong></p><p>{{client_address}}</p><table class="rmx-table"><thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead><tbody><tr><td>{{item_1}}</td><td>{{qty_1}}</td><td>{{price_1}}</td></tr></tbody></table><p><strong>Total: {{total}}</strong></p>',
    sampleData: { invoice_number: 'INV-001', date: '2026-03-19', client_name: 'Acme Corp', client_address: '123 Main St', item_1: 'Widget', qty_1: '10', price_1: '$29.99', total: '$299.90' },
  },
  {
    id: 'letter',
    name: 'Letter',
    category: 'Communication',
    html: '<p>{{date}}</p><p>{{recipient_name}}<br>{{recipient_address}}</p><p>Dear {{recipient_name}},</p><p>{{body}}</p><p>Sincerely,<br>{{sender_name}}</p>',
    sampleData: { date: 'March 19, 2026', recipient_name: 'John Doe', recipient_address: '456 Oak Ave', body: 'I am writing to inform you...', sender_name: 'Jane Smith' },
  },
  {
    id: 'report',
    name: 'Report',
    category: 'Business',
    html: '<h1>{{title}}</h1><p><em>Prepared by {{author}} | {{date}}</em></p><h2>Executive Summary</h2><p>{{summary}}</p><h2>Findings</h2><p>{{findings}}</p><h2>Recommendations</h2><p>{{recommendations}}</p>',
    sampleData: { title: 'Q1 2026 Report', author: 'Analytics Team', date: 'March 2026', summary: 'Key findings from Q1...', findings: 'Revenue increased by 15%...', recommendations: 'Continue investing in...' },
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    category: 'Marketing',
    html: '<h1>{{newsletter_name}}</h1><p><em>{{edition}} | {{date}}</em></p><hr><h2>{{headline}}</h2><p>{{lead_story}}</p>{{#if has_coupon}}<div class="rmx-callout rmx-callout-success" data-callout="success"><div class="rmx-callout-header" contenteditable="false"><span class="rmx-callout-icon">\u2705</span><span class="rmx-callout-title">Special Offer</span></div><div class="rmx-callout-body"><p>Use code <strong>{{coupon_code}}</strong> for {{discount}} off!</p></div></div>{{/if}}<p>{{closing}}</p>',
    sampleData: { newsletter_name: 'The Weekly Digest', edition: 'Vol. 12', date: 'March 19, 2026', headline: 'Big News This Week', lead_story: 'We are excited to announce...', has_coupon: true, coupon_code: 'SAVE20', discount: '20%', closing: 'Thanks for reading!' },
  },
]

for (const t of BUILTIN_TEMPLATES) _templateLibrary.set(t.id, t)

/**
 * Register a custom template in the library.
 * @param {{ id: string, name: string, category: string, html: string, sampleData?: Object }} template
 */
export function registerTemplate(template) {
  if (!template?.id) return
  _templateLibrary.set(template.id, template)
}

/**
 * Remove a template from the library.
 * @param {string} id
 * @returns {boolean}
 */
export function unregisterTemplate(id) {
  return _templateLibrary.delete(id)
}

/**
 * Get all templates in the library.
 * @returns {Array}
 */
export function getTemplateLibrary() {
  return Array.from(_templateLibrary.values())
}

/**
 * Get a template by ID.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getTemplate(id) {
  return _templateLibrary.get(id)
}

// ---------------------------------------------------------------------------
// DOM: convert {{tags}} to visual chips
// ---------------------------------------------------------------------------

function textToChips(html) {
  return html.replace(TAG_REGEX, (match, key) => {
    const trimmed = key.trim()
    if (trimmed.startsWith('#') || trimmed.startsWith('/')) return match
    return `<span class="rmx-merge-tag" data-tag="${trimmed}" contenteditable="false">{{${trimmed}}}</span>`
  })
}

function chipsToText(html) {
  return html.replace(/<span[^>]*class="rmx-merge-tag"[^>]*data-tag="([^"]*)"[^>]*>.*?<\/span>/g,
    (_, tag) => `{{${tag}}}`)
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export function TemplatePlugin(options = {}) {
  let engine = null
  let previewMode = false
  let currentData = {}

  return createPlugin({
    name: 'templates',
    requiresFullAccess: true,
    version: '1.0.0',
    description: 'Merge tags, conditional blocks, repeatable sections, live preview, template library',

    commands: [
      {
        name: 'insertMergeTag',
        execute(eng, tagName) {
          if (!tagName) return
          eng.history.snapshot()
          const sel = window.getSelection()
          if (!sel || sel.rangeCount === 0) return
          const range = sel.getRangeAt(0)
          const chip = document.createElement('span')
          chip.className = 'rmx-merge-tag'
          chip.setAttribute('data-tag', tagName)
          chip.contentEditable = 'false'
          chip.textContent = `{{${tagName}}}`
          range.deleteContents()
          range.insertNode(chip)
          // Move caret after chip
          const space = document.createTextNode('\u00A0')
          chip.after(space)
          range.setStartAfter(space)
          range.collapse(true)
          sel.removeAllRanges()
          sel.addRange(range)
          eng.eventBus.emit('content:change')
        },
        meta: { icon: 'tag', tooltip: 'Insert Merge Tag' },
      },
      {
        name: 'loadTemplate',
        execute(eng, templateId) {
          const tmpl = _templateLibrary.get(templateId)
          if (!tmpl) return null
          eng.history.snapshot()
          eng.element.innerHTML = textToChips(tmpl.html)
          currentData = { ...(tmpl.sampleData || {}) }
          eng.eventBus.emit('content:change')
          eng.eventBus.emit('template:loaded', { id: templateId, template: tmpl })
          return tmpl
        },
        meta: { icon: 'template', tooltip: 'Load Template' },
      },
      {
        name: 'previewTemplate',
        execute(eng, data) {
          if (!data && Object.keys(currentData).length === 0) return
          const mergedData = data || currentData
          currentData = mergedData
          const rawHtml = chipsToText(eng.getHTML())
          const rendered = renderTemplate(rawHtml, mergedData)
          previewMode = true
          eng._templateBackup = eng.element.innerHTML
          eng.element.innerHTML = rendered
          eng.element.contentEditable = 'false'
          eng.element.classList.add('rmx-template-preview')
          eng.eventBus.emit('template:preview', { data: mergedData })
        },
        meta: { icon: 'preview', tooltip: 'Preview Template' },
      },
      {
        name: 'exitPreview',
        execute(eng) {
          if (!previewMode) return
          previewMode = false
          if (eng._templateBackup) {
            eng.element.innerHTML = eng._templateBackup
            delete eng._templateBackup
          }
          eng.element.contentEditable = 'true'
          eng.element.classList.remove('rmx-template-preview')
          eng.eventBus.emit('template:exitPreview')
        },
        meta: { icon: 'edit', tooltip: 'Exit Preview' },
      },
      {
        name: 'exportTemplate',
        execute(eng) {
          const html = chipsToText(eng.getHTML())
          const tags = extractTags(html)
          return { html, tags, sampleData: { ...currentData } }
        },
        meta: { icon: 'export', tooltip: 'Export Template' },
      },
      {
        name: 'getTemplateTags',
        execute(eng) {
          return extractTags(chipsToText(eng.getHTML()))
        },
        meta: { tooltip: 'Get Template Tags' },
      },
    ],

    contextMenuItems: [
      { label: 'Insert Merge Tag', command: 'insertMergeTag' },
    ],

    init(eng) {
      engine = eng
      engine._templates = {
        renderTemplate,
        extractTags,
        getTemplateLibrary,
        getTemplate,
        registerTemplate,
        unregisterTemplate,
        textToChips,
        chipsToText,
        setPreviewData: (data) => { currentData = { ...data } },
        getPreviewData: () => ({ ...currentData }),
        isPreviewMode: () => previewMode,
      }
    },

    destroy() {
      if (previewMode && engine) {
        engine.element.contentEditable = 'true'
        engine.element.classList.remove('rmx-template-preview')
      }
      engine = null
    },
  })
}
