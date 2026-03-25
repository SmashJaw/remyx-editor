#!/usr/bin/env node

import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync, copyFileSync } from 'node:fs'
import { resolve, join, basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { argv, cwd } from 'node:process'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const TEMPLATES = resolve(__dirname, 'templates')

// ── Colors ─────────────────────────────────────────────────────
const bold  = (s) => `\x1b[1m${s}\x1b[22m`
const green = (s) => `\x1b[32m${s}\x1b[39m`
const cyan  = (s) => `\x1b[36m${s}\x1b[39m`
const dim   = (s) => `\x1b[2m${s}\x1b[22m`
const yellow = (s) => `\x1b[33m${s}\x1b[39m`
const red   = (s) => `\x1b[31m${s}\x1b[39m`

// ── Helpers ────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
    return true
  }
  return false
}

function copyRecursive(src, dest, force = false) {
  let count = 0
  const entries = readdirSync(src)
  ensureDir(dest)
  for (const entry of entries) {
    if (entry === '.DS_Store') continue
    const srcPath = join(src, entry)
    const destPath = join(dest, entry)
    const stat = statSync(srcPath)
    if (stat.isDirectory()) {
      count += copyRecursive(srcPath, destPath, force)
    } else {
      if (!existsSync(destPath) || force) {
        copyFileSync(srcPath, destPath)
        count++
      }
    }
  }
  return count
}

function writeIfNew(filePath, content, force = false) {
  if (!existsSync(filePath) || force) {
    writeFileSync(filePath, content, 'utf8')
    return true
  }
  return false
}

// ── CLI parsing ────────────────────────────────────────────────

const args = argv.slice(2)
const command = args[0]

if (command === '--help' || command === '-h' || (!command && args.length === 0)) {
  // If no args at all, treat as "init"
  if (args.length === 0) {
    // fall through to init
  } else {
    console.log(`
  ${bold('remyxjs')} - Remyx Editor CLI

  ${bold('Usage:')}
    npx remyxjs init [options]

  ${bold('Commands:')}
    init          Scaffold the remyxjs/ directory with plugins, themes, and config

  ${bold('Options:')}
    --force       Overwrite existing files
    --no-plugins  Skip copying built-in plugins
    --no-themes   Skip copying built-in themes
    -h, --help    Show this help message
`)
    process.exit(0)
  }
}

// ── Init command ───────────────────────────────────────────────

const isInit = !command || command === 'init'

if (!isInit) {
  console.error(red(`  Unknown command: ${command}`))
  console.error(`  Run ${cyan('npx remyxjs --help')} for usage info.`)
  process.exit(1)
}

const force = args.includes('--force')
const skipPlugins = args.includes('--no-plugins')
const skipThemes = args.includes('--no-themes')

const projectRoot = cwd()
const remyxDir = resolve(projectRoot, 'remyxjs')

console.log('')
console.log(bold('  Remyx Editor - Project Setup'))
console.log('')

// 1. Create remyxjs/ root
ensureDir(remyxDir)

// 2. Plugins
const pluginsDir = join(remyxDir, 'plugins')
const pluginsCreated = ensureDir(pluginsDir)
if (pluginsCreated) {
  console.log(green('  + Created remyxjs/plugins/'))
} else {
  console.log(dim('  ~ remyxjs/plugins/ already exists'))
}

// Copy plugins autoloader
const pluginsIndexSrc = join(TEMPLATES, 'plugins-index.js')
const pluginsIndexDest = join(pluginsDir, 'index.js')
if (writeIfNew(pluginsIndexDest, readFileSync(pluginsIndexSrc, 'utf8'), force)) {
  console.log(green('  + Created remyxjs/plugins/index.js') + dim(' (auto-loader)'))
} else {
  console.log(dim('  ~ remyxjs/plugins/index.js already exists'))
}

// Copy built-in plugin directories
if (!skipPlugins) {
  const pluginsSrcDir = join(TEMPLATES, 'plugins')
  if (existsSync(pluginsSrcDir)) {
    const pluginDirs = readdirSync(pluginsSrcDir).filter(
      f => statSync(join(pluginsSrcDir, f)).isDirectory()
    )
    let pluginCount = 0
    for (const pluginName of pluginDirs) {
      const src = join(pluginsSrcDir, pluginName)
      const dest = join(pluginsDir, pluginName)
      if (!existsSync(dest) || force) {
        copyRecursive(src, dest, force)
        pluginCount++
      }
    }
    if (pluginCount > 0) {
      console.log(green(`  + Copied ${pluginCount} built-in plugins`))
    } else {
      console.log(dim(`  ~ All ${pluginDirs.length} built-in plugins already exist`))
    }
  }
} else {
  console.log(dim('  - Skipped built-in plugins (--no-plugins)'))
}

// 3. Themes
const themesDir = join(remyxDir, 'themes')
const themesCreated = ensureDir(themesDir)
if (themesCreated) {
  console.log(green('  + Created remyxjs/themes/'))
} else {
  console.log(dim('  ~ remyxjs/themes/ already exists'))
}

// Copy themes autoloader
const themesIndexSrc = join(TEMPLATES, 'themes-index.js')
const themesIndexDest = join(themesDir, 'index.js')
if (writeIfNew(themesIndexDest, readFileSync(themesIndexSrc, 'utf8'), force)) {
  console.log(green('  + Created remyxjs/themes/index.js') + dim(' (auto-loader)'))
} else {
  console.log(dim('  ~ remyxjs/themes/index.js already exists'))
}

// Copy built-in theme CSS files
if (!skipThemes) {
  const themesSrcDir = join(TEMPLATES, 'themes')
  if (existsSync(themesSrcDir)) {
    const themeFiles = readdirSync(themesSrcDir).filter(f => f.endsWith('.css'))
    let themeCount = 0
    for (const file of themeFiles) {
      const src = join(themesSrcDir, file)
      const dest = join(themesDir, file)
      if (!existsSync(dest) || force) {
        copyFileSync(src, dest)
        themeCount++
      }
    }
    if (themeCount > 0) {
      console.log(green(`  + Copied ${themeCount} built-in themes`))
    } else {
      console.log(dim(`  ~ All ${themeFiles.length} built-in themes already exist`))
    }
  }
} else {
  console.log(dim('  - Skipped built-in themes (--no-themes)'))
}

// 4. Config
const configDir = join(remyxDir, 'config')
const configCreated = ensureDir(configDir)
if (configCreated) {
  console.log(green('  + Created remyxjs/config/'))
} else {
  console.log(dim('  ~ remyxjs/config/ already exists'))
}

// Copy default config
const configSrc = join(TEMPLATES, 'default-config.json')
const configDest = join(configDir, 'default.json')
if (writeIfNew(configDest, readFileSync(configSrc, 'utf8'), force)) {
  console.log(green('  + Created remyxjs/config/default.json'))
} else {
  console.log(dim('  ~ remyxjs/config/default.json already exists'))
}

// Done
console.log('')
console.log(bold(green('  Done!')) + ' Your remyxjs directory is ready.')
console.log('')
console.log(dim('  Next steps:'))
console.log(`    ${cyan('1.')} Edit ${bold('remyxjs/config/default.json')} to customize your editor`)
console.log(`    ${cyan('2.')} Add/remove plugin folders in ${bold('remyxjs/plugins/')} to manage plugins`)
console.log(`    ${cyan('3.')} Add/remove theme CSS files in ${bold('remyxjs/themes/')} to manage themes`)
console.log(`    ${cyan('4.')} Use in your app:`)
console.log('')
console.log(dim('       import { RemyxEditor } from \'@remyxjs/react\''))
console.log(dim('       <RemyxEditor config="default" />'))
console.log('')
