import React, { createContext, useContext, useMemo } from 'react'

const RemyxConfigContext = createContext(null)

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

/**
 * Resolves the merged configuration for a specific editor instance.
 * Priority: component props > named editor config > default config
 *
 * @param {string|undefined} configName - Named editor config to use
 * @returns {object|null} Resolved default + named config (without component props merged)
 */
export function useRemyxConfig(configName) {
  const config = useContext(RemyxConfigContext)

  return useMemo(() => {
    if (!config) return null

    // Extract default config (everything except `editors`)
    const { editors, ...defaults } = config

    // If a named config is requested, merge it on top of defaults
    if (configName && editors?.[configName]) {
      return { ...defaults, ...editors[configName] }
    }

    return defaults
  }, [config, configName])
}
