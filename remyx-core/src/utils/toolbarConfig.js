import { DEFAULT_TOOLBAR } from '../constants/defaults.js'

/**
 * Pre-built toolbar presets for common use cases.
 */
export const TOOLBAR_PRESETS = {
  /** All available toolbar items */
  full: DEFAULT_TOOLBAR,

  /** Standard editing toolbar without advanced features */
  standard: [
    ['undo', 'redo'],
    ['headings', 'fontFamily', 'fontSize'],
    ['bold', 'italic', 'underline', 'strikethrough'],
    ['foreColor', 'backColor'],
    ['alignLeft', 'alignCenter', 'alignRight', 'alignJustify'],
    ['orderedList', 'unorderedList', 'taskList'],
    ['outdent', 'indent'],
    ['link', 'image', 'table', 'blockquote', 'codeBlock', 'horizontalRule'],
    ['fullscreen'],
  ],

  /** Minimal toolbar for simple text editing */
  minimal: [
    ['headings'],
    ['bold', 'italic', 'underline'],
    ['orderedList', 'unorderedList'],
    ['link', 'image', 'blockquote'],
  ],

  /** Bare-bones formatting only */
  bare: [
    ['bold', 'italic', 'underline'],
  ],

  /** Rich document editing with all plugin features */
  rich: [
    ['undo', 'redo'],
    ['headings', 'fontFamily', 'fontSize', 'typography'],
    ['bold', 'italic', 'underline', 'strikethrough'],
    ['foreColor', 'backColor'],
    ['alignLeft', 'alignCenter', 'alignRight'],
    ['orderedList', 'unorderedList', 'taskList'],
    ['outdent', 'indent'],
    ['link', 'image', 'attachment', 'table', 'embedMedia', 'blockquote', 'codeBlock', 'horizontalRule'],
    ['insertCallout', 'insertMath', 'insertToc', 'insertBookmark', 'insertMergeTag'],
    ['subscript', 'superscript', 'removeFormat'],
    ['findReplace', 'toggleMarkdown', 'sourceMode', 'toggleAnalytics', 'distractionFree', 'toggleSplitView', 'export', 'commandPalette', 'fullscreen'],
  ],
}

/**
 * Remove specific items from a toolbar config.
 *
 * @param {string[][]} config - Toolbar config (array of groups)
 * @param {string[]} itemsToRemove - Command names to remove
 * @returns {string[][]} New toolbar config with items removed (empty groups are excluded)
 *
 * @example
 * removeToolbarItems(DEFAULT_TOOLBAR, ['image', 'table', 'embedMedia'])
 */
export function removeToolbarItems(config, itemsToRemove) {
  const removeSet = new Set(itemsToRemove)
  return config
    .map(group => group.filter(item => !removeSet.has(item)))
    .filter(group => group.length > 0)
}

/**
 * Add items to a toolbar config.
 *
 * @param {string[][]} config - Toolbar config (array of groups)
 * @param {string|string[]} items - Command name(s) to add
 * @param {Object} [options]
 * @param {number} [options.group] - Group index to insert into. If omitted, appends a new group.
 * @param {string} [options.after] - Insert after this command within the group
 * @param {string} [options.before] - Insert before this command within the group
 * @returns {string[][]} New toolbar config with items added
 *
 * @example
 * // Add 'export' to the last group
 * addToolbarItems(myToolbar, 'export', { group: -1 })
 *
 * // Add items as a new group at the end
 * addToolbarItems(myToolbar, ['subscript', 'superscript'])
 *
 * // Insert after a specific item
 * addToolbarItems(myToolbar, 'taskList', { after: 'unorderedList' })
 */
export function addToolbarItems(config, items, options = {}) {
  const itemsArray = Array.isArray(items) ? items : [items]
  const result = config.map(group => [...group])

  if (options.after || options.before) {
    const target = options.after || options.before
    for (let i = 0; i < result.length; i++) {
      const idx = result[i].indexOf(target)
      if (idx !== -1) {
        const insertAt = options.after ? idx + 1 : idx
        result[i].splice(insertAt, 0, ...itemsArray)
        return result
      }
    }
    // Target not found — fall through to append as new group
  }

  if (options.group !== undefined) {
    const gi = options.group < 0 ? result.length + options.group : options.group
    if (gi >= 0 && gi < result.length) {
      result[gi].push(...itemsArray)
      return result
    }
  }

  // Default: append as a new group
  result.push(itemsArray)
  return result
}

/**
 * Create a toolbar config from a flat list of command names.
 * Commands are automatically grouped by category.
 *
 * @param {string[]} items - Command names to include
 * @returns {string[][]} Toolbar config grouped by category
 *
 * @example
 * createToolbar(['bold', 'italic', 'underline', 'link', 'orderedList', 'unorderedList'])
 */
export function createToolbar(items) {
  const CATEGORY_ORDER = [
    { commands: ['undo', 'redo'] },
    { commands: ['headings', 'fontFamily', 'fontSize'] },
    { commands: ['bold', 'italic', 'underline', 'strikethrough'] },
    { commands: ['foreColor', 'backColor'] },
    { commands: ['alignLeft', 'alignCenter', 'alignRight', 'alignJustify'] },
    { commands: ['orderedList', 'unorderedList', 'taskList'] },
    { commands: ['outdent', 'indent'] },
    { commands: ['link', 'image', 'attachment', 'importDocument', 'table', 'embedMedia', 'blockquote', 'codeBlock', 'horizontalRule'] },
    { commands: ['subscript', 'superscript'] },
    { commands: ['findReplace', 'toggleMarkdown', 'sourceMode', 'export', 'fullscreen'] },
  ]

  const itemSet = new Set(items)
  const result = []

  for (const category of CATEGORY_ORDER) {
    const group = category.commands.filter(cmd => itemSet.has(cmd))
    if (group.length > 0) {
      result.push(group)
      group.forEach(cmd => itemSet.delete(cmd))
    }
  }

  // Any remaining items that didn't match a category go in their own group
  if (itemSet.size > 0) {
    result.push([...itemSet])
  }

  return result
}
