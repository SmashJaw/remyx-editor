export const DEFAULT_TOOLBAR = [
  ['undo', 'redo'],
  ['headings', 'fontFamily', 'fontSize'],
  ['bold', 'italic', 'underline', 'strikethrough'],
  ['foreColor', 'backColor'],
  ['alignLeft', 'alignCenter', 'alignRight', 'alignJustify'],
  ['orderedList', 'unorderedList', 'taskList'],
  ['outdent', 'indent'],
  ['link', 'image', 'attachment', 'importDocument', 'table', 'embedMedia', 'blockquote', 'codeBlock', 'horizontalRule'],
  ['subscript', 'superscript', 'removeFormat'],
  ['insertCallout', 'insertMath', 'insertToc', 'insertBookmark', 'insertMergeTag'],
  ['findReplace', 'toggleMarkdown', 'sourceMode', 'toggleAnalytics', 'toggleSpellcheck', 'distractionFree', 'toggleSplitView', 'export', 'commandPalette', 'fullscreen'],
]

export const DEFAULT_FONTS = [
  'Arial',
  'Arial Black',
  'Courier New',
  'Georgia',
  'Helvetica',
  'Impact',
  'Lucida Console',
  'Palatino Linotype',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
  'Comic Sans MS',
  'Segoe UI',
  'Roboto',
  'Open Sans',
]

export const DEFAULT_FONT_SIZES = [
  { label: '8px', value: '8px' },
  { label: '10px', value: '10px' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '28px', value: '28px' },
  { label: '32px', value: '32px' },
  { label: '36px', value: '36px' },
  { label: '48px', value: '48px' },
  { label: '64px', value: '64px' },
  { label: '72px', value: '72px' },
]

export const DEFAULT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
  '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
  '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130',
]

export const DEFAULT_MENU_BAR = [
  { label: 'File', items: ['importDocument', 'export'] },
  { label: 'Edit', items: ['undo', 'redo', '---', 'findReplace'] },
  { label: 'View', items: ['fullscreen', 'distractionFree', 'toggleSplitView', '---', 'toggleMarkdown', 'sourceMode', '---', 'toggleAnalytics', 'toggleSpellcheck'] },
  { label: 'Insert', items: [
    'link', 'image', 'table', 'attachment', 'embedMedia',
    '---', 'blockquote', 'codeBlock', 'horizontalRule',
    '---', 'insertCallout', 'insertMath', 'insertToc', 'insertBookmark', 'insertMergeTag',
    '---', 'addComment',
  ]},
  { label: 'Format', items: [
    'bold', 'italic', 'underline', 'strikethrough', '---',
    'subscript', 'superscript', '---',
    { label: 'Alignment', items: ['alignLeft', 'alignCenter', 'alignRight', 'alignJustify'] },
    '---', 'orderedList', 'unorderedList', 'taskList',
    '---', 'foreColor', 'backColor',
    '---', { label: 'Typography', items: ['lineHeight', 'letterSpacing', 'paragraphSpacing'] },
    '---', 'removeFormat',
  ]},
]

/**
 * Default maximum file size for pasted/dropped images and documents (10 MB).
 * Files exceeding this limit will be rejected with a warning.
 * Can be overridden via `options.maxFileSize` on the editor instance.
 */
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024

export const HEADING_OPTIONS = [
  { label: 'Normal', value: 'p', tag: 'p' },
  { label: 'Heading 1', value: 'h1', tag: 'h1' },
  { label: 'Heading 2', value: 'h2', tag: 'h2' },
  { label: 'Heading 3', value: 'h3', tag: 'h3' },
  { label: 'Heading 4', value: 'h4', tag: 'h4' },
  { label: 'Heading 5', value: 'h5', tag: 'h5' },
  { label: 'Heading 6', value: 'h6', tag: 'h6' },
]
