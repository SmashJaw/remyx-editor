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

// ── Readline prompt ─────────────────────────────────────────────

function createPrompt() {
  const rl = createInterface({ input: stdin, output: stdout })
  const ask = (question) =>
    new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())))
  const close = () => rl.close()
  return { ask, close }
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  const projectArg = argv[2]

  console.log()
  console.log(bold(cyan('  create-remyx')) + dim(' v0.23.4'))
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

  // 3. Install heavy optional deps?
  console.log()
  console.log(bold('  Optional features:'))
  console.log(`    PDF & DOCX import requires ${dim('pdfjs-dist')} and ${dim('mammoth')} (~5 MB)`)
  console.log()
  const includeDocsRaw = await ask(bold('  Include PDF/DOCX import? (y/N): ') + dim('(N) '))
  const includeDocs = includeDocsRaw.toLowerCase() === 'y' || includeDocsRaw.toLowerCase() === 'yes'

  close()

  // ── Scaffold ────────────────────────────────────────────────

  const targetDir = resolve(cwd(), projectName)

  console.log()
  console.log(`  ${bold('Scaffolding')} ${cyan(projectName)} ...`)
  console.log()

  // Copy template
  const templateDir = join(__dirname, 'templates', variant)
  copyDir(templateDir, targetDir)

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

  if (useTypeScript) {
    console.log(dim(`  TypeScript types included via @remyx/react (ships .d.ts declarations)`))
  } else {
    console.log(dim(`  Tip: switch to TypeScript later by renaming .jsx -> .tsx and adding tsconfig.json`))
  }
  console.log()
}

// ── Helpers ──────────────────────────────────────────────────────

function buildPackageJson(name, useTypeScript, includeDocs) {
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
      '@remyx/core': '^0.23.4',
      '@remyx/react': '^0.23.4',
      react: '^19.2.0',
      'react-dom': '^19.2.0',
    },
    devDependencies: {
      '@vitejs/plugin-react': '^5.1.1',
      vite: '^7.3.1',
    },
  }

  if (useTypeScript) {
    pkg.devDependencies['typescript'] = '^5.8.0'
    pkg.devDependencies['@types/react'] = '^19.2.7'
    pkg.devDependencies['@types/react-dom'] = '^19.2.3'
  }

  if (includeDocs) {
    // These are peer/optional deps of @remyx/core for document import
    pkg.dependencies['pdfjs-dist'] = '^5.5.207'
    pkg.dependencies['mammoth'] = '^1.11.0'
  }

  // Sort devDependencies
  pkg.devDependencies = Object.fromEntries(
    Object.entries(pkg.devDependencies).sort(([a], [b]) => a.localeCompare(b)),
  )

  return pkg
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry)
    const destPath = join(dest, entry)
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      writeFileSync(destPath, readFileSync(srcPath))
    }
  }
}

main().catch((err) => {
  console.error(red(`\n  Error: ${err.message}\n`))
  exit(1)
})
