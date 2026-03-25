import { htmlToMarkdown, markdownToHtml } from '../utils/markdownConverter.js'

export function registerMarkdownToggleCommands(engine) {
  engine.commands.register('toggleMarkdown', {
    execute(eng) {
      eng.history.snapshot()

      if (eng.isMarkdownMode) {
        // Markdown → HTML: get raw text, convert to rich HTML
        const markdown = eng.element.textContent
        const html = markdownToHtml(markdown)
        eng.setHTML(html)
        eng.isMarkdownMode = false
      } else {
        // HTML → Markdown: get HTML, convert to markdown, show as text
        const html = eng.getHTML()
        const markdown = htmlToMarkdown(html)
        eng.element.textContent = markdown
        eng.isMarkdownMode = true
      }

      eng.element.classList.toggle('rmx-markdown-mode', eng.isMarkdownMode)
      eng.eventBus.emit('mode:change:markdown', { markdownMode: eng.isMarkdownMode })
      eng.eventBus.emit('content:change')
    },
    isActive(eng) {
      return eng.isMarkdownMode
    },
    meta: { icon: 'toggleMarkdown', tooltip: 'Toggle Markdown' },
  })
}
