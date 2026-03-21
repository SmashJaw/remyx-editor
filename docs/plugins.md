# RemyxJS Plugins

## Required Plugins

These plugins are automatically registered by the editor and are always active.

| Plugin | Description |
|--------|-------------|
| **wordCount** | Tracks word count and character count, emitting `wordcount:update` events |
| **autolink** | Auto-converts typed URLs, www prefixes, and bare domains to clickable links on space/enter |
| **placeholder** | Shows placeholder text when editor is empty (registered when `opts.placeholder` is provided) |

## Optional Plugins

These plugins are available for explicit registration via `opts.plugins`.

### Keyboard & Navigation

| Plugin | Description |
|--------|-------------|
| **keyboardFeatures** | Vim/Emacs keybinding modes, auto-pairing brackets/quotes, multi-cursor editing, heading navigation |
| **dragDropFeatures** | Enhanced drag-and-drop with drop zones, reordering list items/table rows, external file/image support |

### Content Features

| Plugin | Description |
|--------|-------------|
| **tableFeatures** | Column/row resize handles, click-to-sort, filter UI, formula evaluation, frozen headers |
| **linkFeatures** | Link previews, broken link detection, link analytics, internal link suggestions, bookmark anchors |
| **syntaxHighlight** | Auto-highlights code blocks with language-specific tokenizers, copy button for code blocks |

### Annotations & Comments

| Plugin | Description |
|--------|-------------|
| **commentsFeatures** | Inline comment threads with @mentions, resolved/unresolved state, comment-only mode |
| **calloutFeatures** | 7 built-in callout types (info, warning, error, success, tip, note, question), custom types, collapsible toggle |

### Advanced Features

| Plugin | Description |
|--------|-------------|
| **templateFeatures** | Merge tags, conditional blocks, repeatable sections, live preview with sample data |
| **blockTemplates** | Reusable block templates (Feature Card, Two-Column, Call to Action), template registration/management |
| **tocFeatures** | Auto-generated table of contents, heading hierarchy, click-to-scroll navigation, collapsible sections |
| **mathFeatures** | LaTeX/KaTeX inline and block equations, symbol palette, pluggable renderer, auto-numbering |
| **analyticsFeatures** | Readability scoring (Flesch-Kincaid, Gunning Fog, Coleman-Liau), reading time, SEO hints, goal-based writing |
| **spellcheckFeatures** | Spelling & grammar checking, configurable style presets (formal, casual, technical, academic), custom dictionary |

### Real-Time Collaboration

| Plugin | Description |
|--------|-------------|
| **collaboration** | Real-time collaborative editing with CRDT conflict resolution, live cursors, WebSocket transport |
