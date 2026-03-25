import React, { useRef, useState, useEffect, useCallback } from 'react'

/**
 * Minimap — renders a scaled-down preview of the document on the right edge.
 * Click to scroll. Updates on content:change. Optional via `minimap` prop.
 */
export const Minimap = React.memo(function Minimap({ engine, editAreaRef }) {
  const minimapRef = useRef(null)
  const contentRef = useRef(null)
  const [viewportTop, setViewportTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(20)
  const [textContent, setTextContent] = useState('')

  // Update minimap content when editor content changes
  const updateContent = useCallback(() => {
    if (!engine?.element) return
    // Task 244: Use textContent instead of innerText (faster, no layout reflow)
    const text = engine.element.textContent || ''
    setTextContent(text)
  }, [engine])

  // Update viewport indicator on scroll
  const updateViewport = useCallback(() => {
    if (!editAreaRef?.current || !minimapRef.current) return
    const area = editAreaRef.current
    const minimap = minimapRef.current

    const scrollRatio = area.scrollTop / (area.scrollHeight || 1)
    const visibleRatio = area.clientHeight / (area.scrollHeight || 1)

    const minimapHeight = minimap.clientHeight
    setViewportTop(scrollRatio * minimapHeight)
    setViewportHeight(Math.max(visibleRatio * minimapHeight, 10))
  }, [editAreaRef])

  useEffect(() => {
    if (!engine) return
    const unsub = engine.eventBus.on('content:change', updateContent)
    updateContent()
    return unsub
  }, [engine, updateContent])

  // Task 245: Wrap scroll handler with requestAnimationFrame throttling
  useEffect(() => {
    const area = editAreaRef?.current
    if (!area) return

    let rafId = null
    const throttledUpdateViewport = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        updateViewport()
        rafId = null
      })
    }

    area.addEventListener('scroll', throttledUpdateViewport)
    updateViewport()
    return () => {
      area.removeEventListener('scroll', throttledUpdateViewport)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [editAreaRef, updateViewport])

  // Click to scroll
  const handleClick = useCallback((e) => {
    if (!editAreaRef?.current || !minimapRef.current) return
    const minimap = minimapRef.current
    const area = editAreaRef.current

    const rect = minimap.getBoundingClientRect()
    const clickRatio = (e.clientY - rect.top) / rect.height
    const scrollTarget = clickRatio * area.scrollHeight - area.clientHeight / 2

    area.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' })
  }, [editAreaRef])

  return (
    <div className="rmx-minimap" ref={minimapRef} onClick={handleClick} aria-hidden="true">
      <div className="rmx-minimap-content" ref={contentRef}>
        {textContent}
      </div>
      <div
        className="rmx-minimap-viewport"
        style={{ top: viewportTop, height: viewportHeight }}
      />
    </div>
  )
})
