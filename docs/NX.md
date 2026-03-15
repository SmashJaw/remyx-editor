![Remyx Editor](./images/Remyx-Logo.svg)

# Nx Workspace Guide

This monorepo uses [Nx](https://nx.dev) for task orchestration, caching, and package publishing. Nx sits on top of npm workspaces and manages the build graph, so packages are built in the correct dependency order automatically.

---

## Quick Reference

| Command | What it does |
|---|---|
| `npm run build:all` | Build all packages (dependency-aware) |
| `npm run build:core` | Build `@remyx/core` only |
| `npm run build:react` | Build `@remyx/react` (builds core first) |
| `npm run test` | Run tests across all packages |
| `npm run lint` | Lint all packages |
| `npm run graph` | Open the interactive dependency graph |
| `npm run affected:build` | Build only packages affected by recent changes |
| `npm run affected:test` | Test only packages affected by recent changes |
| `npm run release:dry` | Preview a release without publishing |
| `npm run release` | Version, changelog, and publish to npm |

---

## Project Structure

Nx discovers projects via `project.json` files in each package:

```
packages/
  remyx-core/       @remyx/core       project.json   (library)
  remyx-react/      @remyx/react      project.json   (library)
  create-remyx/     create-remyx      project.json   (application)
```

The dependency graph is:

```
@remyx/react  ──depends on──▶  @remyx/core
create-remyx  (standalone CLI, no build step)
```

When you run `npx nx build remyx-react`, Nx automatically builds `remyx-core` first because of the `dependsOn: ["^build"]` configuration.

---

## Nx Targets

Each package defines targets in its `project.json`. Available targets:

### `@remyx/core`
- **build** — `vite build` (ES + CJS output to `dist/`)
- **dev** — `vite build --watch` (rebuilds on file changes)
- **lint** — ESLint on `packages/remyx-core/src`
- **test** — Jest unit tests for core (`jest --selectProjects remyx-core`)
- **analyze** — Bundle visualization with `rollup-plugin-visualizer`

### `@remyx/react`
- **build** — `vite build` (depends on `remyx-core:build`)
- **dev** — `vite build --watch`
- **lint** — ESLint on `packages/remyx-react/src`
- **test** — Jest unit tests for react (`jest --selectProjects remyx-react`)
- **analyze** — Bundle visualization

### `create-remyx`
- **lint** — ESLint on `index.js`

---

## Running Tasks

### Single project

```bash
npx nx build remyx-core
npx nx lint remyx-react
npx nx test remyx-core
```

### All projects

```bash
npx nx run-many -t build
npx nx run-many -t lint
npx nx run-many -t test
npx nx run-many -t build lint test    # multiple targets at once
```

### Only affected projects

After making changes, run tasks only on packages affected since the last commit:

```bash
npx nx affected -t build
npx nx affected -t test
npx nx affected -t lint
```

To compare against a specific branch or commit:

```bash
npx nx affected -t build --base=master --head=HEAD
```

---

## Caching

Nx caches task results automatically. When you run a target and the inputs haven't changed, Nx replays the cached output instantly instead of re-running the command.

Cache is stored locally in `.nx/cache/` (gitignored).

To clear the cache:

```bash
npx nx reset
```

---

## Dependency Graph

Visualize the project dependency graph in your browser:

```bash
npm run graph
# or
npx nx graph
```

This opens an interactive visualization showing which packages depend on which.

---

## Publishing to npmjs.org

### First-Time Setup

1. **Create an npm account** at [npmjs.com/signup](https://www.npmjs.com/signup)

2. **Log in from your terminal:**
   ```bash
   npm login
   ```
   This stores your auth token in `~/.npmrc`.

3. **Create the `@remyx` org** on npm (if not already created):
   - Go to [npmjs.com/org/create](https://www.npmjs.com/org/create)
   - Create the `remyx` organization
   - Scoped packages under `@remyx/*` require an org or paid account

4. **Verify your packages have the correct metadata** in each `package.json`:
   - `name` — Must match the npm package name (`@remyx/core`, `@remyx/react`, `create-remyx`)
   - `version` — Will be managed by Nx release
   - `files` — Array of files/directories to include in the published tarball
   - `main`, `module`, `exports` — Entry points for consumers
   - `license` — `MIT`
   - `repository`, `bugs`, `homepage` — Links back to the repo

### Dry Run (Preview)

Always preview before publishing:

```bash
npm run release:dry
```

This shows you exactly what would happen — version bumps, changelog entries, and npm publish commands — without actually doing anything.

### Publishing a Release

```bash
npm run release
```

This runs `npx nx release` which:

1. **Builds all packages** (pre-version command ensures fresh dist)
2. **Prompts for version bump** — patch, minor, major, or custom
3. **Updates `package.json` versions** in each package
4. **Publishes to npm** — each package is published individually

### Publishing Individual Packages

To version and publish a single package:

```bash
npx nx release --projects=remyx-core
npx nx release --projects=remyx-react
npx nx release --projects=create-remyx
```

### Manual Publishing (Without Nx Release)

If you prefer full manual control:

```bash
# 1. Build everything
npm run build:all

# 2. Bump versions in each package.json manually

# 3. Publish each package
cd packages/remyx-core && npm publish --access public
cd packages/remyx-react && npm publish --access public
cd packages/create-remyx && npm publish --access public
```

The `--access public` flag is required for scoped packages (`@remyx/*`) on the first publish. Subsequent publishes don't need it.

### Publish Order

Because `@remyx/react` depends on `@remyx/core`, always publish in this order:

1. `@remyx/core`
2. `@remyx/react`
3. `create-remyx` (independent, can go anytime)

Nx release handles this automatically when you run `npm run release`.

---

## Version Management

The project uses **independent versioning** — each package has its own version number:

| Package | Current Version |
|---|---|
| `@remyx/core` | 0.24.0 |
| `@remyx/react` | 0.24.0 |
| `create-remyx` | 0.23.4 |

### Bumping Versions with Nx

```bash
# Interactive — prompts for bump type per package
npx nx release version

# Specific bump type for all packages
npx nx release version --specifier=patch
npx nx release version --specifier=minor
npx nx release version --specifier=major

# Specific version
npx nx release version --specifier=1.0.0

# Single package
npx nx release version --projects=remyx-core --specifier=patch
```

---

## CI Integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint, build, and test on every push and PR. To add automated publishing on tagged releases, add a publish job:

```yaml
# Add to .github/workflows/ci.yml
publish:
  needs: build
  if: startsWith(github.ref, 'refs/tags/v')
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        registry-url: https://registry.npmjs.org
    - run: npm ci
    - run: npm run build:all
    - run: cd packages/remyx-core && npm publish --access public
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
    - run: cd packages/remyx-react && npm publish --access public
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
    - run: cd packages/create-remyx && npm publish --access public
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

To set up the npm token:
1. Generate a token at [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens) (use "Automation" type)
2. Add it as a repository secret named `NPM_TOKEN` in GitHub Settings > Secrets

---

## Troubleshooting

### "Cache miss" on every run
Make sure `.nx/` is in your `.gitignore` but not being deleted between runs.

### Build order issues
Run `npx nx graph` to verify the dependency graph is correct. The `dependsOn: ["^build"]` in `remyx-react/project.json` ensures core builds first.

### Stale cache after config changes
```bash
npx nx reset
```

### npm publish 403 error
- Verify you're logged in: `npm whoami`
- Verify org membership: `npm org ls remyx`
- Use `--access public` for first publish of scoped packages
- Check that the package name isn't taken: `npm view @remyx/core`

### npm publish 402 error
Scoped packages require either a paid npm account or an organization. Create the `@remyx` org at [npmjs.com/org/create](https://www.npmjs.com/org/create).
