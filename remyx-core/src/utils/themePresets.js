import { createTheme } from './themeConfig.js'

/**
 * Built-in theme presets.
 *
 * **Recommended:** Use the `theme` prop directly instead of `customTheme`:
 * ```jsx
 * <RemyxEditor theme="ocean" />
 * <RemyxEditor theme="forest" />
 * ```
 *
 * These presets are also available as CSS custom property objects for use with
 * `customTheme` when you need to override individual variables on top of a theme:
 * ```jsx
 * <RemyxEditor theme="ocean" customTheme={createTheme({ primary: '#ff0000' })} />
 * ```
 */
export const THEME_PRESETS = {
  /** Deep blue ocean palette */
  ocean: createTheme({
    bg: '#0f172a',
    text: '#e2e8f0',
    textSecondary: '#94a3b8',
    border: '#1e3a5f',
    borderSubtle: '#1e3a5f',
    toolbarBg: '#0c1426',
    toolbarBorder: '#1e3a5f',
    toolbarButtonHover: '#1e3a5f',
    toolbarButtonActive: '#1e4976',
    toolbarIcon: '#94a3b8',
    toolbarIconActive: '#38bdf8',
    primary: '#0ea5e9',
    primaryHover: '#0284c7',
    primaryLight: 'rgba(14, 165, 233, 0.15)',
    focusRing: '#0ea5e9',
    selection: '#0c4a6e',
    placeholder: '#475569',
    modalBg: '#0c1426',
    modalOverlay: 'rgba(0, 0, 0, 0.6)',
    statusbarBg: '#0c1426',
    statusbarText: '#64748b',
  }),

  /** Green earth-tone forest palette */
  forest: createTheme({
    bg: '#14201a',
    text: '#d1e7dd',
    textSecondary: '#8fbc8f',
    border: '#2d4a3e',
    borderSubtle: '#2d4a3e',
    toolbarBg: '#0f1a14',
    toolbarBorder: '#2d4a3e',
    toolbarButtonHover: '#2d4a3e',
    toolbarButtonActive: '#1a5c3a',
    toolbarIcon: '#8fbc8f',
    toolbarIconActive: '#4ade80',
    primary: '#22c55e',
    primaryHover: '#16a34a',
    primaryLight: 'rgba(34, 197, 94, 0.15)',
    focusRing: '#22c55e',
    selection: '#14532d',
    placeholder: '#4a7c5f',
    modalBg: '#0f1a14',
    modalOverlay: 'rgba(0, 0, 0, 0.6)',
    statusbarBg: '#0f1a14',
    statusbarText: '#4a7c5f',
  }),

  /** Warm orange/amber sunset palette */
  sunset: createTheme({
    bg: '#1c1210',
    text: '#fde8d0',
    textSecondary: '#d4a574',
    border: '#5c3a28',
    borderSubtle: '#5c3a28',
    toolbarBg: '#181010',
    toolbarBorder: '#5c3a28',
    toolbarButtonHover: '#5c3a28',
    toolbarButtonActive: '#7c4a2a',
    toolbarIcon: '#d4a574',
    toolbarIconActive: '#fb923c',
    primary: '#f97316',
    primaryHover: '#ea580c',
    primaryLight: 'rgba(249, 115, 22, 0.15)',
    focusRing: '#f97316',
    selection: '#7c2d12',
    placeholder: '#8b6f47',
    modalBg: '#181010',
    modalOverlay: 'rgba(0, 0, 0, 0.6)',
    statusbarBg: '#181010',
    statusbarText: '#8b6f47',
  }),

  /** Soft pink/rose palette */
  rose: createTheme({
    bg: '#1c1018',
    text: '#fde2ee',
    textSecondary: '#d4809f',
    border: '#5c2848',
    borderSubtle: '#5c2848',
    toolbarBg: '#18101a',
    toolbarBorder: '#5c2848',
    toolbarButtonHover: '#5c2848',
    toolbarButtonActive: '#7c2858',
    toolbarIcon: '#d4809f',
    toolbarIconActive: '#fb7185',
    primary: '#f43f5e',
    primaryHover: '#e11d48',
    primaryLight: 'rgba(244, 63, 94, 0.15)',
    focusRing: '#f43f5e',
    selection: '#881337',
    placeholder: '#8b4766',
    modalBg: '#18101a',
    modalOverlay: 'rgba(0, 0, 0, 0.6)',
    statusbarBg: '#18101a',
    statusbarText: '#8b4766',
  }),
}
