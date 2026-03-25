#!/usr/bin/env node

import { stdin, stdout, argv, exit, cwd } from 'node:process'
import { createInterface } from 'node:readline'
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// ── Colors (no dependencies) ────────────────────────────────────

const bold = (s) => `\x1b[1m${s}\x1b[22m`
const cyan = (s) => `\x1b[36m${s}\x1b[39m`
const green = (s) => `\x1b[32m${s}\x1b[39m`
const dim = (s) => `\x1b[2m${s}\x1b[22m`
const red = (s) => `\x1b[31m${s}\x1b[39m`
const yellow = (s) => `\x1b[33m${s}\x1b[39m`

// ── Readline prompt ─────────────────────────────────────────────

function createPrompt() {
  const rl = createInterface({ input: stdin, output: stdout })
  const ask = (question) =>
    new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())))
  const close = () => rl.close()
  return { ask, close }
}

// ── Plugin catalog ──────────────────────────────────────────────

const PLUGIN_CATALOG = [
  // Core (selected by default)
  { name: 'TablePlugin',            group: 'Core',          desc: 'Sortable columns, formulas, cell formatting',      defaultOn: true  },
  { name: 'SyntaxHighlightPlugin',  group: 'Core',          desc: 'Code block highlighting (11 languages)',           defaultOn: true  },

  // Content
  { name: 'CommentsPlugin',         group: 'Content',       desc: 'Inline comment threads, @mentions',                defaultOn: false },
  { name: 'CalloutPlugin',          group: 'Content',       desc: 'Alert blocks (info, warning, error, success)',     defaultOn: false },
  { name: 'TemplatePlugin',         group: 'Content',       desc: 'Merge tags, conditionals, template library',       defaultOn: false },
  { name: 'MathPlugin',             group: 'Content',       desc: 'LaTeX math equations, symbol palette',             defaultOn: false },

  // Editing
  { name: 'KeyboardPlugin',         group: 'Editing',       desc: 'Vim/Emacs modes, multi-cursor, auto-pair',         defaultOn: false },
  { name: 'DragDropPlugin',         group: 'Editing',       desc: 'Block reorder, drag & drop, drop zones',           defaultOn: false },
  { name: 'LinkPlugin',             group: 'Editing',       desc: 'Link previews, broken link detection, bookmarks',  defaultOn: false },

  // Analysis
  { name: 'AnalyticsPlugin',        group: 'Analysis',      desc: 'Readability scores, reading time, SEO hints',      defaultOn: false },
  { name: 'SpellcheckPlugin',       group: 'Analysis',      desc: 'Grammar & spell checking, writing-style presets',  defaultOn: false },
  { name: 'TocPlugin',              group: 'Analysis',      desc: 'Auto-generated table of contents',                 defaultOn: false },

  // Collaboration
  { name: 'CollaborationPlugin',    group: 'Collaboration', desc: 'Real-time co-editing, live cursors',               defaultOn: false },
]

// ── Version (read from package.json) ────────────────────────────

const __pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'))

// ── Main ────────────────────────────────────────────────────────

async function main() {
  const projectArg = argv[2]

  console.log()
  console.log(bold(cyan('  create-remyx-app')) + dim(' v' + __pkg.version))
  console.log()

  const { ask, close } = createPrompt()

  // 1. Project name
  let projectName = projectArg
  if (!projectName) {
    projectName = await ask(bold('  Project name: ') + dim('(remyx-app) '))
    if (!projectName) projectName = 'remyx-app'
  }

  // 2. Language
  console.log()
  console.log(bold('  Language:'))
  console.log(`    ${cyan('1.')} JavaScript ${dim('(JSX)')}`)
  console.log(`    ${cyan('2.')} TypeScript ${dim('(TSX)')}`)
  console.log()
  const langChoice = await ask(bold('  Choose (1 or 2): ') + dim('(1) '))
  const useTypeScript = langChoice === '2'
  const variant = useTypeScript ? 'typescript' : 'jsx'

  // 3. Theme
  console.log()
  console.log(bold('  Theme:'))
  console.log(`    ${cyan('1.')} Light  ${dim('— clean white (default)')}`)
  console.log(`    ${cyan('2.')} Dark   ${dim('— neutral dark')}`)
  console.log(`    ${cyan('3.')} Ocean  ${dim('— deep blue')}`)
  console.log(`    ${cyan('4.')} Forest ${dim('— green earth-tone')}`)
  console.log(`    ${cyan('5.')} Sunset ${dim('— warm orange / amber')}`)
  console.log(`    ${cyan('6.')} Rose   ${dim('— soft pink')}`)
  console.log()
  const themeChoice = await ask(bold('  Choose (1-6): ') + dim('(1) '))
  const themeNames = ['light', 'dark', 'ocean', 'forest', 'sunset', 'rose']
  const themeIndex = parseInt(themeChoice, 10)
  const selectedTheme = themeNames[(themeIndex >= 1 && themeIndex <= 6) ? themeIndex - 1 : 0]

  // 4. Install heavy optional deps?
  console.log()
  console.log(bold('  Optional features:'))
  console.log(`    PDF & DOCX import requires ${dim('pdfjs-dist')} and ${dim('mammoth')} (~5 MB)`)
  console.log()
  const includeDocsRaw = await ask(bold('  Include PDF/DOCX import? (y/N): ') + dim('(N) '))
  const includeDocs = includeDocsRaw.toLowerCase() === 'y' || includeDocsRaw.toLowerCase() === 'yes'

  // 5. Plugin selection
  console.log()
  console.log(bold('  Plugins:'))
  console.log(dim('    Choose which plugins to include. Unselected plugins won\'t add to your bundle.'))
  console.log(dim('    WordCountPlugin, AutolinkPlugin, and PlaceholderPlugin are always included.'))
  console.log()

  let currentGroup = ''
  for (let i = 0; i < PLUGIN_CATALOG.length; i++) {
    const plugin = PLUGIN_CATALOG[i]
    if (plugin.group !== currentGroup) {
      currentGroup = plugin.group
      const groupLabel = currentGroup === 'Core' ? `${currentGroup} ${dim('(selected by default)')}` : currentGroup
      console.log(`    ${bold(groupLabel)}`)
    }
    const marker = plugin.defaultOn ? green('◉') : dim('◯')
    const num = cyan(`${i + 1}.`.padEnd(4))
    console.log(`      ${marker} ${num}${plugin.name.padEnd(24)} ${dim('— ' + plugin.desc)}`)
  }

  console.log()
  console.log(dim('    Enter numbers separated by commas to toggle selection.'))
  console.log(dim('    Press Enter to keep defaults, or type "all" for everything, "none" for none.'))
  console.log()

  const pluginInput = await ask(bold('  Plugins (e.g. 1,2,5,7): ') + dim('(defaults) '))

  // Parse plugin selection
  const selectedPlugins = resolvePluginSelection(pluginInput)

  close()

  // ── Validate project name ──────────────────────────────────

  // Prevent path traversal: reject names containing ../, absolute paths, or OS-reserved chars
  if (
    /\.\.[\\/]/.test(projectName) ||              // directory traversal
    /^[/\\]/.test(projectName) ||                 // absolute path
    /^[A-Za-z]:/.test(projectName) ||             // Windows drive letter
    /[\x00-\x1f<>:"|?*]/.test(projectName)        // null bytes & OS-reserved chars
  ) {
    console.error(red(`\n  Error: Invalid project name "${projectName}" — must not contain path traversal or special characters.\n`))
    exit(1)
  }

  // ── Scaffold ────────────────────────────────────────────────

  const targetDir = resolve(cwd(), projectName)

  // Ensure resolved path stays within the working directory
  const cwdResolved = resolve(cwd())
  if (!targetDir.startsWith(cwdResolved)) {
    console.error(red(`\n  Error: Project directory would be created outside the current working directory.\n`))
    exit(1)
  }

  console.log()
  console.log(`  ${bold('Scaffolding')} ${cyan(projectName)} ...`)
  console.log()

  // Copy template (inject selected theme and plugins into App source)
  const templateDir = join(__dirname, 'templates', variant)
  copyDir(templateDir, targetDir, { theme: selectedTheme, plugins: selectedPlugins })

  // Write package.json
  const pkg = buildPackageJson(projectName, useTypeScript, includeDocs)
  writeFileSync(join(targetDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')

  // Write .gitignore (can't include in template as npm strips them)
  writeFileSync(
    join(targetDir, '.gitignore'),
    ['node_modules', 'dist', '.DS_Store', '*.local', ''].join('\n'),
  )

  // ── Done ──────────────────────────────────────────────────

  console.log(green('  Done!') + ' Created project in ' + dim(targetDir))
  console.log()
  console.log('  Next steps:')
  console.log()
  console.log(`    ${cyan('cd')} ${projectName}`)
  console.log(`    ${cyan('npm install')}`)
  console.log(`    ${cyan('npm run dev')}`)
  console.log()

  if (selectedPlugins.length > 0) {
    console.log(dim(`  Plugins: ${selectedPlugins.join(', ')}`))
  } else {
    console.log(dim(`  Plugins: none (only built-in defaults)`))
  }

  if (useTypeScript) {
    console.log(dim(`  TypeScript types included via @remyxjs/react (ships .d.ts declarations)`))
  } else {
    console.log(dim(`  Tip: switch to TypeScript later by renaming .jsx -> .tsx and adding tsconfig.json`))
  }
  console.log(dim(`  Theme: ${selectedTheme} — change anytime via the theme prop`))
  console.log()
}

// ── Plugin selection resolver ────────────────────────────────────

function resolvePluginSelection(input) {
  const lowerInput = input.toLowerCase()

  // "all" → select everything
  if (lowerInput === 'all') {
    return PLUGIN_CATALOG.map(p => p.name)
  }

  // "none" → select nothing
  if (lowerInput === 'none') {
    return []
  }

  // Empty input → keep defaults
  if (!input) {
    return PLUGIN_CATALOG.filter(p => p.defaultOn).map(p => p.name)
  }

  // Parse comma-separated numbers
  const nums = input.split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n) && n >= 1 && n <= PLUGIN_CATALOG.length)

  if (nums.length === 0) {
    // Invalid input → fall back to defaults
    return PLUGIN_CATALOG.filter(p => p.defaultOn).map(p => p.name)
  }

  // Start with defaults, then toggle the specified numbers
  const selected = new Set(
    PLUGIN_CATALOG.filter(p => p.defaultOn).map(p => p.name)
  )

  for (const num of nums) {
    const plugin = PLUGIN_CATALOG[num - 1]
    if (selected.has(plugin.name)) {
      selected.delete(plugin.name) // toggle off
    } else {
      selected.add(plugin.name) // toggle on
    }
  }

  return Array.from(selected)
}

// ── Helpers ──────────────────────────────────────────────────────

function buildPackageJson(name, useTypeScript, includeDocs) {
  // Read versions from this package's own package.json to avoid hardcoding
  const ownPeer = __pkg.peerDependencies || {}
  const ownDev = __pkg.devDependencies || {}
  const coreVersion = ownDev['@remyxjs/core'] || ownPeer['@remyxjs/core'] || __pkg.version
  const reactVersion = ownDev['react'] || ownPeer['react'] || '>=18.0.0'
  const reactDomVersion = ownDev['react-dom'] || ownPeer['react-dom'] || '>=18.0.0'
  const viteVersion = ownDev['vite'] || '>=7.0.0'
  const pluginReactVersion = ownDev['@vitejs/plugin-react'] || '>=5.0.0'

  const pkg = {
    name,
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
    dependencies: {
      '@remyxjs/core': '^' + coreVersion,
      '@remyxjs/react': '^' + coreVersion,
      react: '^' + reactVersion,
      'react-dom': '^' + reactDomVersion,
    },
    devDependencies: {
      '@vitejs/plugin-react': '^' + pluginReactVersion,
      vite: '^' + viteVersion,
    },
  }

  if (useTypeScript) {
    pkg.devDependencies['typescript'] = '^5.8.0'
    pkg.devDependencies['@types/react'] = '^19.0.0'
    pkg.devDependencies['@types/react-dom'] = '^19.0.0'
  }

  if (includeDocs) {
    // These are peer/optional deps of @remyxjs/core for document import
    pkg.dependencies['pdfjs-dist'] = '^5.0.0'
    pkg.dependencies['mammoth'] = '^1.11.0'
  }

  // Sort devDependencies
  pkg.devDependencies = Object.fromEntries(
    Object.entries(pkg.devDependencies).sort(([a], [b]) => a.localeCompare(b)),
  )

  return pkg
}

function copyDir(src, dest, opts = {}) {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry)
    const destPath = join(dest, entry)
    try {
      if (statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath, opts)
      } else if (/\.(jsx|tsx)$/.test(entry)) {
        // Inject theme and plugins into React source files
        let content = readFileSync(srcPath, 'utf-8')

        // Theme injection
        if (opts.theme && opts.theme !== 'light') {
          content = content.replace(/theme="light"(?=[\s/>])/g, `theme="${opts.theme}"`)
        }

        // Plugin injection
        content = injectPlugins(content, opts.plugins || [])

        writeFileSync(destPath, content)
      } else {
        writeFileSync(destPath, readFileSync(srcPath))
      }
    } catch (err) {
      throw new Error(`Failed to copy "${srcPath}" to "${destPath}": ${err.message}`)
    }
  }
}

function injectPlugins(content, plugins) {
  if (plugins.length > 0) {
    // Generate import line
    const importLine = `import { ${plugins.join(', ')} } from '@remyxjs/core'`
    content = content.replace('/* __PLUGIN_IMPORTS__ */', importLine)

    // Generate plugins prop
    const pluginCalls = plugins.map(p => `${p}()`).join(', ')
    content = content.replace(
      '/* __PLUGIN_ARRAY__ */',
      `plugins={[${pluginCalls}]}`
    )
  } else {
    // No plugins selected — remove markers cleanly
    content = content.replace('/* __PLUGIN_IMPORTS__ */\n', '')
    content = content.replace('\n        /* __PLUGIN_ARRAY__ */', '')
  }

  return content
}

main().catch((err) => {
  console.error(red(`\n  Error: ${err.message}\n`))
  exit(1)
})
