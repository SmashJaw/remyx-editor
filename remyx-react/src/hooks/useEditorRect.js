import { useState, useEffect, useRef } from 'react'

/**
 * Tracks the bounding rect of the editor root element.
 * Uses ResizeObserver instead of window resize events for precision,
 * and requestAnimationFrame to throttle scroll updates.
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

    // Throttled scroll handler using rAF
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateRect)
    }
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('scroll', handleScroll, true)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [editorRootRef])

  return editorRect
}
