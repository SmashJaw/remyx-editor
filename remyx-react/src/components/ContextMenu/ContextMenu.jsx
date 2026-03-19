import React from 'react'

function ContextMenuInner({ contextMenu, onHide, onOpenModal }) {
  if (!contextMenu.visible) return null

  return (
    <div
      className="rmx-context-menu"
      style={{ top: contextMenu.y, left: contextMenu.x }}
    >
      {contextMenu.items.map((item, i) => {
        if (item.separator) {
          return <div key={i} className="rmx-context-menu-separator" />
        }
        return (
          <button
            key={i}
            className="rmx-context-menu-item"
            onClick={() => {
              if (typeof item.command === 'function') {
                try {
                  item.command()
                } catch (err) {
                  console.error('[Remyx] Context menu command failed:', err)
                }
              } else if (item.command === 'editLinkModal') {
                onOpenModal?.('link', {
                  href: item.data?.href,
                  text: item.data?.textContent,
                  target: item.data?.target,
                })
              }
              onHide()
            }}
            type="button"
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export const ContextMenu = React.memo(ContextMenuInner)
