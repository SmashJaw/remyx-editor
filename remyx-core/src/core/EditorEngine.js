import { EventBus } from './EventBus.js'
import { Selection } from './Selection.js'
import { CommandRegistry } from './CommandRegistry.js'
import { History } from './History.js'
import { KeyboardManager } from './KeyboardManager.js'
import { Sanitizer } from './Sanitizer.js'
import { Clipboard } from './Clipboard.js'
import { DragDrop } from './DragDrop.js'
import { PluginManager } from '../plugins/PluginManager.js'

/**
 * @typedef {Object} EditorOptions
 * @property {string} [outputFormat='html'] - Output format ('html' or 'markdown')
 * @property {Object} [history] - History configuration options
 * @property {number} [history.maxSize=100] - Maximum number of undo states
 * @property {number} [history.debounceMs=300] - Debounce interval for snapshots in ms
 * @property {Object} [sanitize] - Sanitizer configuration options
 * @property {Object} [sanitize.allowedTags] - Map of allowed HTML tags to their allowed attributes
 * @property {string[]} [sanitize.allowedStyles] - List of allowed CSS style properties
 */

/**
 * Shared static handler for selectionchange events (Task 236).
 * A single document-level listener dispatches to the correct engine instance.
 * @type {WeakMap<HTMLElement, EditorEngine>}
 */
const _selectionHandlers = new WeakMap()
let _selectionListenerAttached = false

function _sharedSelectionChangeHandler() {
  // Try activeElement first (most common case)
  const activeElement = document.activeElement
  if (activeElement) {
    let el = activeElement
    while (el) {
      const engine = _selectionHandlers.get(el)
      if (engine) {
        engine._handleSelectionChange()
        return
      }
      el = el.parentElement
    }
  }

  // Fallback: check selection's anchor node to find the editor
  const sel = window.getSelection()
  if (sel && sel.anchorNode) {
    let node = sel.anchorNode
    while (node) {
      const engine = _selectionHandlers.get(node)
      if (engine) {
        engine._handleSelectionChange()
        return
      }
      node = node.parentNode
    }
  }
}

function _ensureSelectionListener() {
  if (!_selectionListenerAttached) {
    document.addEventListener('selectionchange', _sharedSelectionChangeHandler)
    _selectionListenerAttached = true
  }
}

export class EditorEngine {
  /**
   * Creates a new EditorEngine instance.
   * @param {HTMLElement} element - The DOM element to use as the editor
   * @param {EditorOptions} [options={}] - Configuration options
   */
  constructor(element, options = {}) {
    this.element = element
    this.options = options
    this.outputFormat = options.outputFormat || 'html'
    this.isSourceMode = false
    this.isMarkdownMode = false
    this._isDestroyed = false

    // Task 272: HTML dirty flag for caching getHTML() results
    this._htmlDirty = true
    this._lastHTML = ''

    // Task 273: Text cache for shared getText() calls in getWordCount/getCharCount
    this._textCache = null
    this._textCacheDirty = true

    this.eventBus = new EventBus()
    this.selection = new Selection(element)
    this.keyboard = new KeyboardManager(this)
    this.commands = new CommandRegistry(this)
    this.history = new History(this, options.history)
    this.sanitizer = new Sanitizer(options.sanitize)
    this.selection.setSanitizer(this.sanitizer)
    this.clipboard = new Clipboard(this)
    this.dragDrop = new DragDrop(this)
    this.plugins = new PluginManager(this)

    this._handleInput = this._handleInput.bind(this)
    this._handleSelectionChange = this._handleSelectionChange.bind(this)
    this._handleFocus = this._handleFocus.bind(this)
    this._handleBlur = this._handleBlur.bind(this)
    this._handleClick = this._handleClick.bind(this)
  }

  /**
   * Initializes the editor by setting up contenteditable attributes,
   * event listeners, and all subsystems (keyboard, history, clipboard, drag/drop, plugins).
   * @throws {Error} If initialization fails
   * @returns {void}
   */
  init() {
    try {
      this.element.setAttribute('contenteditable', 'true')
      this.element.setAttribute('role', 'textbox')
      this.element.setAttribute('aria-multiline', 'true')
      this.element.setAttribute('spellcheck', 'true')

      // Ensure there's at least one paragraph
      if (!this.element.innerHTML.trim()) {
        this.element.innerHTML = '<p><br></p>'
      }

      this.element.addEventListener('input', this._handleInput)
      this.element.addEventListener('focus', this._handleFocus)
      this.element.addEventListener('blur', this._handleBlur)
      this.element.addEventListener('click', this._handleClick)

      // Task 236: Use shared static selectionchange handler
      _selectionHandlers.set(this.element, this)
      _ensureSelectionListener()

      this.keyboard.init()
      this.history.init()
      this.clipboard.init()
      this.dragDrop.init()
      this.plugins.initAll()
    } catch (err) {
      console.error('EditorEngine init failed:', err)
      this.eventBus.emit('editor:error', { phase: 'init', error: err })
      throw err
    }
  }

  /**
   * Destroys the editor by removing all event listeners, cleaning up subsystems,
   * and removing the contenteditable attribute. Safe to call multiple times.
   * @returns {void}
   */
  destroy() {
    if (this._isDestroyed) return
    this._isDestroyed = true

    this.element.removeEventListener('input', this._handleInput)
    this.element.removeEventListener('focus', this._handleFocus)
    this.element.removeEventListener('blur', this._handleBlur)
    this.element.removeEventListener('click', this._handleClick)

    // Task 236: Remove from shared selection handler registry
    _selectionHandlers.delete(this.element)

    this.eventBus.emit('destroy')
    this.keyboard.destroy()
    this.history.destroy()
    this.clipboard.destroy()
    this.dragDrop.destroy()
    this.plugins.destroyAll()
    this.eventBus.removeAllListeners()

    this.element.removeAttribute('contenteditable')
  }

  /**
   * Returns the sanitized HTML content of the editor.
   * Task 272: Uses dirty flag to cache results.
   * @returns {string} The sanitized HTML content
   */
  getHTML() {
    if (!this._htmlDirty) return this._lastHTML
    this._lastHTML = this.sanitizer.sanitize(this.element.innerHTML)
    this._htmlDirty = false
    return this._lastHTML
  }

  /**
   * Sets the editor content to the given HTML after sanitizing it.
   * If the sanitized result is empty, inserts an empty paragraph.
   * @param {string} html - The HTML content to set
   * @returns {void}
   */
  setHTML(html) {
    const sanitized = this.sanitizer.sanitize(html)
    this.element.innerHTML = sanitized || '<p><br></p>'
    this._htmlDirty = true
    this._textCacheDirty = true
  }

  /**
   * Returns the plain text content of the editor.
   * @returns {string} The text content
   */
  getText() {
    if (!this._textCacheDirty && this._textCache !== null) return this._textCache
    this._textCache = this.element.textContent || ''
    this._textCacheDirty = false
    return this._textCache
  }

  /**
   * Checks whether the editor content is empty.
   * @returns {boolean} True if the editor contains no meaningful text
   */
  isEmpty() {
    const text = this.getText().trim()
    return text === '' || text === '\n'
  }

  /**
   * Focuses the editor element.
   * @returns {void}
   */
  focus() {
    this.element.focus()
  }

  /**
   * Blurs (unfocuses) the editor element.
   * @returns {void}
   */
  blur() {
    this.element.blur()
  }

  /**
   * Executes a registered command by name.
   * @param {string} name - The name of the command to execute
   * @param {...*} args - Additional arguments to pass to the command
   * @returns {*} The result of the command execution, or false if the command was not found or disabled
   */
  executeCommand(name, ...args) {
    return this.commands.execute(name, ...args)
  }

  /**
   * Subscribes to an editor event.
   * @param {string} event - The event name to listen for
   * @param {Function} handler - The callback function to invoke when the event fires
   * @returns {Function} An unsubscribe function that removes the listener when called
   */
  on(event, handler) {
    return this.eventBus.on(event, handler)
  }

  /**
   * Unsubscribes from an editor event.
   * @param {string} event - The event name to stop listening for
   * @param {Function} handler - The handler to remove
   * @returns {void}
   */
  off(event, handler) {
    this.eventBus.off(event, handler)
  }

  /**
   * Returns the word count of the editor content.
   * Task 273: Shares getText() call with getCharCount() via cached _textCache.
   * @returns {number} The number of words in the editor
   */
  getWordCount() {
    const text = this.getText().trim()
    if (!text) return 0
    return text.split(/\s+/).length
  }

  /**
   * Returns the character count of the editor content.
   * Task 273: Shares getText() call with getWordCount() via cached _textCache.
   * @returns {number} The number of characters in the editor
   */
  getCharCount() {
    return this.getText().length
  }

  /**
   * Handles input events on the editor element. Ensures at least one
   * block element exists and emits a content:change event.
   * @private
   * @returns {void}
   */
  _handleInput() {
    // Task 272: Mark HTML as dirty on input
    this._htmlDirty = true
    // Task 273: Invalidate text cache on input
    this._textCacheDirty = true

    // Ensure we always have at least one block element
    if (this.element.innerHTML === '' || this.element.innerHTML === '<br>') {
      this.element.innerHTML = '<p><br></p>'
      if (!this.element.firstChild) return
      const range = document.createRange()
      range.setStart(this.element.firstChild, 0)
      range.collapse(true)
      this.selection.setRange(range)
    }
    this.eventBus.emit('content:change')
  }

  /**
   * Handles document selectionchange events. Checks if the selection is
   * within the editor and emits selection:change with active formats.
   * @private
   * @returns {void}
   */
  _handleSelectionChange() {
    if (!this.selection.isWithinEditor(document.activeElement)) return
    const range = this.selection.getRange()
    if (!range) return
    const formats = this.selection.getActiveFormats()
    this.eventBus.emit('selection:change', formats)
  }

  /**
   * Handles focus events on the editor element.
   * @private
   * @returns {void}
   */
  _handleFocus() {
    this.eventBus.emit('focus')
  }

  /**
   * Handles blur events on the editor element.
   * @private
   * @returns {void}
   */
  _handleBlur() {
    this.eventBus.emit('blur')
  }

  /**
   * Handles click events on the editor element.
   * Toggles task list checkboxes on click.
   * @private
   * @param {MouseEvent} e - The click event
   * @returns {void}
   */
  _handleClick(e) {
    // Handle task list checkbox clicks
    if (e.target.type === 'checkbox' && e.target.classList.contains('rmx-task-checkbox')) {
      e.target.checked = !e.target.checked
      this._htmlDirty = true
      this._textCacheDirty = true
      this.eventBus.emit('content:change')
    }
  }
}
