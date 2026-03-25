import { createContext, useContext } from 'react'

/**
 * Context for sharing selection format state across the editor component tree.
 * Holds the formatState object from useSelection (bold, italic, link, etc.).
 * UI state (hasSelection, focusedImage, etc.) is kept separate in RemyxEditor.
 */
export const SelectionContext = createContext(null)

/**
 * Hook to consume the selection format state from context.
 * @returns {import('../hooks/useSelection.js').FormatState} The current format state
 */
export function useSelectionContext() {
  return useContext(SelectionContext)
}
