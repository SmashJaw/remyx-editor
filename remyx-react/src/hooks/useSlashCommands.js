import { useState, useEffect, useCallback, useRef } from 'react'
import { SLASH_COMMAND_ITEMS, filterSlashItems } from '@remyx/core'

/**
 * Hook that manages slash command palette state.
 * Listens to engine slash:* events and provides state for the UI component.
 *
 * @param {import('@remyx/core').EditorEngine} engine
 * @param {import('react').RefObject<HTMLElement>} editorRootRef
 * @param {{ items?: import('@remyx/core').SlashCommandItem[], onOpenModal?: Function }} options
 */
export function useSlashCommands(engine, editorRootRef, options = {}) {
  const { items: customItems, onOpenModal } = options
  const allItems = customItems || SLASH_COMMAND_ITEMS

  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const filteredItemsRef = useRef(allItems)

  const filteredItems = filterSlashItems(allItems, query)

  // Sync ref in effect to avoid updating ref during render
  useEffect(() => {
    filteredItemsRef.current = filteredItems
  }, [filteredItems])

  // Reset selected index when filtered items change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Listen for slash:open from engine
  useEffect(() => {
    if (!engine) return

    const unsubOpen = engine.eventBus.on('slash:open', ({ rect }) => {
      const editorRect = editorRootRef.current?.querySelector('.rmx-editor-body')?.getBoundingClientRect()
      if (!editorRect || !rect) return

      const top = rect.bottom - editorRect.top + 4
      let left = rect.left - editorRect.left

      // Clamp left to prevent overflow
      if (left + 340 > editorRect.width) {
        left = Math.max(4, editorRect.width - 344)
      }
      if (left < 4) left = 4

      setPosition({ top, left })
      setQuery('')
      setSelectedIndex(0)
      setVisible(true)
    })

    const unsubQuery = engine.eventBus.on('slash:query', ({ query: q }) => {
      setQuery(q)
    })

    const unsubClose = engine.eventBus.on('slash:close', () => {
      setVisible(false)
    })

    const unsubKeydown = engine.eventBus.on('slash:keydown', ({ key }) => {
      if (key === 'ArrowDown') {
        setSelectedIndex(i => {
          const len = filteredItemsRef.current.length
          return len === 0 ? 0 : (i + 1) % len
        })
      } else if (key === 'ArrowUp') {
        setSelectedIndex(i => {
          const len = filteredItemsRef.current.length
          return len === 0 ? 0 : (i - 1 + len) % len
        })
      } else if (key === 'Enter' || key === 'Tab') {
        const items = filteredItemsRef.current
        setSelectedIndex(currentIdx => {
          if (items.length > 0 && currentIdx < items.length) {
            const item = items[currentIdx]
            engine.eventBus.emit('slash:execute', { item, openModal: onOpenModal })
            setVisible(false)
          }
          return currentIdx
        })
      }
    })

    return () => {
      unsubOpen()
      unsubQuery()
      unsubClose()
      unsubKeydown()
    }
  }, [engine, editorRootRef, onOpenModal])

  const selectItem = useCallback((item) => {
    if (!engine) return
    engine.eventBus.emit('slash:execute', { item, openModal: onOpenModal })
    setVisible(false)
  }, [engine, onOpenModal])

  return {
    visible,
    position,
    query,
    filteredItems,
    selectedIndex,
    setSelectedIndex,
    selectItem,
  }
}
