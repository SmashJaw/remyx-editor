import { looksLikeMarkdown } from './pasteClean.js'
import { markdownToHtml } from './markdownConverter.js'
import { escapeHTML } from './escapeHTML.js'

/**
 * Insert plain text into the editor with smart markdown detection.
 * Shared utility used by Clipboard, DragDrop, and useContextMenu.
 * @param {import('../core/EditorEngine.js').EditorEngine} engine
 * @param {string} text
 */
export function insertPlainText(engine, text) {
  if (engine.outputFormat === 'markdown' || looksLikeMarkdown(text)) {
    let parsedHtml = markdownToHtml(text)
    parsedHtml = engine.sanitizer.sanitize(parsedHtml)
    engine.selection.insertHTML(parsedHtml)
  } else {
    const escaped = escapeHTML(text)
    const formatted = escaped
      .split(/\n\n+/)
      .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
      .join('')
    engine.selection.insertHTML(formatted || '<p><br></p>')
  }
}
