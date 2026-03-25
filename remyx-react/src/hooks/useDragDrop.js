import { useState, useEffect, useCallback } from 'react'

/**
 * Hook that tracks drag-and-drop state from the editor engine,
 * providing reactive state for the React overlay components.
 *
 * @param {Object} engine - The EditorEngine instance
 * @returns {{ isExternalDrag: boolean, dragFileTypes: string[] }}
 */
export function useDragDrop(engine) {
  const [isExternalDrag, setIsExternalDrag] = useState(false)
  const [dragFileTypes, setDragFileTypes] = useState([])

  useEffect(() => {
    if (!engine) return

    const onDragEnter = ({ isExternal, types }) => {
      if (isExternal) {
        setIsExternalDrag(true)
        setDragFileTypes(types || [])
      }
    }

    const onDragLeave = () => {
      setIsExternalDrag(false)
      setDragFileTypes([])
    }

    const onDragEnd = () => {
      setIsExternalDrag(false)
      setDragFileTypes([])
    }

    const onDrop = () => {
      setIsExternalDrag(false)
      setDragFileTypes([])
    }

    const unsubs = [
      engine.eventBus.on('drag:enter', onDragEnter),
      engine.eventBus.on('drag:leave', onDragLeave),
      engine.eventBus.on('drag:end', onDragEnd),
      engine.eventBus.on('drop', onDrop),
    ]

    return () => unsubs.forEach(unsub => unsub())
  }, [engine])

  return { isExternalDrag, dragFileTypes }
}
