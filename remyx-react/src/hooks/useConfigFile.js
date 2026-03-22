import { useMemo } from 'react'
import { DEFAULT_TOOLBAR, DEFAULT_MENU_BAR } from '@remyxjs/core'
import { resolvePluginsFromConfig } from '../../../../remyxjs/plugins/index.js'

// Auto-discover and load all theme CSS files from remyxjs/themes/
import.meta.glob('../../../../remyxjs/themes/*.css', { eager: true })

/**
 * Load all config JSON files from remyxjs/config/ via Vite's import.meta.glob.
 */
const configModules = import.meta.glob('../../../../remyxjs/config/*.json', { eager: true })

const configCache = new Map()
for (const [path, module] of Object.entries(configModules)) {
  const filename = path.split('/').pop().replace('.json', '')
  configCache.set(filename, module.default || module)
}

const DEFAULT_HEIGHT = 300

/**
 * Hook that loads an editor config by name from remyxjs/config/<name>.json
 * and resolves its plugins from remyxjs/plugins/.
 *
 * @param {string} configName - Config file name (without extension)
 * @param {object} props - React-level props (value, onChange, onReady, etc.)
 * @returns {object} Fully resolved config ready for the editor engine
 */
export function useConfigFile(configName, props = {}) {
  const rawConfig = configCache.get(configName)

  const plugins = useMemo(() => {
    if (!rawConfig?.plugins) return []
    return resolvePluginsFromConfig(rawConfig.plugins)
  }, [rawConfig])

  const menuBarConfig = useMemo(() => {
    if (!rawConfig) return null
    const mb = rawConfig.menuBar
    if (mb === true) return DEFAULT_MENU_BAR
    if (Array.isArray(mb)) return mb
    return null
  }, [rawConfig])

  const effectiveToolbar = useMemo(() => {
    if (!rawConfig) return DEFAULT_TOOLBAR
    return rawConfig.toolbar || DEFAULT_TOOLBAR
  }, [rawConfig])

  return useMemo(() => {
    if (!rawConfig) {
      console.warn(`[remyxjs] Config "${configName}" not found in remyxjs/config/`)
      return null
    }

    return {
      theme: rawConfig.theme || 'light',
      placeholder: rawConfig.placeholder || '',
      height: rawConfig.height || DEFAULT_HEIGHT,
      minHeight: rawConfig.minHeight,
      maxHeight: rawConfig.maxHeight,
      readOnly: rawConfig.readOnly || false,
      outputFormat: rawConfig.outputFormat || 'html',
      toolbar: effectiveToolbar,
      toolbarWrap: rawConfig.toolbarOverflow ? false : (rawConfig.toolbarWrap ?? true),
      menuBarConfig,
      statusBar: rawConfig.statusBar ?? 'bottom',
      showFloatingToolbar: rawConfig.floatingToolbar ?? true,
      showContextMenu: rawConfig.contextMenu ?? true,
      showCommandPalette: rawConfig.commandPalette ?? true,
      autosaveConfig: rawConfig.autosave
        ? (rawConfig.autosave === true ? { enabled: true } : { enabled: true, ...rawConfig.autosave })
        : { enabled: false },
      showBreadcrumb: rawConfig.breadcrumb || false,
      showMinimap: rawConfig.minimap || false,
      splitViewFormat: rawConfig.splitViewFormat,
      fonts: rawConfig.fonts,
      googleFonts: rawConfig.googleFonts,
      customTheme: rawConfig.customTheme,
      toolbarItemTheme: rawConfig.toolbarItemTheme,
      sanitize: rawConfig.sanitize,
      shortcuts: rawConfig.shortcuts,
      baseHeadingLevel: rawConfig.baseHeadingLevel,
      uploadHandler: rawConfig.uploadHandler,
      plugins,
      value: props.value,
      defaultValue: props.defaultValue,
      onChange: props.onChange,
      onReady: props.onReady,
      onError: props.onError,
      onFocus: props.onFocus,
      onBlur: props.onBlur,
      className: props.className || '',
      style: props.style,
      errorFallback: props.errorFallback,
    }
  }, [rawConfig, configName, plugins, effectiveToolbar, menuBarConfig,
      props.value, props.defaultValue, props.onChange, props.onReady,
      props.onError, props.onFocus, props.onBlur, props.className,
      props.style, props.errorFallback])
}
