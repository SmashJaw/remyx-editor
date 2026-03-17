# Nx Monorepo Management

This document covers how to use [Nx](https://nx.dev) to build, version, publish, and manage the Remyx Editor monorepo.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Building Packages](#building-packages)
  - [Build All Packages](#build-all-packages)
  - [Build a Single Package](#build-a-single-package)
  - [Build Only Affected Packages](#build-only-affected-packages)
- [Versioning & Publishing](#versioning--publishing)
  - [Full Release (Version + Changelog + Publish)](#full-release-version--changelog--publish)
  - [Dry Run a Release](#dry-run-a-release)
  - [Version Only](#version-only)
  - [Publish Only](#publish-only)
  - [Publish a Single Package](#publish-a-single-package)
  - [First Release](#first-release)
  - [Prerelease Versions](#prerelease-versions)
- [Affected Commands](#affected-commands)
- [Task Caching](#task-caching)
  - [How Caching Works](#how-caching-works)
  - [Skip Cache](#skip-cache)
  - [Reset Cache](#reset-cache)
- [Dependency Graph](#dependency-graph)
- [Project Configuration](#project-configuration)
  - [nx.json Overview](#nxjson-overview)
  - [Adding a New Package](#adding-a-new-package)
- [CI Integration](#ci-integration)
- [Troubleshooting](#troubleshooting)
- [Useful Commands Reference](#useful-commands-reference)

---

## Overview

Nx is configured as a lightweight layer on top of the existing npm workspaces monorepo. It provides:

- **Task orchestration** — Builds packages in dependency order (`@remyx/core` before `@remyx/react`)
- **Caching** — Skips unchanged builds, tests, and lints
- **Affected detection** — Only rebuilds/retests packages touched by a git diff
- **Release management** — Versioning, changelog generation, and npm publishing in one command
- **Dependency graph** — Visual dependency map of all packages

### Detected Projects

| Nx Project | npm Package | Targets |
| --- | --- | --- |
| `@remyx/core` | `@remyx/core` | build, dev, nx-release-publish |
| `@remyx/react` | `@remyx/react` | build, dev, nx-release-publish |
| `create-remyx` | `create-remyx` | nx-release-publish |

### Dependency Order

```
@remyx/core  →  @remyx/react
                create-remyx (independent)
```

`@remyx/react` depends on `@remyx/core`, so nx always builds core first. `create-remyx` has no build step and is independent.

---

## Setup

Nx is already installed. After cloning the repo, just run:

```bash
npm install
```

This installs nx and all plugins (`@nx/js`, `@nx/eslint`, `@nx/jest`) as devDependencies.

To verify the setup:

```bash
npx nx show projects        # List all detected projects
npx nx show project @remyx/core  # Show targets for a project
```

---

## Building Packages

### Build All Packages

```bash
npm run build:all
# or directly:
npx nx run-many --target=build
```

Nx builds `@remyx/core` first (because `@remyx/react` depends on it), then `@remyx/react` in parallel if possible. `create-remyx` is skipped since it has no build target.

### Build a Single Package

```bash
npx nx run @remyx/core:build
npx nx run @remyx/react:build
```

Or use the shorthand:

```bash
npx nx build @remyx/core
npx nx build @remyx/react
```

When you build `@remyx/react`, nx automatically builds `@remyx/core` first if it's out of date (because of the `dependsOn: ["^build"]` configuration).

### Build Only Affected Packages

```bash
npm run affected:build
# or:
npx nx affected --target=build
```

This compares your current branch against `main` and only builds packages whose source files (or dependencies' source files) have changed. Useful in CI to avoid rebuilding everything.

You can change the comparison base:

```bash
# Compare against a specific commit
npx nx affected --target=build --base=abc123

# Compare against a specific branch
npx nx affected --target=build --base=develop

# Compare HEAD~1 (last commit)
npx nx affected --target=build --base=HEAD~1
```

---

## Versioning & Publishing

Nx release handles three steps: **version** (bump package.json versions), **changelog** (generate changelogs), and **publish** (push to npm registry).

### Prerequisites

Before publishing, ensure you are:
1. Logged into npm: `npm login`
2. On a clean git working tree (no uncommitted changes)
3. On the `main` branch (or your release branch)
4. All packages are built: `npm run build:all`

### Full Release (Version + Changelog + Publish)

```bash
npm run release
# or:
npx nx release
```

This runs all three steps interactively:

1. **Version** — Determines version bumps from conventional commits (or prompts you for a semver keyword)
2. **Changelog** — Generates/updates changelogs for each package and the workspace
3. **Publish** — Asks for confirmation, then publishes all packages to npm

You can also specify the version bump explicitly:

```bash
npx nx release patch    # 0.27.0 → 0.27.1
npx nx release minor    # 0.27.0 → 0.28.0
npx nx release major    # 0.27.0 → 1.0.0
```

### Dry Run a Release

Preview what would happen without making any changes:

```bash
npm run release:dry-run
# or:
npx nx release --dry-run
```

This shows you:
- What version each package would be bumped to
- What the changelog entries would look like
- What packages would be published

**Always dry-run before a real release.**

### Version Only

Bump versions in `package.json` files without publishing:

```bash
npm run release:version
# or:
npx nx release version
npx nx release version minor
npx nx release version 1.0.0   # exact version
```

This updates `package.json` version fields, commits the change, and creates git tags.

### Publish Only

Publish already-versioned packages to npm without bumping versions:

```bash
npm run release:publish
# or:
npx nx release publish
```

This runs `npm publish` for each package in the release configuration. Packages are published in dependency order (`@remyx/core` first).

### Publish a Single Package

```bash
npx nx run @remyx/core:nx-release-publish
npx nx run @remyx/react:nx-release-publish
npx nx run create-remyx:nx-release-publish
```

The `nx-release-publish` target automatically runs `build` first (configured in `dependsOn`).

### First Release

If this is the first time publishing (no existing versions on npm):

```bash
npx nx release --first-release
```

The `--first-release` flag tells nx:
- Don't look for previous git tags to determine the current version
- Don't check if the package already exists on the registry
- Use the version on disk as the starting point

### Prerelease Versions

```bash
# Create a beta prerelease
npx nx release prerelease --preid=beta
# 0.25.0 → 0.26.0-beta.0

# Create an alpha prerelease
npx nx release prerelease --preid=alpha
# 0.25.0 → 0.26.0-alpha.0

# Bump an existing prerelease
npx nx release prerelease
# 0.26.0-beta.0 → 0.26.0-beta.1
```

### Release a Subset of Projects

```bash
# Only release core
npx nx release --projects=@remyx/core

# Release core and react, skip create-remyx
npx nx release --projects=@remyx/core,@remyx/react
```

---

## Affected Commands

Nx can detect which packages are affected by your changes (compared to the `main` branch) and only run tasks for those:

```bash
# Build only affected packages
npm run affected:build
npx nx affected --target=build

# Test only affected packages
npm run affected:test
npx nx affected --target=test

# Lint only affected packages
npm run affected:lint
npx nx affected --target=lint

# Run multiple targets for affected packages
npx nx affected --targets=lint,build,test
```

Affected detection works by:
1. Computing a git diff between your branch and `main`
2. Mapping changed files to their owning project
3. Including all downstream dependents (e.g., changing `@remyx/core` also affects `@remyx/react`)

---

## Task Caching

### How Caching Works

Nx caches the output of `build`, `lint`, and `test` tasks. When you re-run a task and the inputs haven't changed, nx replays the cached output instead of running the task again.

**What determines cache hits:**
- Source files in the project (`{projectRoot}/**/*`)
- Source files in dependency projects (for `build` and `test`)
- Shared globals (root `package.json`)
- The task configuration itself

**What's excluded from cache inputs (production builds):**
- Test files (`*.test.js`, `*.spec.js`)
- Coverage directories
- ESLint config files

### Skip Cache

Force a fresh run, ignoring cached results:

```bash
npx nx run-many --target=build --skip-nx-cache
npx nx run @remyx/core:build --skip-nx-cache
```

### Reset Cache

Clear the entire cache:

```bash
npx nx reset
```

This removes all cached task outputs and the nx daemon state. Use this if you suspect cache corruption.

---

## Dependency Graph

Visualize the project dependency graph in your browser:

```bash
npm run graph
# or:
npx nx graph
```

This opens an interactive visualization showing:
- All projects and their relationships
- Which projects are affected by your changes
- Task pipeline execution order

You can also export the graph as JSON:

```bash
npx nx graph --file=graph.json
```

---

## Project Configuration

### nx.json Overview

The `nx.json` file at the repo root configures nx behavior:

```json
{
  "defaultBase": "main",
  "namedInputs": { ... },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],  // Build dependencies first
      "cache": true              // Cache build outputs
    },
    "nx-release-publish": {
      "dependsOn": ["build"]    // Build before publishing
    }
  },
  "release": {
    "projects": ["@remyx/core", "@remyx/react", "create-remyx"],
    "projectsRelationship": "independent",
    "version": { "conventionalCommits": true },
    "changelog": { ... },
    "git": { "commit": true, "tag": true }
  }
}
```

Key settings:

| Setting | Value | Purpose |
| --- | --- | --- |
| `defaultBase` | `main` | Branch used for affected comparisons |
| `targetDefaults.build.dependsOn` | `["^build"]` | Build dependencies before the project |
| `targetDefaults.build.cache` | `true` | Enable build caching |
| `release.projectsRelationship` | `independent` | Packages can have different versions |
| `release.version.conventionalCommits` | `true` | Determine bumps from commit messages |
| `release.git.commit` | `true` | Auto-commit version bumps |
| `release.git.tag` | `true` | Auto-create git tags |

### Adding a New Package

When you add a new package to `packages/`:

1. Create the package directory with a `package.json`
2. Nx auto-detects it (no `project.json` needed)
3. Add it to the `release.projects` array in `nx.json` if it should be published
4. If it depends on other workspace packages, add them as dependencies in its `package.json` — nx infers the dependency graph

```bash
# Verify the new package is detected
npx nx show projects
npx nx show project my-new-package
```

---

## CI Integration

### GitHub Actions Example

Use affected commands in CI to only build/test what changed:

```yaml
name: CI
on: [push, pull_request]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for affected detection

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: npm ci

      # Only lint, build, and test affected packages
      - run: npx nx affected --target=lint
      - run: npx nx affected --target=build
      - run: npx nx affected --target=test
```

### Publishing from CI

```yaml
name: Release
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version bump (patch, minor, major)'
        required: true
        type: choice
        options: [patch, minor, major]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org

      - run: npm ci
      - run: npx nx release ${{ inputs.version }} --yes
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The `--yes` flag skips the interactive confirmation prompt, which is necessary in CI.

---

## Troubleshooting

### "Project not found"

```bash
npx nx show projects  # Verify the project name
```

Project names come from the `name` field in each `package.json`. Use the full scoped name: `@remyx/core`, not `remyx-core`.

### Cache producing stale results

```bash
npx nx reset          # Clear all caches
npx nx run-many --target=build --skip-nx-cache  # Rebuild without cache
```

### Build order wrong

Nx infers the dependency graph from `package.json` dependencies. Verify the graph:

```bash
npx nx graph
```

If `@remyx/react` doesn't depend on `@remyx/core` in its `package.json`, nx won't know to build core first.

### "Cannot publish — package already exists"

If a version is already published on npm, you can't re-publish it. Bump the version first:

```bash
npx nx release version patch
npx nx release publish
```

### Publish permissions

Make sure you're logged into npm and have publish permissions for the `@remyx` scope:

```bash
npm whoami
npm access list collaborators @remyx/core
```

---

## Useful Commands Reference

| Task | Command |
| --- | --- |
| **Build all** | `npm run build:all` |
| **Build one** | `npx nx build @remyx/core` |
| **Build affected** | `npm run affected:build` |
| **Test affected** | `npm run affected:test` |
| **Lint affected** | `npm run affected:lint` |
| **Full release** | `npm run release` |
| **Dry-run release** | `npm run release:dry-run` |
| **Version only** | `npm run release:version` |
| **Publish only** | `npm run release:publish` |
| **Publish one** | `npx nx run @remyx/core:nx-release-publish` |
| **First release** | `npx nx release --first-release` |
| **Prerelease** | `npx nx release prerelease --preid=beta` |
| **Dep graph** | `npm run graph` |
| **List projects** | `npx nx show projects` |
| **Inspect project** | `npx nx show project @remyx/core` |
| **Skip cache** | `npx nx build @remyx/core --skip-nx-cache` |
| **Reset cache** | `npx nx reset` |
| **Run anything** | `npx nx run-many --target=<target>` |
