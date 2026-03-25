import { useEffect, useRef, useState, useCallback } from 'react'
import { createEditorInstance, htmlToMarkdown, markdownToHtml } from './createEditorEngine.js'

/**
 * Item 6: Shared factory extracted to createEditorEngine.js.
 * Item 7: registerBlockConvertCommands included in shared factory.
 * Item 14: rAF cancelled on unmount.
 */
export function useEditorEngine(editAreaRef, options, readyTrigger) {
  const engineRef = useRef(null)
  const [ready, setReady] = useState(false)
  const lastValueRef = useRef(options.value || options.defaultValue || '')
  const rAFRef = useRef(null)

  // Use a ref to always access the latest options (avoids stale closure in initEngine)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const initEngine = useCallback(() => {
    if (!editAreaRef.current || engineRef.current) return

    const opts = optionsRef.current
    const { engine } = createEditorInstance(editAreaRef.current, opts)

    engine.init()
    engineRef.current = engine
    setReady(true)
    opts.onReady?.(engine)

    // Emit initial content change so plugins (word count, placeholder) pick up content
    engine.eventBus.emit('content:change')

    // Listen for content changes — use optionsRef to always call latest onChange
    // Convert HTML -> markdown if outputFormat is 'markdown'
    // Item 14: Store rAF ID in ref for cleanup
    engine.on('content:change', () => {
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current)
      rAFRef.current = requestAnimationFrame(() => {
        rAFRef.current = null
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
    })

    engine.on('focus', () => optionsRef.current.onFocus?.())
    engine.on('blur', () => optionsRef.current.onBlur?.())

    return engine
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const engine = initEngine()
    return () => {
      // Item 14: Cancel any pending rAF on unmount
      if (rAFRef.current) {
        cancelAnimationFrame(rAFRef.current)
        rAFRef.current = null
      }
      if (engine) {
        engine.destroy()
        engineRef.current = null
        setReady(false)
      }
    }
  }, [initEngine, readyTrigger]) // readyTrigger allows deferred init (e.g. after portal mount)

  // Sync external value changes (convert markdown -> HTML if needed)
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
