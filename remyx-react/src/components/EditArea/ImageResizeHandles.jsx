import { useState, useCallback, useEffect } from 'react'

export function ImageResizeHandles({ image, engine, editorRect }) {
  const [resizing, setResizing] = useState(false)
  const [startPos, setStartPos] = useState(null)
  const [startSize, setStartSize] = useState(null)

  if (!image || !editorRect) return null

  const imgRect = image.getBoundingClientRect()
  const top = imgRect.top - editorRect.top
  const left = imgRect.left - editorRect.left

  const handlePointerDown = useCallback((e, corner) => {
    e.preventDefault()
    e.stopPropagation()
    // Capture pointer for reliable tracking across touch and mouse
    e.target.setPointerCapture(e.pointerId)
    setResizing(true)
    setStartPos({ x: e.clientX, y: e.clientY })
    setStartSize({ width: image.offsetWidth, height: image.offsetHeight })
  }, [image])

  useEffect(() => {
    if (!resizing) return

    const handlePointerMove = (e) => {
      if (!startPos || !startSize) return
      const dx = e.clientX - startPos.x
      const aspectRatio = startSize.width > 0 ? startSize.height / startSize.width : 1
      const newWidth = Math.max(50, startSize.width + dx)
      const newHeight = newWidth * aspectRatio

      image.style.width = `${newWidth}px`
      image.style.height = `${newHeight}px`
    }

    const handlePointerUp = () => {
      setResizing(false)
      engine?.eventBus.emit('content:change')
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }
  }, [resizing, startPos, startSize, image, engine])

  return (
    <div
      className="rmx-image-handles"
      style={{
        position: 'absolute',
        top,
        left,
        width: imgRect.width,
        height: imgRect.height,
        pointerEvents: 'none',
      }}
    >
      <div className="rmx-image-handle rmx-handle-border" />
      {['nw', 'ne', 'sw', 'se'].map((corner) => (
        <div
          key={corner}
          className={`rmx-image-handle rmx-handle-${corner}`}
          style={{ pointerEvents: 'all', touchAction: 'none' }}
          onPointerDown={(e) => handlePointerDown(e, corner)}
        />
      ))}
    </div>
  )
}
