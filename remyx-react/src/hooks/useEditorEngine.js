import { useEffect, useRef, useState, useCallback } from 'react'
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
  registerMarkdownToggleCommands,
  registerAttachmentCommands,
  registerImportDocumentCommands,
  WordCountPlugin,
  PlaceholderPlugin,
  AutolinkPlugin,
  htmlToMarkdown,
  markdownToHtml,
} from '@remyx/core'

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
  registerMarkdownToggleCommands,
  registerAttachmentCommands,
  registerImportDocumentCommands,
]

export function useEditorEngine(editAreaRef, options, readyTrigger) {
  const engineRef = useRef(null)
  const [ready, setReady] = useState(false)
  const lastValueRef = useRef(options.value || options.defaultValue || '')

  // Use a ref to always access the latest options (avoids stale closure in initEngine)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const initEngine = useCallback(() => {
    if (!editAreaRef.current || engineRef.current) return

    const opts = optionsRef.current
    const engine = new EditorEngine(editAreaRef.current, opts)

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

    // Register built-in plugins
    engine.plugins.register(WordCountPlugin())
    if (opts.placeholder) {
      engine.plugins.register(PlaceholderPlugin(opts.placeholder))
    }
    engine.plugins.register(AutolinkPlugin())

    // Register user plugins
    if (opts.plugins) {
      opts.plugins.forEach((p) => engine.plugins.register(p))
    }

    // Set initial content (convert markdown → HTML if needed)
    const isMarkdown = opts.outputFormat === 'markdown'
    let initialContent = opts.value || opts.defaultValue || ''
    if (initialContent && isMarkdown) {
      initialContent = markdownToHtml(initialContent)
    }
    if (initialContent) {
      engine.setHTML(initialContent)
    }

    engine.init()
    engineRef.current = engine
    setReady(true)
    opts.onReady?.(engine)

    // Emit initial content change so plugins (word count, placeholder) pick up content
    engine.eventBus.emit('content:change')

    // Listen for content changes — use optionsRef to always call latest onChange
    // Convert HTML → markdown if outputFormat is 'markdown'
    engine.on('content:change', () => {
      let output
      if (engine.isMarkdownMode) {
        // In markdown editing mode, the content is raw markdown text
        output = engine.element.textContent
      } else {
        const html = engine.getHTML()
        const ismd = optionsRef.current.outputFormat === 'markdown'
        output = ismd ? htmlToMarkdown(html) : html
      }
      if (output !== lastValueRef.current) {
        lastValueRef.current = output
        optionsRef.current.onChange?.(output)
      }
    })

    engine.on('focus', () => optionsRef.current.onFocus?.())
    engine.on('blur', () => optionsRef.current.onBlur?.())

    return engine
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const engine = initEngine()
    return () => {
      if (engine) {
        engine.destroy()
        engineRef.current = null
        setReady(false)
      }
    }
  }, [initEngine, readyTrigger]) // readyTrigger allows deferred init (e.g. after portal mount)

  // Sync external value changes (convert markdown → HTML if needed)
  useEffect(() => {
    if (!engineRef.current || !ready) return
    if (options.value === undefined) return
    if (options.value === lastValueRef.current) return

    lastValueRef.current = options.value
    const isMarkdown = options.outputFormat === 'markdown'
    const htmlValue = isMarkdown ? markdownToHtml(options.value) : options.value
    engineRef.current.setHTML(htmlValue)
  }, [options.value, options.outputFormat, ready])

  return { engine: engineRef.current, ready }
}
