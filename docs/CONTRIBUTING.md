![Remyx Editor](./images/Remyx-Logo.svg)

# Contributing to Remyx Editor

Thank you for your interest in contributing to Remyx Editor. This guide covers everything you need to get started, from setting up the development environment to submitting a pull request.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [How to Add New Commands](#how-to-add-new-commands)
5. [How to Create Plugins](#how-to-create-plugins)
6. [Pull Request Process](#pull-request-process)
7. [Code Style Guidelines](#code-style-guidelines)
8. [Commit Message Conventions](#commit-message-conventions)

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later (ships with Node 18+)

### Setup

```bash
# Clone the repository
git clone https://github.com/SmashJaw/remyx-editor.git
cd remyx-editor

# Install dependencies (npm workspaces will link all packages automatically)
npm install

# Build all packages
npm run build:all
```

The `npm install` at the repo root resolves all workspace dependencies, including the internal link between `@remyx/react` and `@remyx/core`. You do not need to run install inside individual packages.

---

## Project Structure

Remyx Editor is a monorepo managed with **npm workspaces**. All publishable packages live under `packages/`:

```
remyx/
  packages/
    remyx-core/        @remyx/core      0.27.0  Framework-agnostic editor engine
    remyx-react/       @remyx/react     0.27.0  React components and hooks
    create-remyx/      create-remyx     0.27.0  Reserved for future CLI tool
    docs/              (not published)           Documentation, changelog, roadmap
```

### @remyx/core

The core engine contains all editing logic and has zero framework dependencies:

```
packages/remyx-core/src/
  core/             EditorEngine, CommandRegistry, Selection, History, Sanitizer,
                    EventBus, KeyboardManager, Clipboard, DragDrop
  commands/         One file per command group (formatting, lists, tables, etc.)
  plugins/          Plugin system (createPlugin, PluginManager, built-in plugins)
  utils/            DOM helpers, paste cleaning, theme config, document converters
  constants/        Command names, keybindings, defaults, sanitization schema
  config/           defineConfig helper
  index.js          Public API re-exports
```

### @remyx/react

React bindings that wrap `@remyx/core`:

```
packages/remyx-react/src/
  components/       RemyxEditor, Toolbar, modals
  hooks/            useEditor, useSelection, useResolvedConfig, usePortalAttachment, etc.
  index.js          Public API re-exports
```

### create-remyx

Reserved for a future CLI tool. Project scaffolding has moved to `@remyx/react` — use `npx create-remyx-app`.

---

## Development Workflow

All commands are run from the **packages root** unless stated otherwise.

| Command | Description |
|---|---|
| `npm run build:core` | Build `@remyx/core` only |
| `npm run build:react` | Build `@remyx/react` only |
| `npm run build:all` | Build core then react (in dependency order via Nx) |
| `npm run lint` | Run ESLint across the entire repo |
| `npm run typecheck` | Type-check with TypeScript |

### Watch mode for packages

When working on a package in isolation, use the package-level `dev` script which runs Vite in watch mode:

```bash
cd remyx-core
npm run dev    # vite build --watch
```

### Build order

Always build `@remyx/core` before `@remyx/react`, since React depends on Core. The `build:all` script handles this automatically.

### Testing

Jest is the unit test runner and Playwright handles end-to-end tests. Coverage reports are generated as HTML.

```bash
# Run all unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage report (output: coverage/unit/)
npm run test:coverage

# Run Playwright e2e tests (requires dev server)
npm run e2e

# View Playwright HTML report
npm run e2e:report
```

#### Test structure

| Directory | Runner | Description |
|---|---|---|
| `packages/remyx-core/src/__tests__/` | Jest | Core engine, commands, plugins, utilities |
| `packages/remyx-react/src/__tests__/` | Jest | React hooks, components, config provider |
| `e2e/` | Playwright | Browser-based integration tests |

#### Writing tests

- One test file per module: `ModuleName.test.js` (or `.test.jsx` for React)
- Use `describe` / `it` nesting with `"should ..."` naming
- Use `jest.fn()` and `jest.spyOn()` for mocks
- Use `@testing-library/react` for component and hook tests
- Clean up DOM in `afterEach` when appending to `document.body`

### Linting

ESLint 9 is configured at the repo root with flat config. Run it before committing:

```bash
npm run lint
```

---

## How to Add New Commands

Commands are registered with the `CommandRegistry` and live in `packages/remyx-core/src/commands/`. Each file exports a registration function.

### 1. Create the command file

Create a new file in the commands directory, or add to an existing group file if the command fits logically.

```js
// packages/remyx-core/src/commands/highlight.js

/**
 * Register highlight commands with the editor engine.
 * @param {import('../core/EditorEngine.js').EditorEngine} engine
 */
export function registerHighlightCommands(engine) {
  engine.commands.register('highlight', {
    /**
     * Execute the command. Receives the engine instance and any
     * additional arguments passed to engine.commands.execute().
     */
    execute(engine, color = 'yellow') {
      document.execCommand('hiliteColor', false, color)
    },

    /** Return true when the command's state is currently active. */
    isActive() {
      return document.queryCommandState('hiliteColor')
    },

    /** Optional: return false to disable the command (grayed-out toolbar button). */
    isEnabled(engine) {
      return !engine.isMarkdownMode
    },

    /** Keyboard shortcut using "mod" for Ctrl (Windows/Linux) or Cmd (macOS). */
    shortcut: 'mod+shift+h',

    /** Metadata consumed by the toolbar renderer. */
    meta: { icon: 'highlight', tooltip: 'Highlight' },
  })
}
```

### 2. Register in EditorEngine

Import and call your registration function inside the `EditorEngine` constructor (or the command-bootstrapping section):

```js
import { registerHighlightCommands } from '../commands/highlight.js'

// Inside EditorEngine constructor or init:
registerHighlightCommands(this)
```

### 3. Export from the public API (if needed)

If the command should be available to consumers, re-export the constant name from `packages/remyx-core/src/constants/commands.js` and add it to `index.js`.

### Command API reference

| Property | Type | Required | Description |
|---|---|---|---|
| `execute` | `(engine, ...args) => any` | Yes | The action to perform |
| `isActive` | `(engine) => boolean` | No | Whether the command is currently active |
| `isEnabled` | `(engine) => boolean` | No | Whether the command can be executed |
| `shortcut` | `string` | No | Keybinding (e.g., `'mod+b'`) |
| `meta` | `object` | No | Toolbar metadata (`icon`, `tooltip`) |

---

## How to Create Plugins

Plugins extend the editor without modifying core source. Use the `createPlugin` factory from `@remyx/core`.

### Basic plugin

```js
import { createPlugin } from '@remyx/core'

export function MyPlugin() {
  return createPlugin({
    name: 'myPlugin',

    /**
     * Called when the plugin is initialized.
     * @param {object} api - Restricted plugin API facade
     */
    init(api) {
      api.eventBus.on('content:change', () => {
        // handle content change
      })
    },

    /** Called when the editor is destroyed. Clean up listeners, timers, etc. */
    destroy() {
      // teardown logic
    },
  })
}
```

### Plugin with commands and toolbar items

Plugins can register their own commands and contribute toolbar items, status bar items, and context menu items:

```js
import { createPlugin } from '@remyx/core'

export function EmojiPlugin() {
  return createPlugin({
    name: 'emoji',

    commands: [
      {
        name: 'insertEmoji',
        execute(engine, emoji) {
          document.execCommand('insertText', false, emoji)
        },
        meta: { icon: 'emoji', tooltip: 'Insert Emoji' },
      },
    ],

    toolbarItems: [
      { command: 'insertEmoji', group: 'insert' },
    ],

    statusBarItems: [],
    contextMenuItems: [],

    init(api) {
      // additional setup
    },

    destroy() {
      // cleanup
    },
  })
}
```

### Full engine access

By default, plugins receive a restricted API facade. If your plugin needs direct access to the DOM, sanitizer, or history, set `requiresFullAccess: true`:

```js
createPlugin({
  name: 'advancedPlugin',
  requiresFullAccess: true,
  init(engine) {
    // `engine` is the full EditorEngine instance
    engine.element.addEventListener('click', handleClick)
  },
  destroy() {
    // clean up direct DOM listeners
  },
})
```

Only use `requiresFullAccess` for trusted, first-party plugins. Third-party plugins should work within the facade API.

### Plugin definition properties

| Property | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | (required) | Unique plugin identifier |
| `init` | `(api) => void` | no-op | Initialization hook |
| `destroy` | `() => void` | no-op | Cleanup hook |
| `requiresFullAccess` | `boolean` | `false` | Receive full engine instead of facade |
| `commands` | `array` | `[]` | Commands to register |
| `toolbarItems` | `array` | `[]` | Toolbar button definitions |
| `statusBarItems` | `array` | `[]` | Status bar widget definitions |
| `contextMenuItems` | `array` | `[]` | Context menu entries |

---

## Pull Request Process

1. **Fork and branch.** Create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-feature main
   ```

2. **Make your changes.** Follow the code style guidelines below. Keep commits focused and atomic.

3. **Lint.** Ensure `npm run lint` passes with no errors.

4. **Build.** Run `npm run build:all` to verify both packages compile cleanly.

5. **Test.** Run any relevant tests. If you add new functionality, add tests to cover it.

6. **Update documentation.** If your change affects the public API, update the relevant docs in `packages/docs/`.

7. **Open a pull request** against the `main` branch. In your PR description:
   - Summarize what changed and why.
   - Reference any related issues (e.g., `Closes #42`).
   - Note any breaking changes.

8. **Review.** A maintainer will review your PR. Address feedback by pushing new commits (do not force-push during review).

9. **Merge.** Once approved, a maintainer will merge using squash-and-merge.

### What makes a good PR

- Solves one problem per PR. Split unrelated changes into separate PRs.
- Includes before/after screenshots for visual changes.
- Does not introduce linting errors or build warnings.
- Has a clear, descriptive title (see commit message conventions below).

---

## Code Style Guidelines

### Language

- **JavaScript with JSDoc.** All source files are `.js`. There are no TypeScript source files in the repo. Type information is provided through JSDoc annotations and separate `.d.ts` declaration files.
- **ES Modules.** All packages use `"type": "module"`. Use `import`/`export` syntax, not `require()`.

### Formatting

- No semicolons (the codebase omits them consistently).
- Single quotes for strings.
- Two-space indentation.
- Trailing commas in multiline constructs.

### JSDoc

Annotate all exported functions, classes, and non-trivial internal functions:

```js
/**
 * Register alignment commands with the editor engine.
 * @param {import('../core/EditorEngine.js').EditorEngine} engine
 */
export function registerAlignmentCommands(engine) {
  // ...
}
```

### React patterns

- **Functional components only.** No class components.
- **Hooks over HOCs.** Prefer custom hooks for reusable logic.
- **Named exports.** Avoid default exports for components and hooks.
- **`React.memo`** for components that receive stable props but whose parents re-render frequently.
- **`React.lazy` + `Suspense`** for heavy components like modals that are not needed on initial render.
- **New JSX transform.** Do not import `React` unless you use a React API (e.g., `React.memo`, `useState`). The JSX transform handles `createElement` automatically.

### File organization

- One command group per file in `commands/`.
- One plugin per file in `plugins/builtins/`.
- Co-locate React hooks with the components that use them when they are single-use. Extract to `hooks/` when shared.

### Constants

- Extract magic numbers into named constants in `constants/defaults.js`.
- Use `ALL_CAPS_SNAKE_CASE` for constant values.

---

## Commit Message Conventions

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short summary>

<optional body>

<optional footer>
```

### Types

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace, semicolons (not CSS) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or dependency changes |
| `chore` | Maintenance tasks (CI config, .gitignore, etc.) |

### Scope

Use the package short name: `core`, `react`, `create-remyx`, or `docs`. Omit the scope for cross-cutting changes.

### Examples

```
feat(core): add highlight command with keyboard shortcut
fix(react): prevent toolbar re-render on every keystroke
docs: add CONTRIBUTING.md
refactor(core): split documentConverter into per-format modules
build: upgrade Vite to 7.3.1
```

### Breaking changes

Add `BREAKING CHANGE:` in the commit footer or append `!` after the type/scope:

```
refactor(core)!: rename EditorEngine.init() to EditorEngine.mount()

BREAKING CHANGE: Consumers calling `engine.init(element)` must update
to `engine.mount(element)`.
```

---

## Questions?

If anything in this guide is unclear or you need help, open an issue on the [GitHub issue tracker](https://github.com/SmashJaw/remyx-editor/issues). We are happy to assist.
