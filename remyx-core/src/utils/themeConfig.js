/**
 * All available theme variables with descriptions.
 * Keys are the camelCase names used with createTheme().
 * Values are objects with the CSS variable name and a description.
 */
export const THEME_VARIABLES = {
  // Color Palette
  bg:              { var: '--rmx-bg',              description: 'Editor background color' },
  text:            { var: '--rmx-text',            description: 'Primary text color' },
  textSecondary:   { var: '--rmx-text-secondary',  description: 'Secondary/muted text color' },
  border:          { var: '--rmx-border',          description: 'Border color' },
  borderSubtle:    { var: '--rmx-border-subtle',   description: 'Subtle/light border color' },

  // Toolbar
  toolbarBg:           { var: '--rmx-toolbar-bg',            description: 'Toolbar background color' },
  toolbarBorder:       { var: '--rmx-toolbar-border',        description: 'Toolbar border color' },
  toolbarButtonHover:  { var: '--rmx-toolbar-button-hover',  description: 'Toolbar button hover background' },
  toolbarButtonActive: { var: '--rmx-toolbar-button-active', description: 'Toolbar button active background' },
  toolbarIcon:         { var: '--rmx-toolbar-icon',          description: 'Toolbar icon color' },
  toolbarIconActive:   { var: '--rmx-toolbar-icon-active',   description: 'Toolbar icon active color' },

  // Accent / Primary
  primary:      { var: '--rmx-primary',       description: 'Primary accent color' },
  primaryHover: { var: '--rmx-primary-hover', description: 'Primary color on hover' },
  primaryLight: { var: '--rmx-primary-light', description: 'Light variant of primary (backgrounds)' },
  focusRing:    { var: '--rmx-focus-ring',    description: 'Focus ring outline color' },
  selection:    { var: '--rmx-selection',      description: 'Text selection highlight color' },

  // Feedback
  danger:      { var: '--rmx-danger',       description: 'Error/danger color' },
  dangerLight: { var: '--rmx-danger-light', description: 'Light variant of danger' },

  // UI Elements
  placeholder:   { var: '--rmx-placeholder',    description: 'Placeholder text color' },
  modalBg:       { var: '--rmx-modal-bg',       description: 'Modal background color' },
  modalOverlay:  { var: '--rmx-modal-overlay',  description: 'Modal overlay background' },
  statusbarBg:   { var: '--rmx-statusbar-bg',   description: 'Status bar background' },
  statusbarText: { var: '--rmx-statusbar-text', description: 'Status bar text color' },
  hoverBg:       { var: '--rmx-hover-bg',       description: 'Generic hover background' },

  // Shadows
  shadowSm:    { var: '--rmx-shadow-sm',    description: 'Small shadow' },
  shadowMd:    { var: '--rmx-shadow-md',    description: 'Medium shadow' },
  shadowLg:    { var: '--rmx-shadow-lg',    description: 'Large shadow' },
  shadowFloat: { var: '--rmx-shadow-float', description: 'Floating element shadow' },

  // Typography
  fontFamily:        { var: '--rmx-font-family',         description: 'UI font stack' },
  fontSize:          { var: '--rmx-font-size',           description: 'UI font size' },
  contentFontSize:   { var: '--rmx-content-font-size',   description: 'Content area font size' },
  contentLineHeight: { var: '--rmx-content-line-height', description: 'Content area line height' },

  // Spacing & Shape
  radius:      { var: '--rmx-radius',      description: 'Standard border radius' },
  radiusSm:    { var: '--rmx-radius-sm',   description: 'Small border radius' },
  radiusInner: { var: '--rmx-radius-inner', description: 'Inner element border radius' },
  spacingXs:   { var: '--rmx-spacing-xs',  description: 'Extra small spacing (4px)' },
  spacingSm:   { var: '--rmx-spacing-sm',  description: 'Small spacing (8px)' },
  spacingMd:   { var: '--rmx-spacing-md',  description: 'Medium spacing (12px)' },

  // Transitions
  transitionFast:   { var: '--rmx-transition-fast',   description: 'Fast transition duration' },
  transitionNormal: { var: '--rmx-transition-normal', description: 'Normal transition duration' },
}

// Build a quick lookup: camelCase key → CSS variable name
const KEY_TO_VAR = {}
for (const [key, meta] of Object.entries(THEME_VARIABLES)) {
  KEY_TO_VAR[key] = meta.var
}

/**
 * Create a theme object from friendly camelCase overrides.
 * The returned object can be passed directly to the `customTheme` prop.
 *
 * Accepts either camelCase keys (e.g. `bg`, `primary`, `toolbarBg`) or
 * raw CSS variable names (e.g. `--rmx-bg`). Both formats can be mixed.
 *
 * @param {Object} overrides - Theme variable overrides
 * @returns {Object} CSS custom property object for use as `customTheme`
 *
 * @example
 * const myTheme = createTheme({
 *   bg: '#1a1a2e',
 *   primary: '#e94560',
 *   toolbarBg: '#16213e',
 *   radius: '12px',
 * })
 *
 * <RemyxEditor customTheme={myTheme} />
 */
export function createTheme(overrides) {
  const result = {}
  for (const [key, value] of Object.entries(overrides)) {
    if (key.startsWith('--rmx-')) {
      // Raw CSS variable — pass through
      result[key] = value
    } else if (KEY_TO_VAR[key]) {
      // camelCase key → CSS variable
      result[KEY_TO_VAR[key]] = value
    } else {
      // Unknown key — try as a CSS variable anyway
      result[`--rmx-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value
    }
  }
  return result
}
