import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * Detects virtual keyboard open/close and adjusts the editor to keep the
 * caret visible above the keyboard. Uses the visualViewport API when available,
 * falling back to window.innerHeight change detection.
 *
 * @param {object} engine - The editor engine instance
 * @param {React.RefObject} editorRootRef - Ref to the editor root element
 * @returns {{ keyboardVisible: boolean, keyboardHeight: number }}
 */
export function useVirtualKeyboard(engine, editorRootRef) {
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const initialHeightRef = useRef(null)

  const scrollCaretIntoView = useCallback((kbHeight) => {
    if (!engine?.element) return

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    if (!rect || (rect.top === 0 && rect.left === 0)) return

    const viewportHeight = window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight - kbHeight

    // If the caret is below the visible area (above the keyboard), scroll it into view
    if (rect.bottom > viewportHeight - 20) {
      const scrollAmount = rect.bottom - viewportHeight + 60 // 60px padding
      engine.element.scrollTop += scrollAmount
    }
  }, [engine])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Store initial viewport height to detect keyboard
    initialHeightRef.current = window.innerHeight

    // Prefer visualViewport API
    if (window.visualViewport) {
      const vv = window.visualViewport

      const handleResize = () => {
        const fullHeight = initialHeightRef.current || window.screen.height
        const currentHeight = vv.height
        const diff = fullHeight - currentHeight

        if (diff > 100) {
          // Keyboard is likely open
          setKeyboardVisible(true)
          setKeyboardHeight(diff)

          // Adjust editor root if needed
          if (editorRootRef?.current) {
            editorRootRef.current.style.paddingBottom = `${diff}px`
          }

          // Scroll caret into view
          scrollCaretIntoView(diff)
        } else {
          setKeyboardVisible(false)
          setKeyboardHeight(0)

          if (editorRootRef?.current) {
            editorRootRef.current.style.paddingBottom = ''
          }
        }
      }

      vv.addEventListener('resize', handleResize)
      return () => vv.removeEventListener('resize', handleResize)
    }

    // Fallback: detect via window resize (innerHeight changes)
    let prevHeight = window.innerHeight

    const handleResize = () => {
      const currentHeight = window.innerHeight
      const diff = prevHeight - currentHeight

      if (diff > 100) {
        setKeyboardVisible(true)
        setKeyboardHeight(diff)

        if (editorRootRef?.current) {
          editorRootRef.current.style.paddingBottom = `${diff}px`
        }

        scrollCaretIntoView(diff)
      } else if (currentHeight >= (initialHeightRef.current || prevHeight) - 50) {
        setKeyboardVisible(false)
        setKeyboardHeight(0)

        if (editorRootRef?.current) {
          editorRootRef.current.style.paddingBottom = ''
        }
      }

      prevHeight = currentHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [engine, editorRootRef, scrollCaretIntoView])

  return { keyboardVisible, keyboardHeight }
}
