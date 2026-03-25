# RemyxJS Plugin System

## Overview

Remyx Editor uses a drag-and-drop plugin architecture. Plugins live in the `remyxjs/plugins/` directory. To install a plugin, add its folder. To uninstall, delete the folder. Plugins are activated and configured through JSON config files in `remyxjs/config/`.

## Plugin Directory Structure

```
remyxjs/
  plugins/
    analytics/
      AnalyticsPlugin.js
      analytics.css
      index.js
    table/
      TablePlugin.js
      index.js
    ...
  config/
    default.json
    minimal.json
    ...
```

Each plugin directory must contain an `index.js` that exports a factory function ending with `Plugin` (e.g., `AnalyticsPlugin`, `TablePlugin`).

## Installing a Plugin

1. Drop the plugin folder into `remyxjs/plugins/`
2. Add it to your config file under `"plugins"`:

```json
{
  "plugins": {
    "my-plugin": { "enabled": true }
  }
}
```

3. The plugin is auto-discovered and loaded on next editor render.

## Uninstalling a Plugin

1. Remove the plugin entry from your config file(s)
2. Delete the plugin folder from `remyxjs/plugins/`

## Configuring Plugins

Plugins are configured in your editor's JSON config file:

```json
{
  "plugins": {
    "table": { "enabled": true, "sortable": true },
    "analytics": { "enabled": true, "wordsPerMinute": 250 },
    "math": { "enabled": false },
    "comments": {},
    "callout": true
  }
}
```

- `true` or `{}` enables a plugin with default options
- `false` or `{ "enabled": false }` disables a plugin
- Any additional properties are passed as options to the plugin factory

## Programmatic Registration

You can also register plugin factories via the core API:

```javascript
import { registerPluginFactory } from '@remyxjs/core'

registerPluginFactory('my-plugin', (options) => ({
  name: 'my-plugin',
  commands: [...],
  init(engine) { ... },
  destroy() { ... }
}))
```

---

## Required Plugins (Built-in)

These plugins are automatically registered and always active. They cannot be disabled.

| Plugin | Description |
|--------|-------------|
| **wordCount** | Tracks word and character count, emits `wordcount:update` events for the status bar |
| **autolink** | Auto-converts typed URLs, www prefixes, emails, and bare domains to clickable links |
| **placeholder** | Shows placeholder text when editor is empty (active when `placeholder` is set in config) |

---

## Optional Plugins

### Keyboard & Navigation

#### keyboard
Vim/Emacs keybinding modes, auto-pairing brackets, multi-cursor editing, heading navigation.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'default' \| 'vim' \| 'emacs'` | `'default'` | Keybinding mode |
| `keyBindings` | `object` | `{}` | Custom keybinding overrides |
| `autoPair` | `boolean` | `true` | Auto-pair brackets |
| `jumpToHeading` | `boolean` | `true` | Enable Cmd+Shift+G heading navigation |

#### drag-drop
Enhanced drag-and-drop with drop zones, block reordering, and external file support.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onDrop` | `Function` | — | Called when content is dropped |
| `onFileDrop` | `Function` | — | Called when files are dropped |
| `allowExternalDrop` | `boolean` | `true` | Enable external drag-drop |
| `showDropZone` | `boolean` | `true` | Show drop zone overlay |
| `enableReorder` | `boolean` | `true` | Enable block reordering |

---

### Content Features

#### table
Column/row resize, click-to-sort, filter UI, formula evaluation, frozen headers.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sortable` | `boolean` | `true` | Enable click-to-sort on table headers |
| `filterable` | `boolean` | `true` | Enable filter UI on header cells |
| `resizable` | `boolean` | `true` | Enable column/row resize handles |
| `formulas` | `boolean` | `true` | Enable formula evaluation in cells |

#### syntax-highlight
Auto-highlights code blocks with language-specific tokenizers and copy button.

No configurable options. Enable with `"syntax-highlight": true`.

#### link
Link previews, broken link detection, auto-linking, and internal link suggestions.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onLinkClick` | `Function` | — | Called on every link click with metadata |
| `onUnfurl` | `Function` | — | `(url) => Promise<{title, description, image}>` for previews |
| `onSuggest` | `Function` | — | `(query) => Promise<{title, url}[]>` for internal links |
| `onBrokenLink` | `Function` | — | Called when broken link detected |
| `validateLink` | `Function` | — | `(url) => Promise<boolean>` to check link health |
| `scanInterval` | `number` | `60000` | Broken link scan interval in ms (0 = disabled) |
| `autoLink` | `boolean` | `true` | Auto-convert typed URLs/emails/phones |
| `showPreviews` | `boolean` | `true` | Show hover previews |

---

### Annotations & Comments

#### comments
Inline comment threads with @mentions, resolved/unresolved state, comment-only mode.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onComment` | `Function` | — | Called when comment thread created |
| `onResolve` | `Function` | — | Called when thread resolved/unresolved |
| `onDelete` | `Function` | — | Called when thread deleted |
| `onReply` | `Function` | — | Called when reply added |
| `mentionUsers` | `string[]` | `[]` | Usernames for @mention autocomplete |
| `commentOnly` | `boolean` | `false` | Read-only with comments enabled |

#### callout
7 built-in callout types with custom type registration and collapsible sections.

Built-in types: `info`, `warning`, `error`, `success`, `tip`, `note`, `question`.

No configurable options. Use the API to register custom types:
```javascript
import { registerCalloutType } from 'remyxjs/plugins/callout'
registerCalloutType({ type: 'custom', icon: '🔧', label: 'Custom', color: '#ff6600' })
```

---

### Advanced Features

#### analytics
Readability scoring, reading time, vocabulary analysis, SEO hints, goal-based writing.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `wordsPerMinute` | `number` | `200` | Reading speed for time estimate |
| `targetWordCount` | `number` | `0` | Goal word count (0 = disabled) |
| `onAnalytics` | `Function` | — | `(stats) => void` called on content change |
| `maxSentenceLength` | `number` | `30` | Warn if sentence exceeds this |
| `maxParagraphLength` | `number` | `150` | Warn if paragraph exceeds this |

#### math
LaTeX/KaTeX inline and block equations with symbol palette.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `renderMath` | `Function` | — | `(latex, displayMode) => HTMLString` custom renderer |
| `autoRender` | `boolean` | `true` | Auto-detect `$` and `$$` syntax |
| `numbering` | `boolean` | `true` | Auto-number block equations |

#### toc
Auto-generated table of contents with heading hierarchy and navigation.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onOutlineChange` | `Function` | — | Called when outline changes |
| `numbering` | `boolean` | `true` | Show section numbers |
| `collapsible` | `boolean` | `true` | Allow collapsing sections |

#### template
Merge tags, conditional blocks, repeatable sections, and template library.

No configurable options. Use the API:
```javascript
import { registerTemplate, renderTemplate } from 'remyxjs/plugins/template'
```

#### block-templates
Reusable block templates (Feature Card, Two-Column, Call to Action).

No configurable options. Enable with `"block-templates": true`.

#### spellcheck
Spelling, grammar, passive voice, wordiness, and cliche detection.

No configurable options. Uses writing style presets: formal, casual, technical, academic.

---

### Real-Time Collaboration

#### collaboration
CRDT-based collaborative editing with live cursors and presence tracking.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `signalingServer` | `string` | — | WebSocket URL for built-in transport |
| `transport` | `object` | — | Custom transport with connect/disconnect/send/onMessage |
| `userId` | `string` | — | Unique user ID |
| `userName` | `string` | `'Anonymous'` | Display name |
| `userColor` | `string` | `'#6366f1'` | Cursor/avatar color |
| `roomId` | `string` | `'default'` | Document/room identifier |
| `autoConnect` | `boolean` | `true` | Connect on plugin init |
| `broadcastInterval` | `number` | `1000` | Awareness broadcast interval in ms |
| `onUserJoin` | `Function` | — | Called when user joins |
| `onUserLeave` | `Function` | — | Called when user leaves |
| `onSync` | `Function` | — | Called on sync operations |
| `onConflict` | `Function` | — | Called when conflicts detected |

---

## Creating a Custom Plugin

### Plugin Structure

Create a directory in `remyxjs/plugins/` with at least an `index.js`:

```
remyxjs/plugins/my-plugin/
  MyPlugin.js
  my-plugin.css     (optional)
  index.js
```

### index.js

```javascript
import './my-plugin.css'
export { MyPlugin } from './MyPlugin.js'
```

### MyPlugin.js

```javascript
import { createPlugin } from '@remyxjs/core'

export function MyPlugin(options = {}) {
  let engine = null

  return createPlugin({
    name: 'my-plugin',
    version: '1.0.0',
    description: 'Description of my plugin',

    commands: [
      {
        name: 'myCommand',
        execute(eng) {
          // Command logic
        },
        meta: { icon: 'star', tooltip: 'My Command' },
      },
    ],

    init(eng) {
      engine = eng
      // Setup event listeners, DOM mutations, etc.
    },

    destroy() {
      // Cleanup
      engine = null
    },
  })
}
```

### Adding to Config

```json
{
  "plugins": {
    "my-plugin": { "enabled": true, "customOption": "value" }
  }
}
```

The `customOption` is passed to `MyPlugin({ customOption: "value" })`.

### Adding to Toolbar

Reference your command name in the toolbar config:

```json
{
  "toolbar": [
    ["bold", "italic"],
    ["myCommand"]
  ]
}
```
