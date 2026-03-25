# Remyx Editor - Complete Feature List

## Core Editor

### Text Formatting
- Bold, Italic, Underline, Strikethrough
- Subscript, Superscript
- Text color (foreground) and background color
- Remove formatting
- Font family selection (system fonts + custom Google Fonts)
- Font size control

### Headings & Structure
- Heading levels 1-6 with keyboard shortcuts
- Paragraph/heading type selector dropdown
- Base heading level configuration (for embedded contexts)
- Block-level type conversion (paragraph, heading, blockquote, code block)

### Alignment
- Left, Center, Right, Justify alignment
- RTL (right-to-left) text support with auto-detection

### Lists
- Ordered (numbered) lists
- Unordered (bulleted) lists
- Checklist / task lists
- Indent and outdent with Tab/Shift+Tab
- Nested list support

### Links & Media
- Insert/edit hyperlinks with URL validation
- Image insertion (URL or file upload)
- File attachments with drag-and-drop upload
- Embedded media (video, iframe)
- Customizable upload handler

### Tables
- Visual table picker (grid-based size selection)
- Insert and delete rows/columns
- Column and row resize handles
- Click-to-sort headers (single and multi-column with Shift)
- Filter UI on header cells
- Formula evaluation (cells starting with `=`)
- Frozen header row via sticky CSS

### Code
- Inline code formatting
- Fenced code blocks with language selector
- Syntax highlighting for 40+ programming languages
- Copy-to-clipboard button on code blocks
- Auto language detection

### Block Elements
- Blockquote insertion
- Horizontal rule
- Callout boxes (info, warning, error, success, tip, note, question)
- Custom callout type registration
- Collapsible callout sections
- GitHub-flavored alert syntax support (`> [!NOTE]`, `> [!WARNING]`)

---

## Editor Chrome & UI

### Toolbar
- Configurable toolbar with grouped button layout
- Toolbar wrapping (default) or overflow menu (`...` button)
- Toolbar presets: full, standard, minimal, bare, rich
- Custom toolbar configuration via JSON config
- Per-item theming (colors, borders, radius, opacity)
- Drag-and-drop toolbar customization
- Responsive: touch-optimized button sizes on mobile

### Menu Bar
- Optional File, Edit, View, Insert, Format menus
- Configurable menu items per menu
- Keyboard accessible with arrow key navigation

### Floating Toolbar
- Context-sensitive toolbar on text selection
- Bold, Italic, Underline, Strikethrough, Link actions
- Auto-positions near selected text
- Touch-friendly sizing

### Context Menu
- Right-click context menu with editor commands
- Keyboard accessible

### Command Palette
- Cmd/Ctrl+Shift+P to open
- Fuzzy search across all available commands
- Recently used commands tracking

### Slash Commands
- Type `/` to open inline command palette
- Quick access to headings, lists, code blocks, etc.
- Custom slash command registration
- Filterable with fuzzy matching

### Status Bar
- Word count and character count display
- Configurable position: top, bottom, or popup
- Real-time updates as content changes

### Breadcrumb Bar
- Shows current heading hierarchy path
- Click to navigate to parent headings

### Minimap
- Document overview sidebar
- Click to scroll to section

---

## Advanced Features

### Analytics Panel
- Toggle-able analytics overlay
- Real-time reading time estimate
- Word, sentence, and paragraph counts
- Readability scoring:
  - Flesch-Kincaid Grade Level
  - Flesch Reading Ease
  - Gunning Fog Index
  - Coleman-Liau Index
- Vocabulary level indicator
- Long sentence and paragraph warnings
- Goal-based writing with target word count
- SEO analysis (keyword density, heading structure)

### Math Equations
- Inline math with `$...$` or `\(...\)` syntax
- Block math with `$$...$$` or `\[...\]` syntax
- Symbol palette (Greek, operators, arrows, common symbols)
- Pluggable renderer (KaTeX, MathJax, or custom)
- Auto-numbering for block equations

### Table of Contents
- Auto-generated from document headings
- Heading hierarchy analysis with validation
- Click-to-scroll navigation
- Collapsible sections with section numbering
- Real-time updates as headings change

### Templates & Merge Tags
- Merge tag syntax: `{{variable_name}}`
- Conditional blocks: `{{#if condition}}...{{/if}}`
- Repeatable sections: `{{#each items}}...{{/each}}`
- Live preview with sample data
- Pre-built template library
- Variable extraction API

### Block Templates
- Reusable content block templates
- Built-in templates: Feature Card, Two-Column, Call to Action
- Custom template registration

### Spellcheck & Grammar
- Spelling and grammar checking
- Style presets: formal, casual, technical, academic
- Passive voice detection
- Wordiness and cliche detection
- Punctuation issue detection
- Custom dictionary with persistence
- Right-click suggestions
- Multi-language support (BCP 47)

### Comments & Annotations
- Inline comment threads
- @mention autocomplete with configurable user list
- Resolved/unresolved thread states
- Reply threading
- Comment-only mode (read-only with comments enabled)

### Link Intelligence
- Hover link previews with title, description, image
- Broken link detection with visual indicators
- Link analytics via callback
- Internal link suggestions
- Auto-linking of URLs, emails, phone numbers
- Bookmark anchors for intra-document linking

---

## Editing Experience

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Mod+B | Bold |
| Mod+I | Italic |
| Mod+U | Underline |
| Mod+Shift+X | Strikethrough |
| Mod+Z | Undo |
| Mod+Shift+Z | Redo |
| Mod+A | Select All |
| Mod+K | Insert Link |
| Mod+F | Find & Replace |
| Mod+Shift+7 | Ordered List |
| Mod+Shift+8 | Unordered List |
| Mod+Shift+9 | Blockquote |
| Mod+Shift+C | Code Block |
| Tab | Indent |
| Shift+Tab | Outdent |
| Mod+Shift+F | Fullscreen |
| Mod+Shift+U | Source Mode |
| Mod+, | Subscript |
| Mod+. | Superscript |

### Keyboard Modes
- **Default**: Standard keyboard shortcuts
- **Vim**: Normal, Insert, Visual modes with vim-style navigation
- **Emacs**: Ctrl+A/E/K/Y/W/F/B/N/P/D/H keybindings

### Multi-Cursor Editing
- Cmd/Ctrl+D to select next occurrence
- Alt+Click for additional cursors

### Auto-Pairing
- Auto-close brackets: `()`, `[]`, `{}`
- Wrap selected text with bracket pairs

### Drag & Drop
- Drop zone overlays with visual guides
- Drag between multiple Remyx editors
- External file, image, and rich-text drop support
- Drag-to-reorder list items, table rows, and blocks
- Ghost preview during drag

### Find & Replace
- Cmd/Ctrl+F to open
- Case-sensitive and regex search options
- Replace one or replace all

### Undo/Redo
- Full undo/redo history
- Grouped operations for natural undo steps

---

## View Modes

### Source Mode
- Toggle between WYSIWYG and raw HTML editing
- Syntax-highlighted HTML source editor
- Mod+Shift+U keyboard shortcut

### Markdown Toggle
- Switch between HTML and Markdown editing
- Bidirectional Markdown-HTML conversion

### Split View
- Side-by-side preview of rendered content
- Configurable output format (HTML or Markdown)

### Fullscreen Mode
- Distraction-free fullscreen editing
- Mod+Shift+F keyboard shortcut

### Distraction-Free Mode
- Hides toolbar, menu bar, and status bar
- Chrome reappears on hover

---

## Collaboration

### Real-Time Collaborative Editing
- CRDT-inspired conflict resolution with vector clocks
- Live cursors with user name and color
- User presence tracking (join/leave events)
- Configurable transport (WebSocket or custom)
- Room-based document sessions
- Operation transformation for conflict resolution

### Awareness Protocol
- User presence broadcasting
- Cursor position sharing
- Configurable broadcast interval

---

## Configuration & Theming

### Config-File Architecture
- Each editor instance uses its own JSON config file
- Config files stored in `remyxjs/config/`
- Config name passed via `<RemyxEditor config="name" />` prop
- Supports all editor options: theme, toolbar, plugins, height, etc.

### Plugin System
- Drag-and-drop plugin installation (add folder to `remyxjs/plugins/`)
- Remove plugin by deleting its folder
- Auto-discovery of plugin directories
- Config-driven plugin activation and options
- Plugin factory registration API
- 14 optional plugins available

### Theme System
- 6 built-in themes: light, dark, ocean, forest, rose, sunset
- Themes stored in `remyxjs/themes/`
- Add custom themes by dropping CSS files
- Per-editor theme selection via config
- CSS custom properties for fine-grained customization
- Custom theme object support for runtime overrides
- Google Fonts integration

### Toolbar Configuration
- Config-file toolbar definition with grouped arrays
- `toolbarWrap: true` (default) wraps icons to next row
- `toolbarOverflow: true` uses `...` expansion button instead
- Toolbar presets: full, standard, minimal, bare, rich
- Custom toolbar item ordering

---

## Data & I/O

### Input/Output Formats
- HTML content (default)
- Markdown content with bidirectional conversion
- Controlled and uncontrolled component modes

### Document Import
- Import from Markdown, HTML, plain text
- Import from DOCX, RTF, CSV, PDF
- Drag-and-drop file import

### Export
- Export to HTML, Markdown, plain text, PDF, DOCX
- Download as file

### Autosave
- Configurable autosave with multiple storage providers
- LocalStorage, SessionStorage, FileSystem, Cloud, Custom
- Save status indicator
- Recovery banner for unsaved content

### Clipboard
- Rich paste with HTML cleaning
- Paste from Word, Google Docs, web pages
- Plain text paste option
- Image paste support

---

## Accessibility & Internationalization

### Accessibility
- ARIA roles and labels on all interactive elements
- Keyboard navigation for toolbar, menus, and modals
- Focus management and focus-visible indicators
- Screen reader friendly
- Windows High Contrast mode support (forced-colors)

### Internationalization
- i18n system with locale files
- English locale included
- Extensible for additional languages

### Responsive Design
- Touch-optimized controls on mobile (44px touch targets)
- Responsive toolbar with wrapping or overflow
- Virtual keyboard support
- Pinch-to-zoom support
- Swipe gesture support

---

## Performance

### Optimization
- Virtual scroller for large documents
- Worker pool for off-thread processing
- Debounced content change events
- Memoized React components
- Shared resource management across editor instances
- Text cache for word/character count

### Error Handling
- Error boundary with fallback UI
- Configurable error callback
- Toast notifications for user feedback
