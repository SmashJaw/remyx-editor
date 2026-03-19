import React, { createContext, useMemo } from 'react'

export const RemyxConfigContext = createContext(null)

/**
 * Provides a RemyxEditor configuration to all descendant <RemyxEditor /> components.
 *
 * @param {object} props
 * @param {object} props.config - Configuration object from defineConfig()
 * @param {React.ReactNode} props.children
 */
export function RemyxConfigProvider({ config, children }) {
  const value = useMemo(() => config, [config])
  return (
    <RemyxConfigContext.Provider value={value}>
      {children}
    </RemyxConfigContext.Provider>
  )
}
