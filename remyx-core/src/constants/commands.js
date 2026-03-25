import { isMac } from '../utils/platform.js'

/**
 * Item 20: IMPORTANT — BUTTON_COMMANDS and TOOLTIP_MAP must be kept in sync manually.
 * When adding a new command to BUTTON_COMMANDS, also add a corresponding entry to TOOLTIP_MAP below.
 * When adding a new entry to TOOLTIP_MAP for a button command, ensure it is also in BUTTON_COMMANDS.
 * SHORTCUT_MAP should also be updated if the command has a keyboard shortcut.
 * MODAL_COMMANDS should be updated if the command triggers a modal instead of direct execution.
 */
export const BUTTON_COMMANDS = new Set([
  'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript',
  'alignLeft', 'alignCenter', 'alignRight', 'alignJustify',
  'orderedList', 'unorderedList', 'taskList',
  'blockquote', 'codeBlock', 'horizontalRule',
  'undo', 'redo', 'removeFormat',
  'indent', 'outdent',
  'fullscreen', 'sourceMode', 'toggleMarkdown',
  'distractionFree', 'toggleSplitView',
  // Plugin commands exposed as toolbar buttons
  'insertCallout', 'insertMath', 'insertToc', 'insertBookmark', 'insertMergeTag',
  'toggleAnalytics', 'toggleSpellcheck', 'checkGrammar',
  'startCollaboration', 'stopCollaboration',
  'addComment', 'removeFormat',
  'lineHeight', 'letterSpacing', 'paragraphSpacing',
])

export const TOOLTIP_MAP = {
  bold: 'Bold', italic: 'Italic', underline: 'Underline', strikethrough: 'Strikethrough',
  subscript: 'Subscript', superscript: 'Superscript',
  alignLeft: 'Align Left', alignCenter: 'Align Center', alignRight: 'Align Right', alignJustify: 'Justify',
  orderedList: 'Numbered List', unorderedList: 'Bulleted List', taskList: 'Task List',
  blockquote: 'Blockquote', codeBlock: 'Code Block', horizontalRule: 'Horizontal Rule',
  undo: 'Undo', redo: 'Redo', removeFormat: 'Remove Formatting',
  indent: 'Indent', outdent: 'Outdent',
  link: 'Insert Link', image: 'Insert Image', attachment: 'Attach File', table: 'Insert Table',
  importDocument: 'Import Document',
  embedMedia: 'Embed Media', findReplace: 'Find & Replace',
  fullscreen: 'Fullscreen', sourceMode: 'Source Code',
  toggleMarkdown: 'Toggle Markdown', export: 'Export Document',
  distractionFree: 'Distraction-Free Mode', toggleSplitView: 'Split View',
  lineHeight: 'Line Height', letterSpacing: 'Letter Spacing', paragraphSpacing: 'Paragraph Spacing',
  saveColorPreset: 'Save Color Preset', typography: 'Typography',
  foreColor: 'Text Color', backColor: 'Background Color',
  headings: 'Block Type', fontFamily: 'Font Family', fontSize: 'Font Size',
  commandPalette: 'Command Palette',
  // Plugin commands
  insertCallout: 'Insert Callout',
  insertMath: 'Insert Math',
  insertToc: 'Insert Table of Contents',
  insertBookmark: 'Insert Bookmark',
  insertMergeTag: 'Insert Merge Tag',
  addComment: 'Add Comment',
  scanBrokenLinks: 'Scan Broken Links',
  getAnalytics: 'Content Analytics',
  toggleAnalytics: 'Toggle Analytics',
  toggleSpellcheck: 'Toggle Spellcheck',
  checkGrammar: 'Check Grammar',
  startCollaboration: 'Start Collaboration',
  stopCollaboration: 'Stop Collaboration',
}

export const SHORTCUT_MAP = {
  bold: 'mod+B', italic: 'mod+I', underline: 'mod+U',
  strikethrough: 'mod+Shift+X', undo: 'mod+Z', redo: 'mod+Shift+Z',
  insertLink: 'mod+K', findReplace: 'mod+F',
  fullscreen: 'mod+Shift+F', sourceMode: 'mod+Shift+U',
  commandPalette: 'mod+Shift+P',
  distractionFree: 'mod+Shift+D', toggleSplitView: 'mod+Shift+V',
}

/** Commands that trigger modals instead of direct execution */
export const MODAL_COMMANDS = {
  link: 'link',
  image: 'image',
  attachment: 'attachment',
  importDocument: 'importDocument',
  table: 'table',
  embedMedia: 'embed',
  findReplace: 'findReplace',
  export: 'export',
}

export function getShortcutLabel(command) {
  const shortcut = SHORTCUT_MAP[command]
  if (!shortcut) return ''
  return shortcut.replace(/mod/g, isMac() ? '⌘' : 'Ctrl')
}

/**
 * Get the active state for a command from selectionState + engine.
 */
export function getCommandActiveState(command, selectionState, engine) {
  switch (command) {
    case 'bold': return selectionState.bold
    case 'italic': return selectionState.italic
    case 'underline': return selectionState.underline
    case 'strikethrough': return selectionState.strikethrough
    case 'subscript': return selectionState.subscript
    case 'superscript': return selectionState.superscript
    case 'alignLeft': return selectionState.alignment === 'left'
    case 'alignCenter': return selectionState.alignment === 'center'
    case 'alignRight': return selectionState.alignment === 'right'
    case 'alignJustify': return selectionState.alignment === 'justify'
    case 'orderedList': return selectionState.orderedList
    case 'unorderedList': return selectionState.unorderedList
    case 'blockquote': return selectionState.blockquote
    case 'codeBlock': return selectionState.codeBlock
    case 'sourceMode': return engine?.isSourceMode
    case 'toggleMarkdown': return engine?.isMarkdownMode
    case 'fullscreen': return engine?.element?.closest('.rmx-editor')?.classList.contains('rmx-fullscreen')
    case 'distractionFree': return engine?.element?.closest('.rmx-editor')?.classList.contains('rmx-distraction-free')
    case 'toggleSplitView': return engine?.element?.closest('.rmx-editor')?.classList.contains('rmx-split-view')
    default: return false
  }
}
