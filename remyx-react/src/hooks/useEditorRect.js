import { useState, useEffect, useRef } from 'react'

/**
 * Tracks the bounding rect of the editor root element.
 * Uses ResizeObserver instead of window resize events for precision,
 * and requestAnimationFrame to throttle scroll updates.
 * Task 258: Limit scroll listener to the editor's scrollable parent rather than global capture.
 */
export function useEditorRect(editorRootRef) {
  const [editorRect, setEditorRect] = useState(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const el = editorRootRef.current
    if (!el) return // Early return guard if ref is not yet valid

    const updateRect = () => {
      const rect = el.getBoundingClientRect()
      if (rect) setEditorRect(rect)
    }

    // Initial measurement
    updateRect()

    // Use ResizeObserver instead of window resize listener
    const resizeObserver = new ResizeObserver(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateRect)
    })
    resizeObserver.observe(el)

    // Task 258: Find the editor's scrollable parent and listen on that
    // instead of using global capture on window
    const scrollParent = findScrollableParent(el) || window
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateRect)
    }
    scrollParent.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      resizeObserver.disconnect()
      scrollParent.removeEventListener('scroll', handleScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [editorRootRef])

  return editorRect
}

/**
 * Walk up the DOM to find the first scrollable parent.
 * @param {HTMLElement} el
 * @returns {HTMLElement|null}
 */
function findScrollableParent(el) {
  let parent = el.parentElement
  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent)
    const overflow = style.overflow + style.overflowY
    if (/auto|scroll/.test(overflow)) return parent
    parent = parent.parentElement
  }
  return null
}
