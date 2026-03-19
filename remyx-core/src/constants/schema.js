export const ALLOWED_TAGS = {
  p: ['class', 'style'],
  h1: ['class'], h2: ['class'], h3: ['class'], h4: ['class'], h5: ['class'], h6: ['class'],
  strong: [], b: [], em: [], i: [], u: [], s: [], del: [],
  sub: [], sup: [],
  a: ['href', 'target', 'rel', 'title', 'class', 'data-attachment', 'data-filename', 'data-filesize'],
  img: ['src', 'alt', 'width', 'height', 'style', 'class'],
  ul: ['class'], ol: ['class', 'start', 'type'], li: ['class'],
  table: ['class', 'data-sort-state'], thead: [], tbody: [], tr: ['class'],
  th: ['colspan', 'rowspan', 'class', 'style', 'data-sort-dir', 'data-sort-priority', 'data-filter-value', 'data-cell-format', 'data-raw-value', 'data-formula'],
  td: ['colspan', 'rowspan', 'class', 'style', 'data-cell-format', 'data-raw-value', 'data-formula', 'data-col-width'],
  blockquote: ['class'],
  pre: ['class', 'data-language'], code: ['class', 'data-language'],
  hr: [],
  br: [],
  div: ['class', 'style', 'data-embed-url'],
  span: ['style', 'class'],
  input: ['type', 'checked', 'disabled', 'class'],
  label: ['class'],
  mark: ['class'],
  iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'sandbox', 'class', 'style'],
}

export const ALLOWED_STYLES = [
  'color', 'background-color', 'font-family', 'font-size',
  'text-align', 'text-decoration', 'font-weight', 'font-style',
  'width', 'height', 'max-width', 'float', 'margin', 'margin-left', 'margin-right',
  'display', 'padding', 'border', 'min-width',
]
