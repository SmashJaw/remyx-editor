// ---------------------------------------------------------------------------
// Per-item toolbar theming
// ---------------------------------------------------------------------------

/**
 * Maps friendly camelCase keys to CSS custom property names for per-item
 * toolbar button styling.  These variables are scoped to individual toolbar
 * elements via inline styles, so they only affect the element they're set on.
 */
export const TOOLBAR_ITEM_STYLE_KEYS = {
  color:            { var: '--rmx-tb-color',       description: 'Icon / text color' },
  background:       { var: '--rmx-tb-bg',          description: 'Default background' },
  hoverColor:       { var: '--rmx-tb-hover-color', description: 'Color on hover' },
  hoverBackground:  { var: '--rmx-tb-hover-bg',    description: 'Background on hover' },
  activeColor:      { var: '--rmx-tb-active-color', description: 'Color when active / pressed' },
  activeBackground: { var: '--rmx-tb-active-bg',   description: 'Background when active' },
  border:           { var: '--rmx-tb-border',      description: 'Border shorthand' },
  borderRadius:     { var: '--rmx-tb-radius',      description: 'Border radius' },
  size:             { var: '--rmx-tb-size',         description: 'Button width & height' },
  iconSize:         { var: '--rmx-tb-icon-size',   description: 'Icon size inside button' },
  padding:          { var: '--rmx-tb-padding',     description: 'Button padding' },
  opacity:          { var: '--rmx-tb-opacity',     description: 'Button opacity' },
}

const ITEM_KEY_TO_VAR = {}
for (const [key, meta] of Object.entries(TOOLBAR_ITEM_STYLE_KEYS)) {
  ITEM_KEY_TO_VAR[key] = meta.var
}

const SEPARATOR_KEY_TO_VAR = {
  color:  '--rmx-tb-sep-color',
  width:  '--rmx-tb-sep-width',
  height: '--rmx-tb-sep-height',
  margin: '--rmx-tb-sep-margin',
}

/**
 * Convert a per-item overrides object (friendly keys or raw CSS vars) into
 * an inline style object of CSS custom properties.
 *
 * @param {Object} overrides - e.g. { color: '#e11d48', borderRadius: '50%' }
 * @returns {Object|null} Style object or null if empty
 */
export function resolveToolbarItemStyle(overrides) {
  if (!overrides || typeof overrides !== 'object') return null
  const style = {}
  let hasKeys = false
  for (const [key, value] of Object.entries(overrides)) {
    if (key.startsWith('--rmx-')) {
      style[key] = value
      hasKeys = true
    } else if (ITEM_KEY_TO_VAR[key]) {
      style[ITEM_KEY_TO_VAR[key]] = value
      hasKeys = true
    }
  }
  return hasKeys ? style : null
}

/**
 * Convert separator overrides into an inline style object.
 *
 * @param {Object} overrides - e.g. { color: '#ccc', width: '2px' }
 * @returns {Object|null}
 */
export function resolveSeparatorStyle(overrides) {
  if (!overrides || typeof overrides !== 'object') return null
  const style = {}
  let hasKeys = false
  for (const [key, value] of Object.entries(overrides)) {
    if (key.startsWith('--rmx-')) {
      style[key] = value
      hasKeys = true
    } else if (SEPARATOR_KEY_TO_VAR[key]) {
      style[SEPARATOR_KEY_TO_VAR[key]] = value
      hasKeys = true
    }
  }
  return hasKeys ? style : null
}

/**
 * Create a toolbar item theme config.  The returned object can be passed
 * directly to the `toolbarItemTheme` prop on `<RemyxEditor>`.
 *
 * Keys are toolbar command names (e.g. `bold`, `italic`, `headings`) or the
 * special `_separator` key.  Values are objects of per-item style overrides.
 *
 * @param {Object} config - Map of command → style overrides
 * @returns {Object} Resolved config ready for the prop
 *
 * @example
 * const itemTheme = createToolbarItemTheme({
 *   bold:   { color: '#e11d48', activeColor: '#be123c', borderRadius: '50%' },
 *   italic: { background: '#f0f9ff', hoverBackground: '#e0f2fe' },
 *   _separator: { color: '#e2e8f0', width: '2px' },
 * })
 *
 * <RemyxEditor toolbarItemTheme={itemTheme} />
 */
export function createToolbarItemTheme(config) {
  if (!config || typeof config !== 'object') return {}
  const resolved = {}
  for (const [command, overrides] of Object.entries(config)) {
    if (command === '_separator') {
      resolved._separator = resolveSeparatorStyle(overrides)
    } else {
      const style = resolveToolbarItemStyle(overrides)
      if (style) resolved[command] = style
    }
  }
  return resolved
}
