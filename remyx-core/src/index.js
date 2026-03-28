// Task 265: For better tree-shaking, import plugins directly from their
// source paths (e.g., '@remyxjs/core/src/plugins/builtins/WordCountPlugin.js')
// rather than from this barrel export when bundle size is critical.

// Core engine
export { EditorEngine } from './core/EditorEngine.js'
export { EventBus } from './core/EventBus.js'
export { CommandRegistry } from './core/CommandRegistry.js'
export { Selection } from './core/Selection.js'
export { History } from './core/History.js'
export { KeyboardManager } from './core/KeyboardManager.js'
export { Sanitizer } from './core/Sanitizer.js'
export { Clipboard } from './core/Clipboard.js'
export { DragDrop } from './core/DragDrop.js'
export { EditorBus } from './core/EditorBus.js'
export { SharedResources } from './core/SharedResources.js'

// Commands (register functions)
export { registerFormattingCommands } from './commands/formatting.js'
export { registerHeadingCommands } from './commands/headings.js'
export { registerAlignmentCommands } from './commands/alignment.js'
export { registerListCommands } from './commands/lists.js'
export { registerLinkCommands } from './commands/links.js'
export { registerImageCommands } from './commands/images.js'
export { registerTableCommands } from './commands/tables.js'
export { registerBlockCommands } from './commands/blocks.js'
export { registerBlockConvertCommands } from './commands/blockConvert.js'
export { registerFontCommands } from './commands/fontControls.js'
export { registerMediaCommands } from './commands/media.js'
export { registerFindReplaceCommands } from './commands/findReplace.js'
export { registerSourceModeCommands } from './commands/sourceMode.js'
export { registerFullscreenCommands } from './commands/fullscreen.js'
export { registerDistractionFreeCommands } from './commands/distractionFree.js'
export { registerSplitViewCommands } from './commands/splitView.js'
export { registerColorPresetCommands, saveColorPreset, loadColorPresets, deleteColorPreset } from './commands/colorPresets.js'
export { registerMarkdownToggleCommands } from './commands/markdownToggle.js'
export { registerAttachmentCommands } from './commands/attachments.js'
export { registerImportDocumentCommands } from './commands/importDocument.js'
export { SLASH_COMMAND_ITEMS, filterSlashItems, getRecentCommands, recordRecentCommand, clearRecentCommands, registerCommandItems, unregisterCommandItem, getCustomCommandItems } from './commands/slashCommands.js'

// Autosave
export { AutosaveManager } from './core/AutosaveManager.js'
export { LocalStorageProvider, SessionStorageProvider, FileSystemProvider, CloudProvider, CustomProvider, createStorageProvider } from './autosave/providers.js'

// Plugins
export { PluginManager, registerPluginInRegistry, unregisterPluginFromRegistry, listRegisteredPlugins, searchPluginRegistry } from './plugins/PluginManager.js'
export { createPlugin } from './plugins/createPlugin.js'
export { WordCountPlugin } from './plugins/builtins/WordCountPlugin.js'
export { AutolinkPlugin } from './plugins/builtins/AutolinkPlugin.js'
export { PlaceholderPlugin } from './plugins/builtins/PlaceholderPlugin.js'
export { evaluateTableFormulas } from './commands/tables.js'

// Workers
export { WorkerPool } from './workers/WorkerPool.js'

// Virtualized rendering
export { VirtualScroller } from './core/VirtualScroller.js'

// Utilities
export { htmlToMarkdown, markdownToHtml } from './utils/markdownConverter.js'
export { cleanPastedHTML, looksLikeMarkdown } from './utils/pasteClean.js'
export { convertDocument, isImportableFile, getSupportedExtensions, getSupportedFormatNames } from './utils/documentConverter/index.js'
export { exportAsPDF, exportAsDocx, exportAsMarkdown } from './utils/exportUtils.js'
export { loadGoogleFonts, removeFonts, addFonts } from './utils/fontConfig.js'
export { formatHTML } from './utils/formatHTML.js'
export { escapeHTML, escapeHTMLAttr } from './utils/escapeHTML.js'
export { insertPlainText } from './utils/insertPlainText.js'
export { closestBlock, closestTag, wrapInTag, unwrapTag, generateId, isBlockEmpty } from './utils/dom.js'
export { isMac, getModKey } from './utils/platform.js'
export { detectTextDirection, applyAutoDirection, applyAutoDirectionAll, applyAutoDirectionAtCaret, getCharDirection, isBiDiBoundary, LOGICAL_PROPERTIES } from './utils/rtl.js'
export { t, setLocale, getLocale, registerLocale, unregisterLocale, getRegisteredLocales } from './i18n/index.js'
export { batchDOMMutations, scheduleIdleTask, cancelIdleTask, rafThrottle, measurePerformance, benchmark, createInputBatcher } from './utils/performance.js'

// Theme configuration
export { createTheme, THEME_VARIABLES } from './utils/themeConfig.js'
export { THEME_PRESETS } from './utils/themePresets.js'
export { createToolbarItemTheme, resolveToolbarItemStyle, resolveSeparatorStyle, TOOLBAR_ITEM_STYLE_KEYS } from './utils/toolbarItemTheme.js'

// Toolbar configuration
export { TOOLBAR_PRESETS, removeToolbarItems, addToolbarItems, createToolbar } from './utils/toolbarConfig.js'

// Constants
export { DEFAULT_TOOLBAR, DEFAULT_MENU_BAR, DEFAULT_FONTS, DEFAULT_FONT_SIZES, DEFAULT_COLORS, HEADING_OPTIONS } from './constants/defaults.js'
export { DEFAULT_KEYBINDINGS } from './constants/keybindings.js'
export { ALLOWED_TAGS, ALLOWED_STYLES } from './constants/schema.js'
export { BUTTON_COMMANDS, TOOLTIP_MAP, SHORTCUT_MAP, MODAL_COMMANDS, getShortcutLabel, getCommandActiveState } from './constants/commands.js'

// Config
export { defineConfig } from './config/defineConfig.js'
export { loadConfig } from './config/loadConfig.js'
export { resolvePlugins, registerPluginFactory, unregisterPluginFactory } from './config/pluginResolver.js'

// Base styles and CSS variables (required)
import './themes/variables.css'
