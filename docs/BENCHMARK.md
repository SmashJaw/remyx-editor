# Performance Benchmark

> Measured on 2026-03-16 at commit `08d7117` (v0.24.0). Bundle sizes and file counts updated as of v0.27.0.
> Environment: Apple M3 Max, 48 GB RAM, Node v24.2.0, Vite 7.3.1

---

## Codebase Overview

| Metric | Count |
|---|---|
| Source files (core JS) | 62 |
| Source files (core CSS) | 7 |
| Source files (react JSX/JS) | 50 |
| Test files | 52 |

---

## Build Performance

All times are wall-clock averages over 3 runs.

| Build Target | Modules | Time (avg) |
|---|---|---|
| `@remyxjs/core` | 59 | **1.1s** |
| `@remyxjs/react` | 41 | **1.0s** |
| `build:all` (core + react) | 100 | **2.1s** |
| Demo app (`vite build`) | 519 | **2.8s** |

### Build Output

| Target | Format | Minified | Gzipped |
|---|---|---|---|
| `@remyxjs/core` index | ESM | 75.95 KB | 21.30 KB |
| `@remyxjs/core` index | CJS | 77.31 KB | 21.46 KB |
| `@remyxjs/core` CSS | — | 26.54 KB | 5.22 KB |
| `@remyxjs/react` index | ESM | 49.64 KB | 13.34 KB |
| `@remyxjs/react` index | CJS | 48.35 KB | 13.27 KB |
| `@remyxjs/react` CSS | — | 2.29 KB | 0.89 KB |

### Code-Split Chunks (ESM)

#### @remyxjs/core

| Chunk | Size | Gzipped |
|---|---|---|
| `convertPdf` | 0.99 KB | 0.56 KB |
| `convertCsv` | 0.83 KB | 0.50 KB |
| `convertRtf` | 0.74 KB | 0.42 KB |
| `convertText` | 0.28 KB | 0.24 KB |
| `convertDocx` | 0.23 KB | 0.20 KB |
| `convertMarkdown` | 0.17 KB | 0.17 KB |
| `convertHtml` | 0.14 KB | 0.15 KB |

#### @remyxjs/react

| Chunk | Size | Gzipped |
|---|---|---|
| `SourceModal` | 6.55 KB | 2.16 KB |
| `AttachmentModal` | 3.04 KB | 1.21 KB |
| `ImageModal` | 3.00 KB | 1.13 KB |
| `ImportDocumentModal` | 2.69 KB | 1.03 KB |
| `FindReplaceModal` | 2.31 KB | 0.81 KB |
| `LinkModal` | 2.15 KB | 0.86 KB |
| `TablePickerModal` | 2.00 KB | 0.75 KB |
| `ModalOverlay` | 1.85 KB | 0.84 KB |
| `ExportModal` | 1.55 KB | 0.60 KB |
| `EmbedModal` | 1.28 KB | 0.66 KB |

---

## Bundle Size Summary

| Package | Dist Size | JS (min) | JS (gzip) | CSS (gzip) |
|---|---|---|---|---|
| `@remyxjs/core` | 812 KB | 75.95 KB | 21.30 KB | 5.22 KB |
| `@remyxjs/react` | 692 KB | 49.64 KB | 13.34 KB | 0.89 KB |
| **Library total** | **1.5 MB** | **125.59 KB** | **34.64 KB** | **6.11 KB** |

### Demo App Bundle

| Chunk | Size | Gzipped |
|---|---|---|
| `pdf.worker` (vendor) | 1,186.07 KB | 368.85 KB |
| `index` (React + deps) | 500.24 KB | 130.22 KB |
| `pdf` (vendor) | 405.70 KB | 120.30 KB |
| `index` (app code) | 380.00 KB | 114.78 KB |
| CSS (combined) | 28.99 KB | 6.16 KB |
| Lazy-loaded modals | 33.24 KB | 12.57 KB |
| **Demo total** | **2.5 MB** | — |

---

## Test Performance

| Metric | Value |
|---|---|
| Test suites | 52 |
| Total tests | 1314 |
| Cold run (no cache) | **2.1s** (wall: 2.2s) |
| Warm run (cached) | **1.8s** (wall: 2.0s) |
| Tests per second | ~625 (cold) / ~730 (warm) |
| Runner | Vitest 4.1 (jsdom) |

---

## Lint Performance

| Metric | Value |
|---|---|
| ESLint time | **3.3s** |
| Current errors | 23 |
| Current warnings | 0 |

---

## Dependency Footprint

| Metric | Value |
|---|---|
| `node_modules` size | 250 MB |
| Installed packages | 383 |

---

## Key Observations

1. **Fast builds**: Both library packages build in ~1s each (Vite 7 + esbuild). Full monorepo build completes in ~2.1s.

2. **Reasonable bundle sizes**: The combined library ships 34.64 KB gzipped JS + 6.11 KB gzipped CSS. This is competitive for a full-featured rich-text editor.

3. **Effective code-splitting**: All 7 document converters and 10 modal dialogs are lazy-loaded, keeping the critical path lean.

4. **PDF vendor dominance**: The demo app's 2.5 MB dist is inflated by pdf.js (~1.6 MB). The editor's own code is ~380 KB minified (114.78 KB gzipped).

5. **Fast test suite**: 1314 tests run in ~2 seconds with Vitest 4.1's parallel workers utilizing all cores.

6. **Lint issues**: 23 ESLint errors remain — primarily react-hooks rule violations (setState in effects, refs during render) from newer plugin rules.

---

## Improvement Opportunities

| Area | Current | Target | Effort |
|---|---|---|---|
| PDF vendor chunk | 1.19 MB | Externalize or on-demand CDN load | Medium |
| Demo app > 500 KB chunk warning | 500.24 KB | Split React vendor with `manualChunks` | Low |
| ESLint errors | 23 | 0 | Low-Medium |
| `node_modules` | 250 MB | Audit unused deps, consider `--omit=optional` | Low |
