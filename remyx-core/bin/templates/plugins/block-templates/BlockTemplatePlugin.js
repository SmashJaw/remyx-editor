import { createPlugin } from '@remyxjs/core'

/**
 * Built-in block templates for common content patterns.
 */
const BUILT_IN_TEMPLATES = {
  'Feature Card': `<div class="rmx-template-feature-card" style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:8px 0;">
  <img src="" alt="Feature image" style="width:100%;height:auto;border-radius:4px;margin-bottom:12px;" />
  <h3>Feature Title</h3>
  <p>Describe the feature here. Highlight key benefits and value propositions.</p>
</div>`,

  'Two-Column': `<div class="rmx-template-two-column" style="display:flex;gap:16px;margin:8px 0;">
  <div style="flex:1;padding:12px;border:1px solid #e2e8f0;border-radius:4px;">
    <p>Left column content</p>
  </div>
  <div style="flex:1;padding:12px;border:1px solid #e2e8f0;border-radius:4px;">
    <p>Right column content</p>
  </div>
</div>`,

  'Call to Action': `<div class="rmx-template-cta" style="text-align:center;padding:24px;margin:8px 0;background:#f8fafc;border-radius:8px;">
  <h2>Ready to Get Started?</h2>
  <p>Take the next step and join thousands of satisfied users today.</p>
  <p><span style="display:inline-block;padding:10px 24px;background:#6366f1;color:#fff;border-radius:6px;font-weight:600;">Get Started</span></p>
</div>`,
}

/**
 * BlockTemplatePlugin - Manages reusable block templates.
 *
 * Provides registerTemplate, insertTemplate, getTemplates, and removeTemplate
 * methods on the engine via engine._blockTemplates.
 */
export function BlockTemplatePlugin() {
  /** @type {Map<string, string>} */
  const templates = new Map()

  return createPlugin({
    name: 'blockTemplates',
    requiresFullAccess: true,

    init(engine) {
      // Load built-in templates
      for (const [name, html] of Object.entries(BUILT_IN_TEMPLATES)) {
        templates.set(name, html)
      }

      /**
       * Register a custom block template.
       * @param {string} name - Template name
       * @param {string} htmlString - HTML content for the template
       */
      function registerTemplate(name, htmlString) {
        if (!name || typeof htmlString !== 'string') return
        templates.set(name, htmlString)
      }

      /**
       * Insert a template by name at the current caret position.
       * @param {string} name - Template name
       */
      function insertTemplate(name) {
        const html = templates.get(name)
        if (!html) return

        engine.history.snapshot()

        const range = engine.selection.getRange()
        if (!range) return

        // Parse the template HTML
        const temp = document.createElement('div')
        temp.innerHTML = engine.sanitizer.sanitize(html)

        // Insert each child node at the caret
        const frag = document.createDocumentFragment()
        while (temp.firstChild) {
          frag.appendChild(temp.firstChild)
        }

        if (!range.collapsed) {
          range.deleteContents()
        }
        range.insertNode(frag)

        // Ensure there's a paragraph after for continued editing
        const editorEl = engine.element
        if (!editorEl.lastElementChild || editorEl.lastElementChild.tagName !== 'P') {
          const p = document.createElement('p')
          p.innerHTML = '<br>'
          editorEl.appendChild(p)
        }

        engine.eventBus.emit('content:change')
      }

      /**
       * Get all registered template names and their HTML.
       * @returns {Array<{ name: string, html: string }>}
       */
      function getTemplates() {
        return Array.from(templates.entries()).map(([name, html]) => ({ name, html }))
      }

      /**
       * Remove a template by name.
       * @param {string} name - Template name
       * @returns {boolean} true if removed
       */
      function removeTemplate(name) {
        return templates.delete(name)
      }

      // Expose API on engine
      engine._blockTemplates = {
        registerTemplate,
        insertTemplate,
        getTemplates,
        removeTemplate,
      }
    },

    destroy() {
      templates.clear()
    },
  })
}
