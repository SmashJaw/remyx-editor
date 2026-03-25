import React, { useRef, useEffect } from 'react'

/**
 * Floating slash command palette — appears at the caret when user types "/".
 * Renders a dropdown with filtered command items grouped by category.
 */
function SlashCommandPaletteInner({
  visible,
  position,
  filteredItems,
  selectedIndex,
  setSelectedIndex,
  selectItem,
}) {
  const listRef = useRef(null)

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const active = listRef.current.querySelector('.rmx-slash-palette-item.rmx-active')
    if (active) {
      active.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!visible || !filteredItems) return null

  // Group items by category
  const groups = []
  let lastCategory = null
  for (let i = 0; i < filteredItems.length; i++) {
    const item = filteredItems[i]
    if (item.category !== lastCategory) {
      groups.push({ category: item.category, items: [] })
      lastCategory = item.category
    }
    groups[groups.length - 1].items.push({ item, index: i })
  }

  return (
    <div
      ref={listRef}
      className="rmx-slash-palette"
      style={{ top: position.top, left: position.left }}
      role="listbox"
      aria-label="Slash commands"
      onMouseDown={(e) => e.preventDefault()}
    >
      {filteredItems.length === 0 ? (
        <div className="rmx-slash-palette-empty">No matching commands</div>
      ) : (
        groups.map((group) => (
          <div key={group.category}>
            <div className="rmx-slash-palette-category">{group.category}</div>
            {group.items.map(({ item, index }) => (
              <div
                key={item.id}
                className={`rmx-slash-palette-item${index === selectedIndex ? ' rmx-active' : ''}`}
                role="option"
                aria-selected={index === selectedIndex}
                id={`rmx-slash-item-${item.id}`}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => selectItem(item)}
              >
                <div className="rmx-slash-palette-icon">{item.icon}</div>
                <div className="rmx-slash-palette-text">
                  <div className="rmx-slash-palette-label">{item.label}</div>
                  <div className="rmx-slash-palette-desc">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}

export const SlashCommandPalette = React.memo(SlashCommandPaletteInner)
