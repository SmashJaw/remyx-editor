import { useMemo } from 'react'
import { useRemyxConfig } from './useRemyxConfig.js'
import { DEFAULT_TOOLBAR, DEFAULT_FONTS, DEFAULT_MENU_BAR } from '@remyxjs/core'
import { collectMenuBarCommands } from '../components/MenuBar/MenuBar.jsx'

/** Default editor content area height in pixels */
export const DEFAULT_EDITOR_HEIGHT = 300

/**
 * Resolves editor configuration from props, context provider, and defaults.
 * Handles config merging, menu bar resolution, and toolbar auto-deduplication.
 */
export function useResolvedConfig(props) {
  const { config: configName, ...componentProps } = props

  // Resolve config from provider context (if any)
  const resolvedConfig = useRemyxConfig(configName)

  // Merge: resolved config as defaults, component props override where explicitly provided
  const merged = resolvedConfig
    ? Object.keys({ ...resolvedConfig, ...componentProps }).reduce((acc, key) => {
        acc[key] = componentProps[key] !== undefined ? componentProps[key] : resolvedConfig[key]
        return acc
      }, {})
    : componentProps

  // Destructure with defaults from the merged config
  const {
    attachTo,
    value,
    defaultValue,
    onChange,
    toolbar,
    menuBar: menuBarProp,
    theme = 'light',
    placeholder = '',
    height = DEFAULT_EDITOR_HEIGHT,
    minHeight,
    maxHeight,
    readOnly = false,
    plugins,
    onReady,
    onFocus,
    onBlur,
    className = '',
    style,
    uploadHandler,
    outputFormat = 'html',
    floatingToolbar: showFloatingToolbar = true,
    contextMenu: showContextMenu = true,
    fonts,
    googleFonts,
    statusBar = 'bottom',
    customTheme,
    toolbarItemTheme,
    sanitize,
    shortcuts,
    baseHeadingLevel,
    onError,
    errorFallback,
    commandPalette: showCommandPalette = true,
    autosave: autosaveProp = false,
  } = merged

  // Normalize autosave config: true → { enabled: true }, false → { enabled: false }
  const autosaveConfig = autosaveProp === true
    ? { enabled: true }
    : autosaveProp === false
      ? { enabled: false }
      : { enabled: true, ...autosaveProp }

  // Resolve menu bar config
  const menuBarConfig = menuBarProp === true ? DEFAULT_MENU_BAR
    : Array.isArray(menuBarProp) ? menuBarProp
    : null

  // Auto-deduplicate toolbar: remove items that are in the menu bar
  // Only when user didn't explicitly pass a toolbar prop
  const effectiveToolbar = useMemo(() => {
    if (!menuBarConfig || props.toolbar !== undefined) return toolbar
    // Use the toolbar from config or fall back to DEFAULT_TOOLBAR
    const baseToolbar = toolbar || DEFAULT_TOOLBAR
    const menuCommands = collectMenuBarCommands(menuBarConfig)
    return baseToolbar
      .map(group => group.filter(item => typeof item !== 'string' || !menuCommands.has(item)))
      .filter(group => group.length > 0)
  }, [menuBarConfig, toolbar, props.toolbar])

  return useMemo(() => ({
    attachTo,
    value,
    defaultValue,
    onChange,
    toolbar,
    theme,
    placeholder,
    height,
    minHeight,
    maxHeight,
    readOnly,
    plugins,
    onReady,
    onFocus,
    onBlur,
    className,
    style,
    uploadHandler,
    outputFormat,
    showFloatingToolbar,
    showContextMenu,
    fonts,
    googleFonts,
    statusBar,
    customTheme,
    toolbarItemTheme,
    sanitize,
    shortcuts,
    baseHeadingLevel,
    menuBarConfig,
    effectiveToolbar,
    onError,
    errorFallback,
    showCommandPalette,
    autosaveConfig,
  }), [
    attachTo, value, defaultValue, onChange, toolbar, theme, placeholder,
    height, minHeight, maxHeight, readOnly, plugins, onReady, onFocus, onBlur,
    className, style, uploadHandler, outputFormat, showFloatingToolbar,
    showContextMenu, fonts, googleFonts, statusBar, customTheme, toolbarItemTheme,
    sanitize, shortcuts, baseHeadingLevel, menuBarConfig, effectiveToolbar,
    onError, errorFallback, showCommandPalette, autosaveConfig,
  ])
}
