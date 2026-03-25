import { ALLOWED_TAGS, ALLOWED_STYLES } from '../constants/schema.js'
import { TOOLBAR_PRESETS } from '../utils/toolbarConfig.js'
import { DEFAULT_TOOLBAR, DEFAULT_MENU_BAR, DEFAULT_FONTS, DEFAULT_FONT_SIZES, DEFAULT_COLORS, HEADING_OPTIONS } from '../constants/defaults.js'
import { BUTTON_COMMANDS, TOOLTIP_MAP, SHORTCUT_MAP, MODAL_COMMANDS } from '../constants/commands.js'
import { DEFAULT_KEYBINDINGS } from '../constants/keybindings.js'

/**
 * A memory-efficient shared resource singleton.
 *
 * When running 10+ EditorEngine instances on a single page, each engine
 * would normally allocate its own copy of the sanitizer schema, toolbar
 * presets, icon map, default config objects, and keybinding tables.
 * SharedResources provides a single frozen copy of these large, immutable
 * data structures so every engine can reference the same objects in memory.
 *
 * The singleton is lazily initialized on first access and the frozen data
 * is reused for the lifetime of the page.
 *
 * @example
 * import { SharedResources } from '@remyxjs/core';
 *
 * // Access shared sanitizer schema (same object for all editors)
 * const tags = SharedResources.sanitizerSchema.allowedTags;
 *
 * // Access shared toolbar presets
 * const fullToolbar = SharedResources.toolbarPresets.full;
 *
 * // Register a custom icon once, available to all editors
 * SharedResources.registerIcon('myIcon', '<svg>...</svg>');
 */
class SharedResourcesImpl {
  constructor() {
    /** @private */
    this._initialized = false
    /** @private */
    this._sanitizerSchema = null
    /** @private */
    this._toolbarPresets = null
    /** @private */
    this._defaults = null
    /** @private */
    this._keybindings = null
    /** @private */
    this._commands = null
    /** @private @type {Map<string, string>} */
    this._icons = new Map()
  }

  /** @private */
  _ensureInit() {
    if (this._initialized) return
    this._initialized = true

    // Freeze the sanitizer schema so all engines share the same immutable copy
    this._sanitizerSchema = Object.freeze({
      allowedTags: Object.freeze(
        Object.fromEntries(
          Object.entries(ALLOWED_TAGS).map(([tag, attrs]) => [tag, Object.freeze([...attrs])])
        )
      ),
      allowedStyles: Object.freeze([...ALLOWED_STYLES]),
    })

    // Freeze toolbar presets (deep-freeze the nested arrays)
    this._toolbarPresets = Object.freeze(
      Object.fromEntries(
        Object.entries(TOOLBAR_PRESETS).map(([name, groups]) => [
          name,
          Object.freeze(groups.map(g => Object.freeze([...g]))),
        ])
      )
    )

    // Freeze default configuration objects
    this._defaults = Object.freeze({
      toolbar: Object.freeze(DEFAULT_TOOLBAR.map(g => Object.freeze([...g]))),
      menuBar: Object.freeze(DEFAULT_MENU_BAR),
      fonts: Object.freeze([...DEFAULT_FONTS]),
      fontSizes: Object.freeze([...DEFAULT_FONT_SIZES]),
      colors: Object.freeze([...DEFAULT_COLORS]),
      headingOptions: Object.freeze([...HEADING_OPTIONS]),
    })

    // Freeze keybinding table
    this._keybindings = Object.freeze({ ...DEFAULT_KEYBINDINGS })

    // Freeze command metadata maps
    this._commands = Object.freeze({
      buttons: Object.freeze({ ...BUTTON_COMMANDS }),
      tooltips: Object.freeze({ ...TOOLTIP_MAP }),
      shortcuts: Object.freeze({ ...SHORTCUT_MAP }),
      modals: Object.freeze({ ...MODAL_COMMANDS }),
    })
  }

  // ── Accessors ──────────────────────────────────────────────────────

  /**
   * Shared, frozen sanitizer schema.
   * @returns {{ allowedTags: Object, allowedStyles: string[] }}
   */
  get sanitizerSchema() {
    this._ensureInit()
    return this._sanitizerSchema
  }

  /**
   * Shared, frozen toolbar presets (full, standard, minimal, bare).
   * @returns {Object}
   */
  get toolbarPresets() {
    this._ensureInit()
    return this._toolbarPresets
  }

  /**
   * Shared, frozen default configuration values.
   * @returns {{ toolbar, menuBar, fonts, fontSizes, colors, headingOptions }}
   */
  get defaults() {
    this._ensureInit()
    return this._defaults
  }

  /**
   * Shared, frozen keybinding table.
   * @returns {Object}
   */
  get keybindings() {
    this._ensureInit()
    return this._keybindings
  }

  /**
   * Shared, frozen command metadata maps.
   * @returns {{ buttons, tooltips, shortcuts, modals }}
   */
  get commands() {
    this._ensureInit()
    return this._commands
  }

  // ── Icon registry ──────────────────────────────────────────────────

  /**
   * Register a shared icon (SVG string or URL) by name.
   * Once registered, any editor on the page can use it via toolbar config.
   *
   * @param {string} name - Icon identifier (e.g. 'myCustomAction')
   * @param {string} svgOrUrl - SVG markup string or URL to icon asset
   */
  registerIcon(name, svgOrUrl) {
    this._icons.set(name, svgOrUrl)
  }

  /**
   * Unregister a previously registered icon.
   * @param {string} name - Icon identifier to remove
   */
  unregisterIcon(name) {
    this._icons.delete(name)
  }

  /**
   * Retrieve a registered icon by name.
   * @param {string} name - Icon identifier
   * @returns {string | undefined} SVG markup or URL, or undefined if not registered
   */
  getIcon(name) {
    return this._icons.get(name)
  }

  /**
   * Get all registered icon names.
   * @returns {string[]}
   */
  getIconNames() {
    return [...this._icons.keys()]
  }

  /**
   * Total approximate memory savings info.
   * @returns {{ registeredIcons: number, frozenSchemas: boolean }}
   */
  get stats() {
    this._ensureInit()
    return {
      registeredIcons: this._icons.size,
      frozenSchemas: true,
    }
  }
}

/**
 * Singleton shared resource pool.
 * Import this directly — all editors on the page share the same instance.
 *
 * @type {SharedResourcesImpl}
 */
export const SharedResources = new SharedResourcesImpl()
