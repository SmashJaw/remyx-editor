# Performance Benchmark

> Measured on 2026-03-20 at commit `1328a5d` (v1.2.0-beta).
> Environment: Apple M3 Max, 48 GB RAM, Node v24.2.0, Vite 7.3.1, Vitest 4.1.0
>
> **v1.2.0-beta update**: This release includes 50 bug fixes identified during a comprehensive code audit. Benchmark numbers remain approximately the same as the prior measurement.

---

## Codebase Overview

| Metric | Count |
|---|---|
| Source files (core JS) | 113 |
| Source files (core CSS) | 14 |
| Source files (react JSX/JS) | 75 |
| Test files | 73 |
| Total source files | 275 |

---

## Build Performance

All times are wall-clock averages over 3 runs.

| Build Target | Modules | Time (avg) |
|---|---|---|
| `@remyxjs/core` | 124 | **1.5s** |
| `@remyxjs/react` | 88 | **0.9s** |
| `build:all` (core + react) | 212 | **2.4s** |

### Build Output

| Target | Format | Minified | Gzipped |
|---|---|---|---|
| `@remyxjs/core` main chunk | ESM | 270.00 KB | 77.98 KB |
| `@remyxjs/core` entry | ESM | 6.24 KB | 2.73 KB |
| `@remyxjs/core` CSS | — | 86.72 KB | 14.46 KB |
| `@remyxjs/react` main chunk | ESM | 113.73 KB | 31.41 KB |
| `@remyxjs/react` entry | ESM | 0.74 KB | 0.42 KB |
| `@remyxjs/react` CSS | — | 2.29 KB | 0.89 KB |

### Code-Split Chunks (ESM)

#### @remyxjs/core — Document Converters

| Chunk | Size | Gzipped |
|---|---|---|
| `convertPdf` | 0.99 KB | 0.56 KB |
| `convertCsv` | 0.84 KB | 0.50 KB |
| `convertRtf` | 0.74 KB | 0.42 KB |
| `convertText` | 0.28 KB | 0.24 KB |
| `convertDocx` | 0.23 KB | 0.20 KB |
| `convertMarkdown` | 0.18 KB | 0.17 KB |
| `convertHtml` | 0.14 KB | 0.15 KB |

#### @remyxjs/core — Plugin Lazy Chunks

| Chunk | Size | Gzipped |
|---|---|---|
| 17 plugin chunks | 0.11–0.41 KB each | 0.12–0.28 KB |

#### @remyxjs/react — Lazy-Loaded Modals

| Chunk | Size | Gzipped |
|---|---|---|
| `SourceModal` | 7.11 KB | 2.46 KB |
| `MenuBar` | 5.57 KB | 1.83 KB |
| `CommandPalette` | 4.36 KB | 1.74 KB |
| `ImageModal` | 4.17 KB | 1.52 KB |
| `FindReplaceModal` | 3.57 KB | 1.29 KB |
| `AttachmentModal` | 3.54 KB | 1.34 KB |
| `ImportDocumentModal` | 3.19 KB | 1.19 KB |
| `EmbedModal` | 2.83 KB | 1.29 KB |
| `TablePickerModal` | 2.81 KB | 1.04 KB |
| `LinkModal` | 2.48 KB | 1.01 KB |
| `ModalOverlay` | 1.97 KB | 0.90 KB |
| `ContextMenu` | 1.87 KB | 0.93 KB |
| `ExportModal` | 1.82 KB | 0.68 KB |

---

## Bundle Size Summary

| Package | JS entry + main (min) | JS (gzip) | CSS (gzip) |
|---|---|---|---|
| `@remyxjs/core` | 276.24 KB | 80.71 KB | 14.46 KB |
| `@remyxjs/react` | 114.47 KB | 31.83 KB | 0.89 KB |
| **Library total** | **390.71 KB** | **112.54 KB** | **15.35 KB** |

> Note: The core bundle grew from 75 KB to 276 KB (minified) between v0.24.0 and v1.2.0-beta due to 17 built-in plugins, collaboration engine, spellcheck, analytics, and math rendering. Gzipped size is 80.71 KB. All plugins are tree-shakeable — consumers who import only what they need get much smaller bundles.

---

## Test Performance

| Metric | Value |
|---|---|
| Test suites | 73 |
| Total tests | 1,783 |
| Run 1 | 3.40s |
| Run 2 | 3.39s |
| Run 3 | 3.34s |
| **Average** | **3.38s** |
| Tests per second | ~527 |
| Runner | Vitest 4.1.0 (jsdom) |

---

## Lint Performance

| Metric | Value |
|---|---|
| ESLint time | ~4s |
| Errors | 206 |
| Warnings | 1 |

> Most errors are `no-undef` (Node.js globals in config files) and `react-hooks` rule violations from complex hook patterns. These do not affect runtime behavior.

---

## Dependency Footprint

| Metric | Value |
|---|---|
| `node_modules` size | 224 MB |
| Installed packages | 274 |

---

## Key Observations

1. **Fast builds**: Both packages build in under 2s each. Full monorepo build completes in ~2.4s (Vite 7 + esbuild).

2. **Growing but reasonable bundle**: The library ships 112.54 KB gzipped JS + 15.35 KB gzipped CSS. This is larger than v0.24.0 (34.64 KB gzip) due to 17 plugins, but competitive for a full-featured editor with collaboration, math, spellcheck, and analytics built in.

3. **Effective code-splitting**: 7 document converters, 17 plugin lazy chunks, and 13 modal dialogs are all code-split. The critical path only loads what's used.

4. **CSS consolidation**: Theme CSS grew from 26.54 KB to 86.72 KB (14.46 KB gzipped) after adding styles for 17 plugins, toast notifications, focus indicators, reduced-motion, and high-contrast mode support.

5. **Fast test suite**: 1,783 tests run in ~3.4s with Vitest 4.1's parallel workers. Test count grew from 1,768 (v0.39.0) to 1,783 (v1.2.0-beta) from new plugin resolver and UX tests.

6. **Smaller node_modules**: Down from 250 MB / 383 packages to 224 MB / 274 packages.

---

## Version History

| Version | Tests | Core JS (gzip) | Core CSS (gzip) | React JS (gzip) |
|---|---|---|---|---|
| v0.24.0 | 1,314 | 21.30 KB | 5.22 KB | 13.34 KB |
| v0.39.0 | 1,783 | 77.98 KB | 14.46 KB | 31.41 KB |
| v1.2.0-beta | 1,783 | 80.71 KB | 14.46 KB | 31.83 KB |

---

## Improvement Opportunities

| Area | Current | Target | Effort |
|---|---|---|---|
| Core bundle size | 80.71 KB gzip | Externalize collaboration/math/analytics as opt-in | Medium |
| ESLint errors | 206 | 0 (add Node globals config, fix hook patterns) | Low-Medium |
| CSS size | 14.46 KB gzip | Split plugin CSS into per-plugin files | Medium |
| Test speed | 3.38s | <2s with test sharding | Low |
