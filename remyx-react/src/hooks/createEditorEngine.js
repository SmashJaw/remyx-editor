/**
 * Shared factory for creating and initializing an EditorEngine with all built-in
 * commands and plugins. Used by both useRemyxEditor and useEditorEngine to avoid
 * ~100 lines of duplicated init logic (Item 6).
 */
import {
  EditorEngine,
  registerFormattingCommands,
  registerHeadingCommands,
  registerAlignmentCommands,
  registerListCommands,
  registerLinkCommands,
  registerImageCommands,
  registerTableCommands,
  registerBlockCommands,
  registerFontCommands,
  registerMediaCommands,
  registerFindReplaceCommands,
  registerSourceModeCommands,
  registerFullscreenCommands,
  registerDistractionFreeCommands,
  registerSplitViewCommands,
  registerColorPresetCommands,
  registerMarkdownToggleCommands,
  registerAttachmentCommands,
  registerImportDocumentCommands,
  registerBlockConvertCommands,
  WordCountPlugin,
  PlaceholderPlugin,
  AutolinkPlugin,
  htmlToMarkdown,
  markdownToHtml,
} from '@remyxjs/core'

/** All built-in command registration functions, invoked in order during engine init */
const COMMAND_REGISTRARS = [
  registerFormattingCommands,
  registerHeadingCommands,
  registerAlignmentCommands,
  registerListCommands,
  registerLinkCommands,
  registerImageCommands,
  registerTableCommands,
  registerBlockCommands,
  registerFontCommands,
  registerMediaCommands,
  registerFindReplaceCommands,
  registerSourceModeCommands,
  registerFullscreenCommands,
  registerDistractionFreeCommands,
  registerSplitViewCommands,
  registerColorPresetCommands,
  registerMarkdownToggleCommands,
  registerAttachmentCommands,
  registerImportDocumentCommands,
  registerBlockConvertCommands,
]

/**
 * Create an EditorEngine, register all built-in commands and plugins, set initial content.
 *
 * @param {HTMLElement} element - The contenteditable element
 * @param {object} opts - Editor options
 * @returns {{ engine: EditorEngine, initialContent: string }}
 */
export function createEditorInstance(element, opts) {
  const engine = new EditorEngine(element, opts)

  // Register all built-in commands via registry loop
  for (const register of COMMAND_REGISTRARS) {
    register(engine)
  }

  // Register undo/redo commands
  engine.commands.register('undo', {
    execute(eng) { eng.history.undo() },
    isEnabled(eng) { return eng.history.canUndo() },
    shortcut: 'mod+z',
    meta: { icon: 'undo', tooltip: 'Undo' },
  })
  engine.commands.register('redo', {
    execute(eng) { eng.history.redo() },
    isEnabled(eng) { return eng.history.canRedo() },
    shortcut: 'mod+shift+z',
    meta: { icon: 'redo', tooltip: 'Redo' },
  })

  // Check if user already provided specific plugins to avoid duplicate registration
  const userPluginNames = new Set(
    (opts.plugins || []).map(p => p?.name).filter(Boolean)
  )

  // Register built-in plugins (skip if user already provided them)
  if (!userPluginNames.has('wordCount')) engine.plugins.register(WordCountPlugin())
  if (opts.placeholder && !userPluginNames.has('placeholder')) {
    engine.plugins.register(PlaceholderPlugin(opts.placeholder))
  }
  if (!userPluginNames.has('autolink')) engine.plugins.register(AutolinkPlugin())

  // Register user plugins
  if (opts.plugins) {
    opts.plugins.forEach((p) => engine.plugins.register(p))
  }

  // Set initial content (convert markdown -> HTML if needed)
  const isMarkdown = opts.outputFormat === 'markdown'
  let initialContent = opts.value || opts.defaultValue || ''
  if (initialContent && isMarkdown) {
    initialContent = markdownToHtml(initialContent)
  }
  if (initialContent) {
    engine.setHTML(initialContent)
  }

  return { engine, initialContent }
}

export { htmlToMarkdown, markdownToHtml }
