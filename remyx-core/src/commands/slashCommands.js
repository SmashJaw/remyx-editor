/**
 * Slash Commands — inline command palette triggered by Mod+/ (Cmd+/ on Mac, Ctrl+/ on Windows/Linux)
 *
 * Provides a default catalog of slash command items, a filter function,
 * recently-used command tracking, custom command registration,
 * and a registration function that hooks into the editor's keyboard events.
 */

import { isMac } from '../utils/platform.js'

/** @typedef {{ id: string, label: string, description: string, icon: string, keywords: string[], category: string, action: (engine: any, openModal?: (name: string, data?: any) => void) => void }} SlashCommandItem */

// ---------------------------------------------------------------------------
// Recently-used commands
// ---------------------------------------------------------------------------

const RECENT_STORAGE_KEY = 'rmx-recent-commands'
const MAX_RECENT = 5

/**
 * Get the list of recently-used command IDs (most recent first).
 * @returns {string[]}
 */
export function getRecentCommands() {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

/**
 * Record a command execution so it appears in the recently-used list.
 * @param {string} commandId
 */
export function recordRecentCommand(commandId) {
  try {
    const recent = getRecentCommands().filter(id => id !== commandId)
    recent.unshift(commandId)
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
  } catch {
    // localStorage unavailable — silently ignore
  }
}

/**
 * Clear the recently-used command history.
 */
export function clearRecentCommands() {
  try {
    localStorage.removeItem(RECENT_STORAGE_KEY)
  } catch {
    // noop
  }
}

// ---------------------------------------------------------------------------
// Custom command items registry
// ---------------------------------------------------------------------------

/** @type {SlashCommandItem[]} */
const _customItems = []

/**
 * Register one or more custom command items that appear in the command palette.
 * Items are deduplicated by `id` — re-registering the same id replaces the previous item.
 * @param {SlashCommandItem | SlashCommandItem[]} items
 */
export function registerCommandItems(items) {
  const arr = Array.isArray(items) ? items : [items]
  for (const item of arr) {
    const idx = _customItems.findIndex(i => i.id === item.id)
    if (idx >= 0) {
      _customItems[idx] = item
    } else {
      _customItems.push(item)
    }
  }
}

/**
 * Unregister a custom command item by id.
 * @param {string} id
 * @returns {boolean} true if an item was removed
 */
export function unregisterCommandItem(id) {
  const idx = _customItems.findIndex(i => i.id === id)
  if (idx >= 0) {
    _customItems.splice(idx, 1)
    return true
  }
  return false
}

/**
 * Get all registered custom command items.
 * @returns {SlashCommandItem[]}
 */
export function getCustomCommandItems() {
  return [..._customItems]
}

/**
 * Default catalog of slash command items.
 * Each item defines: id, label, description, icon (emoji), keywords for search,
 * category for grouping, and an action function that receives the engine.
 * @type {SlashCommandItem[]}
 */
export const SLASH_COMMAND_ITEMS = [
  // Text
  { id: 'heading1', label: 'Heading 1', description: 'Large section heading', icon: 'H1', keywords: ['h1', 'title', 'heading', 'large'], category: 'Text', action: (engine) => engine.executeCommand('heading', 1) },
  { id: 'heading2', label: 'Heading 2', description: 'Medium section heading', icon: 'H2', keywords: ['h2', 'subtitle', 'heading', 'medium'], category: 'Text', action: (engine) => engine.executeCommand('heading', 2) },
  { id: 'heading3', label: 'Heading 3', description: 'Small section heading', icon: 'H3', keywords: ['h3', 'heading', 'small'], category: 'Text', action: (engine) => engine.executeCommand('heading', 3) },
  { id: 'paragraph', label: 'Paragraph', description: 'Plain text block', icon: '\u00b6', keywords: ['text', 'normal', 'body', 'plain'], category: 'Text', action: (engine) => engine.executeCommand('heading', 'p') },
  { id: 'blockquote', label: 'Blockquote', description: 'Indented quote block', icon: '\u201c', keywords: ['quote', 'citation', 'indent'], category: 'Text', action: (engine) => engine.executeCommand('blockquote') },
  { id: 'codeBlock', label: 'Code Block', description: 'Monospace code snippet', icon: '<>', keywords: ['code', 'pre', 'monospace', 'snippet', 'programming'], category: 'Text', action: (engine) => engine.executeCommand('codeBlock') },

  // Lists
  { id: 'unorderedList', label: 'Bulleted List', description: 'Unordered bullet list', icon: '\u2022', keywords: ['bullet', 'ul', 'list', 'unordered'], category: 'Lists', action: (engine) => engine.executeCommand('unorderedList') },
  { id: 'orderedList', label: 'Numbered List', description: 'Ordered numbered list', icon: '1.', keywords: ['number', 'ol', 'list', 'ordered'], category: 'Lists', action: (engine) => engine.executeCommand('orderedList') },
  { id: 'taskList', label: 'Task List', description: 'Checklist with toggleable items', icon: '\u2611', keywords: ['todo', 'checkbox', 'checklist', 'task'], category: 'Lists', action: (engine) => engine.executeCommand('taskList') },

  // Media
  { id: 'image', label: 'Image', description: 'Insert an image', icon: '\ud83d\uddbc', keywords: ['img', 'photo', 'picture', 'upload'], category: 'Media', action: (_engine, openModal) => openModal?.('image') },
  { id: 'attachment', label: 'Attachment', description: 'Attach a file', icon: '\ud83d\udcce', keywords: ['file', 'attach', 'upload', 'document'], category: 'Media', action: (_engine, openModal) => openModal?.('attachment') },
  { id: 'embedMedia', label: 'Embed Media', description: 'Embed a YouTube or Vimeo video', icon: '\u25b6', keywords: ['video', 'youtube', 'vimeo', 'embed', 'media'], category: 'Media', action: (_engine, openModal) => openModal?.('embed') },

  // Layout
  { id: 'horizontalRule', label: 'Horizontal Rule', description: 'Visual divider line', icon: '\u2015', keywords: ['hr', 'divider', 'line', 'separator', 'rule'], category: 'Layout', action: (engine) => engine.executeCommand('horizontalRule') },
  { id: 'table', label: 'Table', description: 'Insert a data table', icon: '\u2637', keywords: ['table', 'grid', 'spreadsheet', 'cells'], category: 'Layout', action: (_engine, openModal) => openModal?.('table') },

  // Insert — plugin features
  { id: 'insertCallout', label: 'Callout', description: 'Insert a styled callout block', icon: '\u2139\ufe0f', keywords: ['callout', 'alert', 'admonition', 'info', 'warning', 'tip', 'note'], category: 'Insert', action: (engine) => engine.commands.has('insertCallout') && engine.executeCommand('insertCallout') },
  { id: 'insertMath', label: 'Math Equation', description: 'Insert a LaTeX math expression', icon: '\u{1D453}', keywords: ['math', 'equation', 'latex', 'formula', 'katex'], category: 'Insert', action: (engine) => engine.commands.has('insertMath') && engine.executeCommand('insertMath', { latex: '', displayMode: true }) },
  { id: 'insertToc', label: 'Table of Contents', description: 'Insert an auto-generated table of contents', icon: '\ud83d\udcdc', keywords: ['toc', 'contents', 'outline', 'navigation', 'index'], category: 'Insert', action: (engine) => engine.commands.has('insertToc') && engine.executeCommand('insertToc') },
  { id: 'insertBookmark', label: 'Bookmark', description: 'Insert a bookmark anchor for linking', icon: '\ud83d\udd16', keywords: ['bookmark', 'anchor', 'link', 'target', 'reference'], category: 'Insert', action: (engine) => engine.commands.has('insertBookmark') && engine.executeCommand('insertBookmark', { name: 'bookmark' }) },
  { id: 'insertMergeTag', label: 'Merge Tag', description: 'Insert a template merge tag', icon: '\ud83c\udff7\ufe0f', keywords: ['merge', 'tag', 'template', 'variable', 'placeholder', 'dynamic'], category: 'Insert', action: (engine) => engine.commands.has('insertMergeTag') && engine.executeCommand('insertMergeTag', { tag: 'name' }) },
  { id: 'addComment', label: 'Comment', description: 'Add a comment to the selected text', icon: '\ud83d\udcac', keywords: ['comment', 'annotate', 'annotation', 'note', 'review', 'feedback'], category: 'Insert', action: (engine) => engine.commands.has('addComment') && engine.executeCommand('addComment') },

  // Advanced
  { id: 'findReplace', label: 'Find & Replace', description: 'Search and replace text', icon: '\ud83d\udd0d', keywords: ['find', 'search', 'replace'], category: 'Advanced', action: (_engine, openModal) => openModal?.('findReplace') },
  { id: 'sourceMode', label: 'Source Code', description: 'View and edit raw HTML', icon: '</>', keywords: ['html', 'source', 'code', 'raw'], category: 'Advanced', action: (engine) => engine.executeCommand('sourceMode') },
  { id: 'export', label: 'Export', description: 'Export as PDF, DOCX, or Markdown', icon: '\ud83d\udce4', keywords: ['export', 'download', 'pdf', 'docx', 'save'], category: 'Advanced', action: (_engine, openModal) => openModal?.('export') },
  { id: 'importDocument', label: 'Import Document', description: 'Import from file', icon: '\ud83d\udce5', keywords: ['import', 'upload', 'open', 'file'], category: 'Advanced', action: (_engine, openModal) => openModal?.('importDocument') },
  { id: 'toggleAnalytics', label: 'Toggle Analytics', description: 'Show or hide content analytics panel', icon: '\ud83d\udcca', keywords: ['analytics', 'readability', 'stats', 'word count', 'reading time'], category: 'Advanced', action: (engine) => engine.commands.has('toggleAnalytics') && engine.executeCommand('toggleAnalytics') },
  { id: 'toggleSpellcheck', label: 'Toggle Spellcheck', description: 'Enable or disable spelling and grammar checking', icon: '\u2713', keywords: ['spellcheck', 'spelling', 'grammar', 'proofread', 'writing'], category: 'Advanced', action: (engine) => engine.commands.has('toggleSpellcheck') && engine.executeCommand('toggleSpellcheck') },
  { id: 'checkGrammar', label: 'Check Grammar', description: 'Run grammar and style analysis on content', icon: 'Aa', keywords: ['grammar', 'check', 'proofread', 'style', 'writing', 'passive'], category: 'Advanced', action: (engine) => engine.commands.has('checkGrammar') && engine.executeCommand('checkGrammar') },
  { id: 'startCollaboration', label: 'Start Collaboration', description: 'Connect to collaboration server and start co-editing', icon: '\ud83d\udc65', keywords: ['collaborate', 'realtime', 'share', 'multiplayer', 'co-edit'], category: 'Advanced', action: (engine) => engine.commands.has('startCollaboration') && engine.executeCommand('startCollaboration') },
  { id: 'stopCollaboration', label: 'Stop Collaboration', description: 'Disconnect from collaboration session', icon: '\ud83d\udeab', keywords: ['disconnect', 'leave', 'stop', 'collaboration'], category: 'Advanced', action: (engine) => engine.commands.has('stopCollaboration') && engine.executeCommand('stopCollaboration') },
  { id: 'toggleMarkdown', label: 'Toggle Markdown', description: 'Switch between WYSIWYG and Markdown editing', icon: 'M\u2193', keywords: ['markdown', 'toggle', 'wysiwyg', 'mode'], category: 'Advanced', action: (engine) => engine.executeCommand('toggleMarkdown') },
  { id: 'fullscreen', label: 'Fullscreen', description: 'Enter distraction-free fullscreen mode', icon: '\u26f6', keywords: ['fullscreen', 'expand', 'zen', 'focus', 'distraction'], category: 'Advanced', action: (engine) => engine.executeCommand('fullscreen') },
  { id: 'removeFormat', label: 'Clear Formatting', description: 'Remove all formatting from selection', icon: '\ud83d\udeab', keywords: ['clear', 'remove', 'format', 'plain', 'reset'], category: 'Advanced', action: (engine) => engine.executeCommand('removeFormat') },
  { id: 'distractionFree', label: 'Distraction-Free', description: 'Hide toolbar and status bar, show on mouse move', icon: '\ud83e\uddd8', keywords: ['distraction', 'zen', 'focus', 'minimal', 'clean'], category: 'Advanced', action: (engine) => engine.executeCommand('distractionFree') },
  { id: 'toggleSplitView', label: 'Split View', description: 'Side-by-side edit and preview pane', icon: '\u25eb', keywords: ['split', 'preview', 'side', 'dual', 'pane'], category: 'Advanced', action: (engine) => engine.executeCommand('toggleSplitView') },
]

/**
 * Filter slash command items by query string.
 * Matches against label, description, and keywords. Label matches are prioritized.
 *
 * When `options.pinRecent` is true (default) and there is no query, recently-used
 * commands are placed at the top under a "Recent" category.
 *
 * @param {SlashCommandItem[]} items
 * @param {string} query
 * @param {{ pinRecent?: boolean }} [options]
 * @returns {SlashCommandItem[]}
 */
export function filterSlashItems(items, query, options = {}) {
  const { pinRecent = true } = options

  if (!query) {
    if (!pinRecent) return items
    const recentIds = getRecentCommands()
    if (recentIds.length === 0) return items

    const recentItems = []
    for (const id of recentIds) {
      const item = items.find(i => i.id === id)
      if (item) {
        recentItems.push({ ...item, category: 'Recent' })
      }
    }
    if (recentItems.length === 0) return items
    return [...recentItems, ...items]
  }

  const q = query.toLowerCase()
  const labelMatches = []
  const otherMatches = []
  for (const item of items) {
    if (item.label.toLowerCase().includes(q)) {
      labelMatches.push(item)
    } else if (
      item.description.toLowerCase().includes(q) ||
      item.keywords.some(k => k.includes(q))
    ) {
      otherMatches.push(item)
    }
  }
  return [...labelMatches, ...otherMatches]
}

/**
 * Register slash command support on the engine.
 *
 * Triggered by Mod+/ (Cmd+/ on Mac, Ctrl+/ on Windows/Linux). Opens a floating
 * palette at the caret. While active, typing filters the list without inserting
 * text into the editor. The React layer handles the palette UI.
 *
 * @param {import('../core/EditorEngine.js').EditorEngine} engine
 */
export function registerSlashCommands(engine) {
  let slashActive = false
  let query = ''

  function getCaretRect() {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    const range = sel.getRangeAt(0).cloneRange()
    range.collapse(true)
    const rect = range.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      // Fallback: insert a zero-width space to measure
      const span = document.createElement('span')
      span.textContent = '\u200b'
      range.insertNode(span)
      const spanRect = span.getBoundingClientRect()
      span.parentNode.removeChild(span)
      sel.getRangeAt(0).startContainer.parentNode?.normalize()
      return spanRect
    }
    return rect
  }

  function open() {
    const rect = getCaretRect()
    if (!rect) return
    slashActive = true
    query = ''
    engine.eventBus.emit('slash:open', { rect, query: '' })
  }

  function close() {
    if (slashActive) {
      slashActive = false
      query = ''
      engine.eventBus.emit('slash:close')
    }
  }

  function handleKeyDown(e) {
    // Mod+/ toggles the slash palette
    const mod = isMac() ? e.metaKey : e.ctrlKey
    if (mod && e.key === '/') {
      e.preventDefault()
      e.stopPropagation()
      if (slashActive) {
        close()
      } else {
        open()
      }
      return
    }

    if (!slashActive) return

    // Navigation and selection keys
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation()
      engine.eventBus.emit('slash:keydown', { key: e.key })
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      close()
      return
    }

    // Backspace removes last query character
    if (e.key === 'Backspace') {
      e.preventDefault()
      e.stopPropagation()
      if (query.length > 0) {
        query = query.slice(0, -1)
        engine.eventBus.emit('slash:query', { query })
      } else {
        close()
      }
      return
    }

    // Printable characters → filter query (don't insert into editor)
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault()
      e.stopPropagation()
      query += e.key
      engine.eventBus.emit('slash:query', { query })
    }
  }

  // Listen for execute events from the React layer
  const unsubExecute = engine.eventBus.on('slash:execute', ({ item, openModal }) => {
    slashActive = false
    query = ''
    recordRecentCommand(item.id)
    item.action(engine, openModal)
    engine.eventBus.emit('content:change')
  })

  engine.element.addEventListener('keydown', handleKeyDown, true)

  // Register cleanup on engine destroy event
  const cleanup = () => {
    engine.element?.removeEventListener('keydown', handleKeyDown, true)
    unsubExecute()
  }
  engine.eventBus.on('destroy', cleanup)
}
