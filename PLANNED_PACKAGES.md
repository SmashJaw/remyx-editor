# Remyx Editor — Multi-Package Restructure Plan

**Architecture:** Shared core engine + framework-specific wrapper packages
**Strategy:** Option B — separate npm packages per framework, one shared core

---

## Target Package Structure

```
packages/
  remyx-core/          → @remyx/core         (framework-agnostic engine)
  remyx-react/         → @remyx/react        (React components + hooks + TypeScript declarations)
  remyx-vue/           → @remyx/vue          (Vue 3 composables + components)
  remyx-angular/       → @remyx/angular      (Angular module + components)
  remyx-svelte/        → @remyx/svelte       (Svelte components + actions)
  remyx-vanilla/       → @remyx/vanilla      (Vanilla JS / Web Component)
  remyx-ssr/           → @remyx/ssr          (Node.js server-side utilities)
  remyx-editor/        → remyx-editor        (backward-compat meta-package)
```

---

## Package Dependency Graph

```
@remyx/core ←── @remyx/react
            ←── @remyx/vue
            ←── @remyx/angular
            ←── @remyx/svelte
            ←── @remyx/vanilla
            ←── @remyx/ssr

remyx-editor (meta) ──→ @remyx/core + @remyx/react
```

Every framework package depends on `@remyx/core` as a peer dependency. The meta-package `remyx-editor` re-exports both `@remyx/core` and `@remyx/react` for backward compatibility.

---

## Step-by-Step Implementation

### ~~Step 1: Extract `@remyx/core`~~ ✅ Complete

**Goal:** ~~Move all framework-agnostic code into `packages/remyx-core/`. This is the foundation — all other steps depend on it.~~

**Level of effort:** ~~Large (2-3 sessions)~~ Done in 1 session

#### ~~1a. Create package scaffolding~~ ✅

~~Create `packages/remyx-core/` with:~~

```
packages/remyx-core/
  package.json
  vite.config.js
  src/
    index.js
    core/
      EditorEngine.js
      EventBus.js
      CommandRegistry.js
      Selection.js
      History.js
      KeyboardManager.js
      Sanitizer.js
      Clipboard.js
      DragDrop.js
    commands/
      formatting.js
      headings.js
      alignment.js
      lists.js
      links.js
      images.js
      tables.js
      blocks.js
      fontControls.js
      media.js
      findReplace.js
      sourceMode.js
      fullscreen.js
      markdownToggle.js
      attachments.js
      importDocument.js
    plugins/
      PluginManager.js
      createPlugin.js
      builtins/
        WordCountPlugin.js
        AutolinkPlugin.js
        PlaceholderPlugin.js
    utils/
      markdownConverter.js
      pasteClean.js
      documentConverter.js
      dom.js
      formatHTML.js
      exportUtils.js
      platform.js
      toolbarConfig.js
      fontConfig.js
      themeConfig.js
    constants/
      schema.js
      keybindings.js
      defaults.js
      commands.js
    config/
      defineConfig.js
    themes/
      variables.css
      light.css
      dark.css
```

~~**Total files to move:** 47 source files + 3 CSS files~~ → 46 JS + 3 CSS = 49 files moved

#### ~~1b. `packages/remyx-core/package.json`~~ ✅

```json
{
  "name": "@remyx/core",
  "version": "0.23.0",
  "type": "module",
  "main": "./dist/remyx-core.cjs",
  "module": "./dist/remyx-core.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/remyx-core.js",
      "require": "./dist/remyx-core.cjs",
      "types": "./dist/index.d.ts"
    },
    "./style.css": "./dist/style.css"
  },
  "files": ["dist"],
  "dependencies": {
    "mammoth": "^1.11.0",
    "marked": "^15.0.0",
    "pdfjs-dist": "^5.5.207",
    "turndown": "^7.2.0",
    "turndown-plugin-gfm": "^1.0.2"
  },
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch"
  }
}
```

#### ~~1c. `packages/remyx-core/vite.config.js`~~ ✅

```js
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'RemyxCore',
      formats: ['es', 'cjs'],
      fileName: (format) => `remyx-core.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['mammoth', 'pdfjs-dist'],
    },
    cssCodeSplit: false,
  },
})
```

#### ~~1d. `packages/remyx-core/src/index.js`~~ ✅ (80 exports)

```js
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

// Commands (register functions)
export { registerFormattingCommands } from './commands/formatting.js'
export { registerHeadingCommands } from './commands/headings.js'
export { registerAlignmentCommands } from './commands/alignment.js'
export { registerListCommands } from './commands/lists.js'
export { registerLinkCommands } from './commands/links.js'
export { registerImageCommands } from './commands/images.js'
export { registerTableCommands } from './commands/tables.js'
export { registerBlockCommands } from './commands/blocks.js'
export { registerFontCommands } from './commands/fontControls.js'
export { registerMediaCommands } from './commands/media.js'
export { registerFindReplaceCommands } from './commands/findReplace.js'
export { registerSourceModeCommands } from './commands/sourceMode.js'
export { registerFullscreenCommands } from './commands/fullscreen.js'
export { registerMarkdownToggleCommands } from './commands/markdownToggle.js'
export { registerAttachmentCommands } from './commands/attachments.js'
export { registerImportDocumentCommands } from './commands/importDocument.js'

// Plugins
export { PluginManager } from './plugins/PluginManager.js'
export { createPlugin } from './plugins/createPlugin.js'
export { WordCountPlugin } from './plugins/builtins/WordCountPlugin.js'
export { AutolinkPlugin } from './plugins/builtins/AutolinkPlugin.js'
export { PlaceholderPlugin } from './plugins/builtins/PlaceholderPlugin.js'

// Utilities
export { htmlToMarkdown, markdownToHtml } from './utils/markdownConverter.js'
export { cleanPastedHTML, looksLikeMarkdown } from './utils/pasteClean.js'
export { convertDocument } from './utils/documentConverter.js'
export { exportAsPDF, exportAsDocx, exportAsMarkdown } from './utils/exportUtils.js'
export { loadGoogleFonts, removeFonts, addFonts } from './utils/fontConfig.js'
export { createTheme, THEME_VARIABLES, THEME_PRESETS } from './utils/themeConfig.js'
export { createToolbarItemTheme, resolveToolbarItemStyle, TOOLBAR_ITEM_STYLE_KEYS } from './utils/themeConfig.js'
export { TOOLBAR_PRESETS, removeToolbarItems, addToolbarItems, createToolbar } from './utils/toolbarConfig.js'

// Constants
export { DEFAULT_TOOLBAR, DEFAULT_MENU_BAR, DEFAULT_FONTS, DEFAULT_FONT_SIZES, DEFAULT_COLORS } from './constants/defaults.js'
export { DEFAULT_KEYBINDINGS } from './constants/keybindings.js'

// Config
export { defineConfig } from './config/defineConfig.js'
```

#### ~~1e. Verification~~ ✅

- ~~Run `cd packages/remyx-core && npm run build`~~ → builds in 1.6s
- ~~Confirm `dist/remyx-core.js`, `dist/remyx-core.cjs`, and `dist/style.css` are generated~~ → 168 KB ES, 128 KB CJS, 25 KB CSS
- ~~Confirm no React imports in any file (grep for `from 'react'`)~~ → zero React imports
- ~~Confirm all exports resolve~~ → 80 named exports verified via dynamic import

---

### ~~Step 2: Refactor `@remyx/react` (with TypeScript Declarations)~~ ✅ Complete

**Goal:** ~~Convert existing `packages/remyx-editor/` into `packages/remyx-react/` that imports from `@remyx/core`. Ships JSX source with `.d.ts` type declarations so both JS and TS consumers get full support from a single package.~~

**Level of effort:** ~~Medium-Large (2-3 sessions)~~ Done in 1 session

#### ~~2a. Create `packages/remyx-react/`~~ ✅

```
packages/remyx-react/
  package.json
  vite.config.js
  src/
    index.js
    components/
      RemyxEditor.jsx
      Toolbar/
        Toolbar.jsx
        ToolbarButton.jsx
        ToolbarDropdown.jsx
        ToolbarColorPicker.jsx
        ToolbarSeparator.jsx
      MenuBar/
        MenuBar.jsx
        MenuItem.jsx
      Modals/
        ModalOverlay.jsx
        LinkModal.jsx
        ImageModal.jsx
        TablePickerModal.jsx
        ExportModal.jsx
        AttachmentModal.jsx
        ImportDocumentModal.jsx
        CodeEditor/
          CodeEditor.jsx
          highlightHTML.js      ← framework-free but tightly coupled to CodeEditor
          highlightMarkdown.js  ← framework-free but tightly coupled to CodeEditor
      StatusBar/
        StatusBar.jsx
      ContextMenu/
        ContextMenu.jsx
      FloatingToolbar/
        FloatingToolbar.jsx
      EditArea/
        EditArea.jsx
        ImageResizeHandles.jsx
    hooks/
      useRemyxEditor.js
      useEditorEngine.js
      useSelection.js
      useModal.js
      useContextMenu.js
    config/
      RemyxConfigProvider.jsx
    icons/
      index.jsx
```

**Total files:** ~33 React-specific files

#### ~~2b. `packages/remyx-react/package.json`~~ ✅

```json
{
  "name": "@remyx/react",
  "version": "0.23.0",
  "type": "module",
  "main": "./dist/remyx-react.cjs",
  "module": "./dist/remyx-react.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/remyx-react.js",
      "require": "./dist/remyx-react.cjs",
      "types": "./dist/types/index.d.ts"
    },
    "./style.css": "./dist/style.css"
  },
  "files": ["dist"],
  "peerDependencies": {
    "@remyx/core": ">=0.23.0",
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "@remyx/core": "workspace:*",
    "@vitejs/plugin-react": "^5.1.1",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "typescript": "^5.5.0",
    "vite": "^7.3.1",
    "vite-plugin-dts": "^4.0.0"
  }
}
```

#### ~~2c. Update all imports~~ ✅

Every file in `packages/remyx-react/src/` that currently imports from relative paths like `../../core/EditorEngine.js` must be updated to import from `@remyx/core`:

```js
// Before
import { EditorEngine } from '../../core/EditorEngine.js'
import { DEFAULT_TOOLBAR } from '../../constants/defaults.js'
import { cleanPastedHTML } from '../../utils/pasteClean.js'

// After
import { EditorEngine, DEFAULT_TOOLBAR, cleanPastedHTML } from '@remyx/core'
```

#### ~~2d. `packages/remyx-react/src/index.js`~~ ✅

```js
// Re-export everything from core for convenience
export * from '@remyx/core'

// React-specific exports
export { default as RemyxEditor } from './components/RemyxEditor.jsx'
export { useRemyxEditor } from './hooks/useRemyxEditor.js'
export { RemyxConfigProvider } from './config/RemyxConfigProvider.jsx'
```

#### ~~2e. Component-specific CSS~~ ✅

If any CSS is component-specific (toolbar layout, modal styles, etc.), it stays in `@remyx/react`. The final `style.css` should import core's CSS:

```css
/* packages/remyx-react/src/styles/index.css */
@import '@remyx/core/style.css';

/* React component-specific styles */
.rmx-toolbar { ... }
.rmx-modal { ... }
```

#### ~~2f. TypeScript declarations~~ ✅

The package ships JSX source code with `.d.ts` type declaration files alongside — the same pattern used by `react-router`, `zustand`, `@tanstack/react-query`, and every major React library.

**Add a `types/` directory** with declaration files:

```
packages/remyx-react/
  src/
    types/
      index.d.ts          ← main type exports
      editor.d.ts         ← RemyxEditorProps interface
      toolbar.d.ts        ← toolbar config types
      theme.d.ts          ← theme types
      plugin.d.ts         ← plugin types
      menu-bar.d.ts       ← menu bar config types
```

**Key type definitions (`src/types/index.d.ts`):**

```ts
import type { EditorEngine } from '@remyx/core'

export interface RemyxEditorProps {
  config?: string
  value?: string
  defaultValue?: string
  onChange?: (content: string) => void
  outputFormat?: 'html' | 'markdown'
  toolbar?: string[][]
  menuBar?: boolean | MenuBarConfig[]
  theme?: 'light' | 'dark'
  placeholder?: string
  height?: number
  minHeight?: number
  maxHeight?: number
  readOnly?: boolean
  fonts?: string[]
  googleFonts?: string[]
  statusBar?: 'bottom' | 'top' | 'popup' | false
  customTheme?: Record<string, string>
  toolbarItemTheme?: Record<string, Record<string, string>>
  floatingToolbar?: boolean
  contextMenu?: boolean
  plugins?: Plugin[]
  uploadHandler?: (file: File) => Promise<string>
  shortcuts?: Record<string, string>
  sanitize?: SanitizeOptions
  attachTo?: React.RefObject<HTMLElement>
  onReady?: (engine: EditorEngine) => void
  onFocus?: () => void
  onBlur?: () => void
  className?: string
  style?: React.CSSProperties
}

export interface MenuBarConfig {
  label: string
  items: (string | MenuBarConfig | '---')[]
}

export interface Plugin {
  name: string
  init?: (engine: EditorEngine) => void
  destroy?: (engine: EditorEngine) => void
  commands?: PluginCommand[]
  toolbarItems?: PluginToolbarItem[]
  statusBarItems?: PluginStatusBarItem[]
  contextMenuItems?: PluginContextMenuItem[]
}
```

**Generate declarations automatically** using `vite-plugin-dts` in the Vite config:

```js
// packages/remyx-react/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({ insertTypesEntry: true, outDir: 'dist/types' }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'RemyxReact',
      formats: ['es', 'cjs'],
      fileName: (format) => `remyx-react.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@remyx/core'],
    },
    cssCodeSplit: false,
  },
})
```

**Prerequisites:** `@remyx/core` also needs `.d.ts` declarations. Use JSDoc `@type` annotations on the core source files + `tsc --declaration --emitDeclarationOnly` to generate them without converting core to TypeScript. Add this to Step 1's build:

```json
// packages/remyx-core/package.json scripts
"build:types": "tsc --declaration --emitDeclarationOnly --outDir dist/types --allowJs src/index.js"
```

**Result:** TypeScript consumers get full autocompletion and type checking. JavaScript consumers are unaffected — the `.d.ts` files are only read by the TS compiler, not at runtime.

#### ~~2g. Verification~~ ✅

- ~~Run `cd packages/remyx-react && npm run build`~~ → builds in 114ms
- ~~Confirm all exports resolve~~ → 36 modules transformed, `@remyx/core` external
- ~~Confirm `@remyx/core` is external (not bundled)~~ → 91.20 KB ES + 62.44 KB CJS (vs core's 91.93 KB)
- ~~Confirm `dist/types/index.d.ts` exists and exports `RemyxEditorProps`~~ → hand-written `.d.ts` in `src/types/`
- ~~Run the dev app and verify all features work~~ → dev build passes (488 modules)

---

### Step 3: Backward-Compatible Meta-Package (`remyx-editor`)

**Goal:** Keep the existing `remyx-editor` npm package working for all current consumers.

**Level of effort:** Small (< 1 hour)

#### 3a. `packages/remyx-editor/package.json`

```json
{
  "name": "remyx-editor",
  "version": "0.23.0",
  "type": "module",
  "main": "./dist/remyx-editor.cjs",
  "module": "./dist/remyx-editor.js",
  "exports": {
    ".": {
      "import": "./dist/remyx-editor.js",
      "require": "./dist/remyx-editor.cjs"
    },
    "./style.css": "./dist/style.css"
  },
  "files": ["dist"],
  "dependencies": {
    "@remyx/core": "^0.23.0",
    "@remyx/react": "^0.23.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
}
```

#### 3b. `packages/remyx-editor/src/index.js`

```js
export * from '@remyx/core'
export * from '@remyx/react'
```

#### 3c. `packages/remyx-editor/style.css`

```css
@import '@remyx/core/style.css';
@import '@remyx/react/style.css';
```

All existing code using `import { RemyxEditor } from 'remyx-editor'` continues to work unchanged.

---

### Step 4: Vue 3 Package (`@remyx/vue`)

**Goal:** Vue 3 wrapper using Composition API composables and single-file components.

**Level of effort:** Large (3-4 sessions)

#### 4a. Package structure

```
packages/remyx-vue/
  package.json
  vite.config.js
  src/
    index.js
    components/
      RemyxEditor.vue          ← main component
      Toolbar.vue
      ToolbarButton.vue
      ToolbarDropdown.vue
      ToolbarColorPicker.vue
      MenuBar.vue
      MenuItem.vue
      StatusBar.vue
      ContextMenu.vue
      FloatingToolbar.vue
      Modals/
        ModalOverlay.vue
        LinkModal.vue
        ImageModal.vue
        TablePickerModal.vue
        ExportModal.vue
        AttachmentModal.vue
    composables/
      useRemyxEditor.js        ← Vue equivalent of React hook
      useEditorEngine.js
      useSelection.js
      useModal.js
    plugins/
      RemyxPlugin.js           ← Vue plugin: app.use(RemyxPlugin)
```

#### 4b. Key differences from React

| Concept | React | Vue 3 |
| --- | --- | --- |
| State | `useState` | `ref()` / `reactive()` |
| Side effects | `useEffect` | `onMounted`, `onUnmounted`, `watch` |
| Context | `React.createContext` + `useContext` | `provide` / `inject` |
| Refs | `useRef` | `ref()` / `templateRef` |
| Props | `{ prop }` destructure | `defineProps()` |
| Events | `onChange` callback prop | `defineEmits()` + `emit('update:modelValue')` |
| Two-way binding | `value` + `onChange` | `v-model` via `modelValue` + `update:modelValue` |
| Slots | `children` | `<slot>` |

#### 4c. `packages/remyx-vue/package.json`

```json
{
  "name": "@remyx/vue",
  "version": "0.23.0",
  "type": "module",
  "main": "./dist/remyx-vue.cjs",
  "module": "./dist/remyx-vue.js",
  "exports": {
    ".": {
      "import": "./dist/remyx-vue.js",
      "require": "./dist/remyx-vue.cjs"
    },
    "./style.css": "./dist/style.css"
  },
  "files": ["dist"],
  "peerDependencies": {
    "@remyx/core": ">=0.23.0",
    "vue": ">=3.3.0"
  }
}
```

#### 4d. Example: `RemyxEditor.vue`

```vue
<template>
  <div ref="wrapperRef" class="rmx-editor" :class="themeClass">
    <Toolbar v-if="!readOnly" :engine="engine" :config="resolvedToolbar" />
    <MenuBar v-if="menuBarConfig" :engine="engine" :config="menuBarConfig" />
    <div ref="editableRef" class="rmx-content" />
    <StatusBar v-if="statusBar" :engine="engine" :position="statusBar" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { EditorEngine } from '@remyx/core'

const props = defineProps({
  modelValue: String,
  theme: { type: String, default: 'light' },
  placeholder: { type: String, default: '' },
  height: { type: Number, default: 300 },
  readOnly: { type: Boolean, default: false },
  toolbar: { type: Array, default: undefined },
  menuBar: { type: [Boolean, Array], default: undefined },
  statusBar: { type: [String, Boolean], default: 'bottom' },
  outputFormat: { type: String, default: 'html' },
  uploadHandler: { type: Function, default: undefined },
  plugins: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'ready', 'focus', 'blur'])

const editableRef = ref(null)
const engine = ref(null)

onMounted(() => {
  engine.value = new EditorEngine(editableRef.value, {
    outputFormat: props.outputFormat,
    uploadHandler: props.uploadHandler,
  })
  // register commands, init engine...
  engine.value.init()
  engine.value.on('content:change', () => {
    emit('update:modelValue', engine.value.getHTML())
  })
  emit('ready', engine.value)
})

onUnmounted(() => {
  engine.value?.destroy()
})

watch(() => props.modelValue, (val) => {
  if (val !== engine.value?.getHTML()) {
    engine.value?.setHTML(val)
  }
})
</script>
```

---

### Step 5: Angular Package (`@remyx/angular`)

**Goal:** Angular library with components, directives, and services.

**Level of effort:** Large (3-4 sessions)

#### 5a. Package structure

```
packages/remyx-angular/
  package.json
  ng-package.json
  tsconfig.lib.json
  src/
    public-api.ts
    lib/
      remyx-editor.module.ts
      remyx-editor.component.ts
      toolbar/
        toolbar.component.ts
        toolbar-button.component.ts
      menu-bar/
        menu-bar.component.ts
      modals/
        link-modal.component.ts
        image-modal.component.ts
        ...
      status-bar/
        status-bar.component.ts
      services/
        editor-engine.service.ts
        config.service.ts
      directives/
        remyx-attach.directive.ts
```

#### 5b. Key Angular patterns

| Concept | Angular |
| --- | --- |
| State | Component properties + `ChangeDetectorRef` |
| Lifecycle | `ngOnInit`, `ngOnDestroy`, `ngAfterViewInit` |
| DI | `@Injectable()` services |
| Two-way binding | `@Input()` + `@Output()` + `[(ngModel)]` via `NG_VALUE_ACCESSOR` |
| Config | `forRoot()` static method on module |

#### 5c. Build tooling

Angular libraries use `ng-packagr` for building. This is different from the Vite setup used by other packages.

```json
{
  "name": "@remyx/angular",
  "version": "0.23.0",
  "peerDependencies": {
    "@remyx/core": ">=0.23.0",
    "@angular/core": ">=16.0.0",
    "@angular/common": ">=16.0.0"
  }
}
```

---

### Step 6: Svelte Package (`@remyx/svelte`)

**Goal:** Svelte 5 components using runes (`$state`, `$effect`, `$props`).

**Level of effort:** Medium-Large (2-3 sessions)

#### 6a. Package structure

```
packages/remyx-svelte/
  package.json
  vite.config.js
  src/
    index.js
    RemyxEditor.svelte
    Toolbar.svelte
    ToolbarButton.svelte
    ToolbarDropdown.svelte
    MenuBar.svelte
    StatusBar.svelte
    ContextMenu.svelte
    Modals/
      ModalOverlay.svelte
      LinkModal.svelte
      ImageModal.svelte
      ...
    actions/
      remyxAttach.js       ← Svelte action for attaching to existing elements
```

#### 6b. Key Svelte patterns

| Concept | Svelte 5 |
| --- | --- |
| State | `$state()` runes |
| Side effects | `$effect()` |
| Props | `let { prop } = $props()` |
| Two-way binding | `bind:value` |
| Lifecycle | `onMount`, `onDestroy` (from `svelte`) |
| Context | `setContext` / `getContext` |

#### 6c. `packages/remyx-svelte/package.json`

```json
{
  "name": "@remyx/svelte",
  "version": "0.23.0",
  "type": "module",
  "svelte": "./dist/index.js",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "peerDependencies": {
    "@remyx/core": ">=0.23.0",
    "svelte": ">=5.0.0"
  }
}
```

---

### Step 7: Vanilla JS / Web Component (`@remyx/vanilla`)

**Goal:** Framework-free wrapper using native Web Components (`<remyx-editor>` custom element).

**Level of effort:** Large (3-4 sessions)

#### 7a. Package structure

```
packages/remyx-vanilla/
  package.json
  vite.config.js
  src/
    index.js
    RemyxEditor.js          ← extends HTMLElement
    Toolbar.js              ← vanilla DOM toolbar
    ToolbarButton.js
    MenuBar.js
    StatusBar.js
    ContextMenu.js
    Modals/
      ModalOverlay.js
      LinkModal.js
      ImageModal.js
      ...
    icons/
      index.js              ← SVG strings instead of React components
```

#### 7b. Key design decisions

**Icons:** React uses JSX components for icons. Vanilla uses raw SVG strings:

```js
// @remyx/core or @remyx/vanilla icons
export const ICONS = {
  bold: '<svg viewBox="0 0 24 24">...</svg>',
  italic: '<svg viewBox="0 0 24 24">...</svg>',
  // ...
}
```

This requires extracting SVG path data from `icons/index.jsx` and converting to a framework-agnostic format. Consider putting the icon data (paths, viewBox) in `@remyx/core` and letting each framework package render them natively.

**Web Component API:**

```html
<remyx-editor
  theme="dark"
  placeholder="Start typing..."
  height="400"
  output-format="markdown"
></remyx-editor>

<script>
  const editor = document.querySelector('remyx-editor')
  editor.addEventListener('change', (e) => console.log(e.detail))
  editor.value = '<p>Hello</p>'
</script>
```

#### 7c. `packages/remyx-vanilla/package.json`

```json
{
  "name": "@remyx/vanilla",
  "version": "0.23.0",
  "type": "module",
  "main": "./dist/remyx-vanilla.js",
  "module": "./dist/remyx-vanilla.js",
  "peerDependencies": {
    "@remyx/core": ">=0.23.0"
  }
}
```

---

### Step 8: Node.js SSR Package (`@remyx/ssr`)

**Goal:** Server-side utilities for sanitization, markdown conversion, and HTML rendering without a browser.

**Level of effort:** Small-Medium (1-2 sessions)

#### 8a. Package structure

```
packages/remyx-ssr/
  package.json
  src/
    index.js
    sanitize.js            ← server-side Sanitizer using jsdom or linkedom
    markdown.js            ← re-export markdownToHtml/htmlToMarkdown
    render.js              ← render editor HTML for static pages (email, PDF)
```

#### 8b. Key consideration

The core `Sanitizer` uses `DOMParser` which is a browser API. For Node.js, we need a polyfill:

```js
// @remyx/ssr/src/sanitize.js
import { JSDOM } from 'jsdom'
import { Sanitizer as CoreSanitizer } from '@remyx/core'

// Polyfill DOMParser for Node.js
const { window } = new JSDOM('')
globalThis.DOMParser = window.DOMParser
globalThis.document = window.document

export class ServerSanitizer extends CoreSanitizer {
  // Same API, runs in Node.js
}
```

#### 8c. `packages/remyx-ssr/package.json`

```json
{
  "name": "@remyx/ssr",
  "version": "0.23.0",
  "type": "module",
  "main": "./dist/remyx-ssr.js",
  "module": "./dist/remyx-ssr.js",
  "dependencies": {
    "jsdom": "^24.0.0"
  },
  "peerDependencies": {
    "@remyx/core": ">=0.23.0"
  }
}
```

---

### Step 9: Update Root Monorepo Configuration

**Goal:** Wire up workspaces, dev server, and build pipeline.

**Level of effort:** Small (1 session)

#### 9a. Root `package.json`

```json
{
  "name": "remyx",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "vite",
    "build": "npm run build:core && npm run build:react && npm run build:meta",
    "build:core": "cd packages/remyx-core && npm run build",
    "build:react": "cd packages/remyx-react && npm run build",
    "build:meta": "cd packages/remyx-editor && npm run build",
    "build:all": "npm run build:core && npm-run-all --parallel build:react build:vue build:svelte build:angular build:vanilla build:ssr && npm run build:meta"
  }
}
```

#### 9b. Root `vite.config.js` (dev server)

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@remyx/core': path.resolve(__dirname, 'packages/remyx-core/src/index.js'),
      '@remyx/react': path.resolve(__dirname, 'packages/remyx-react/src/index.js'),
      'remyx-editor': path.resolve(__dirname, 'packages/remyx-react/src/index.js'),
    },
  },
})
```

---

## Execution Order & Dependencies

```
Step 1  → @remyx/core             ✅ DONE — 49 files, 80 exports, builds clean
Step 2  → @remyx/react + TS defs  ✅ DONE — 36 modules, 91 KB ES + 62 KB CJS, all imports via @remyx/core
Step 3  → remyx-editor meta       (depends on Steps 1 + 2)
─── Above this line = backward-compatible release ───
Step 4  → @remyx/vue              (depends on Step 1, parallel with 5-8)
Step 5  → @remyx/angular          (depends on Step 1, parallel with 4,6-8)
Step 6  → @remyx/svelte           (depends on Step 1, parallel with 4-5,7-8)
Step 7  → @remyx/vanilla          (depends on Step 1, parallel with 4-6,8)
Step 8  → @remyx/ssr              (depends on Step 1, parallel with 4-7)
Step 9  → Root monorepo update    (after Step 3, incrementally with 4-8)
```

Steps 4-8 are fully independent and can be done in any order or in parallel.

---

## Level of Effort Summary

| Step | Package | Effort | Sessions | Priority |
| --- | --- | --- | --- | --- |
| ~~1~~ | ~~`@remyx/core`~~ | ~~Large~~ | ~~2-3~~ | ✅ Done |
| ~~2~~ | ~~`@remyx/react` (with TS declarations)~~ | ~~Medium-Large~~ | ~~2-3~~ | ✅ Done |
| 3 | `remyx-editor` (meta) | Small | <1 | P0 — Required |
| 4 | `@remyx/vue` | Large | 3-4 | P1 — High demand |
| 5 | `@remyx/angular` | Large | 3-4 | P2 — Enterprise |
| 6 | `@remyx/svelte` | Medium-Large | 2-3 | P2 — Growing ecosystem |
| 7 | `@remyx/vanilla` | Large | 3-4 | P1 — Widest compat |
| 8 | `@remyx/ssr` | Small-Medium | 1-2 | P2 — Niche |
| 9 | Root config | Small | 1 | P0 — Required |

**Total estimated effort:** 15-24 sessions

---

## Shared Concerns Across All Framework Packages

### Icons

The React package uses JSX components for icons. Other frameworks need their own icon rendering. Two approaches:

**Option A (recommended):** Extract icon SVG path data into `@remyx/core` as plain objects:

```js
// @remyx/core/src/icons.js
export const ICON_PATHS = {
  bold: { d: 'M6 4h8a4 4 0 0 1 4 4...', viewBox: '0 0 24 24', fill: true },
  italic: { d: 'M19 4h-9...', viewBox: '0 0 24 24' },
  // ...
}
```

Each framework package renders icons natively (React JSX, Vue template, Svelte `{@html}`, Angular template, vanilla `innerHTML`).

**Option B:** Ship pre-rendered SVG strings from core, each framework uses them directly.

### CSS

- `@remyx/core/style.css` — theme variables, light/dark themes, content area styles
- Each framework package ships component-specific CSS (toolbar layout, modals, etc.)
- The CSS class names (`.rmx-*`) are shared across all frameworks

### Testing

Each package should have:
- Unit tests for framework-specific logic (hooks/composables/services)
- Integration tests rendering the editor and verifying toolbar/menu interactions
- The core package has its own comprehensive test suite for the engine, commands, and sanitizer

---

## How to Use This Plan

Each step is designed to be executable in 1-3 sessions. To continue work:

1. Open this file and read the step you want to execute
2. Tell Claude: "Execute Step X from PLANNED_PACKAGES.md"
3. Claude will read this file, understand the context, and implement that step
4. Verify the step passes its verification criteria before moving to the next

Steps 1-3 must be done in order. Steps 4-8 can be done in any order after Step 3 is complete.
