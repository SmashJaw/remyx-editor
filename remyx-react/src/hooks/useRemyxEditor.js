import { useEffect, useRef, useState, useCallback } from 'react'
import { createEditorInstance, htmlToMarkdown, markdownToHtml } from './createEditorEngine.js'

/**
 * useRemyxEditor - A hook to attach a full WYSIWYG editor to any existing
 * DOM element (div, textarea, or any block element).
 *
 * Item 6: Shared init logic extracted to createEditorEngine.js.
 * Item 7: registerBlockConvertCommands included in shared factory.
 *
 * For textareas: hides the textarea and creates a contenteditable div that
 * syncs back to the textarea's value. On form submit the textarea value is
 * up to date.
 *
 * For divs / other elements: uses the element directly as the contenteditable
 * surface (or creates a child contenteditable if the element contains other
 * content to preserve).
 *
 * Usage:
 *   const targetRef = useRef(null)
 *   const { engine, containerRef } = useRemyxEditor(targetRef, { onChange, placeholder, ... })
 *
 *   return <textarea ref={targetRef} />
 *   // or  <div ref={targetRef} />
 *
 * The hook returns:
 *   - engine: the EditorEngine instance (null until initialized)
 *   - containerRef: ref to the wrapper div that contains toolbar + edit area
 *   - ready: boolean
 */
export function useRemyxEditor(targetRef, options = {}) {
  const engineRef = useRef(null)
  const containerRef = useRef(null)
  const editableRef = useRef(null)
  const [ready, setReady] = useState(false)
  const lastValueRef = useRef('')
  const cleanupRef = useRef(null)
  const formRef = useRef(null)
  const syncToTextareaRef = useRef(null)

  const initEditor = useCallback(() => {
    const target = targetRef.current
    if (!target || engineRef.current) return

    const tagName = target.tagName.toLowerCase()
    const isTextarea = tagName === 'textarea'
    const isInput = tagName === 'input'

    // Determine initial content
    let initialContent = ''
    if (isTextarea || isInput) {
      initialContent = target.value || ''
    } else {
      initialContent = target.innerHTML || ''
    }
    // Use provided value/defaultValue over element content
    if (options.value !== undefined) {
      initialContent = options.value
    } else if (options.defaultValue !== undefined) {
      initialContent = options.defaultValue
    }

    // Create the wrapper container
    const container = document.createElement('div')
    const safeTheme = /^[a-zA-Z0-9_-]+$/.test(options.theme) ? options.theme : 'light'
    container.className = `rmx-editor rmx-theme-${safeTheme} ${options.className || ''}`
    if (options.style) {
      const ALLOWED_STYLE_KEYS = new Set([
        'width', 'height', 'minHeight', 'maxHeight', 'minWidth', 'maxWidth',
        'margin', 'padding', 'border', 'borderRadius', 'background', 'backgroundColor',
        'color', 'fontSize', 'fontFamily', 'overflow', 'overflowY', 'overflowX',
      ])
      for (const [key, val] of Object.entries(options.style)) {
        if (ALLOWED_STYLE_KEYS.has(key)) {
          container.style[key] = val
        }
      }
    }
    containerRef.current = container

    // Create the editable div
    const editable = document.createElement('div')
    editable.className = 'rmx-content'
    const DEFAULT_HEIGHT = 300
    const height = options.height || DEFAULT_HEIGHT
    editable.style.minHeight = typeof height === 'number' ? `${height}px` : height
    editable.style.overflowY = 'auto'

    // Create the edit area wrapper
    const editArea = document.createElement('div')
    editArea.className = 'rmx-edit-area'
    editArea.appendChild(editable)

    // Build container structure (toolbar placeholder + edit area + status bar)
    container.appendChild(editArea)

    editableRef.current = editable

    if (isTextarea || isInput) {
      // Hide the original textarea and insert the editor after it
      target.style.display = 'none'
      target.parentNode.insertBefore(container, target.nextSibling)

      // Sync back to textarea on change
      const syncToTextarea = () => {
        if (engineRef.current) {
          target.value = engineRef.current.getHTML()
        }
      }
      cleanupRef.current = () => {
        syncToTextarea()
        target.style.display = ''
        if (container.parentNode) {
          container.parentNode.removeChild(container)
        }
      }

      // Wire up form submit to sync
      const form = target.closest('form')
      if (form) {
        formRef.current = form
        syncToTextareaRef.current = syncToTextarea
        form.addEventListener('submit', syncToTextarea)
        const prevCleanup = cleanupRef.current
        cleanupRef.current = () => {
          formRef.current?.removeEventListener('submit', syncToTextareaRef.current)
          formRef.current = null
          syncToTextareaRef.current = null
          prevCleanup()
        }
      }
    } else {
      // For div / other elements: replace the element's content with the editor
      const originalContent = target.textContent
      target.innerHTML = ''
      target.appendChild(container)

      cleanupRef.current = () => {
        target.textContent = originalContent
      }
    }

    // Use shared factory (Items 6, 7)
    const engineOpts = {
      ...options,
      value: initialContent,
    }
    const { engine } = createEditorInstance(editable, engineOpts)

    engine.init()
    engineRef.current = engine
    const isMarkdown = options.outputFormat === 'markdown'
    lastValueRef.current = isMarkdown ? htmlToMarkdown(initialContent) : initialContent
    setReady(true)
    options.onReady?.(engine)
    engine.eventBus.emit('content:change')

    // Listen for content changes
    engine.on('content:change', () => {
      const html = engine.getHTML()
      const output = isMarkdown ? htmlToMarkdown(html) : html
      if (output !== lastValueRef.current) {
        lastValueRef.current = output
        options.onChange?.(output)
        // Keep textarea in sync
        if ((isTextarea || isInput) && target) {
          target.value = output
        }
      }
    })

    engine.on('focus', () => options.onFocus?.())
    engine.on('blur', () => options.onBlur?.())

    return engine
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const engine = initEditor()
    return () => {
      if (engine) {
        engine.destroy()
        engineRef.current = null
        setReady(false)
      }
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [initEditor])

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

  return {
    engine: engineRef.current,
    containerRef,
    editableRef,
    ready,
  }
}
