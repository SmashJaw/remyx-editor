import React, { createContext } from 'react'

export const RemyxConfigContext = createContext(null)

/**
 * Provides a RemyxEditor configuration to all descendant <RemyxEditor /> components.
 *
 * @param {object} props
 * @param {object} props.config - Configuration object from defineConfig()
 * @param {React.ReactNode} props.children
 */
export function RemyxConfigProvider({ config, children }) {
  return (
    <RemyxConfigContext.Provider value={config}>
      {children}
    </RemyxConfigContext.Provider>
  )
}
