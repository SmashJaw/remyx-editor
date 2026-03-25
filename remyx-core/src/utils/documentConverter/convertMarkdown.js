import { readAsText } from './shared.js'
import { markdownToHtml } from '../markdownConverter.js'

/**
 * Convert a Markdown file to HTML using the existing marked setup.
 */
export default async function convertMarkdown(file) {
  const text = await readAsText(file)
  return markdownToHtml(text)
}
