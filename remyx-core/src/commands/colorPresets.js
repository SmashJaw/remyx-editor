/**
 * Color palette presets — save and load named color palettes in localStorage.
 */

const STORAGE_KEY = 'rmx-color-presets'

/**
 * Get all saved color presets from localStorage.
 * @returns {{ name: string, colors: string[] }[]}
 */
export function loadColorPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Save a named color preset to localStorage.
 * @param {string} name
 * @param {string[]} colors
 */
export function saveColorPreset(name, colors) {
  if (!name || !Array.isArray(colors)) return
  try {
    const presets = loadColorPresets().filter(p => p.name !== name)
    presets.push({ name, colors })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  } catch {
    // localStorage unavailable
  }
}

/**
 * Delete a named color preset from localStorage.
 * @param {string} name
 */
export function deleteColorPreset(name) {
  try {
    const presets = loadColorPresets().filter(p => p.name !== name)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  } catch {
    // noop
  }
}

export function registerColorPresetCommands(engine) {
  engine.commands.register('saveColorPreset', {
    execute(_eng, name, colors) {
      saveColorPreset(name, colors)
      engine.eventBus.emit('colorPresets:change', { presets: loadColorPresets() })
    },
    meta: { icon: 'colorPreset', tooltip: 'Save Color Preset' },
  })

  engine.commands.register('loadColorPresets', {
    execute() {
      return loadColorPresets()
    },
    meta: { icon: 'colorPreset', tooltip: 'Load Color Presets' },
  })

  engine.commands.register('deleteColorPreset', {
    execute(_eng, name) {
      deleteColorPreset(name)
      engine.eventBus.emit('colorPresets:change', { presets: loadColorPresets() })
    },
    meta: { icon: 'colorPreset', tooltip: 'Delete Color Preset' },
  })
}
