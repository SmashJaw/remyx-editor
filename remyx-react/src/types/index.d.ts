import type { CSSProperties, RefObject, ReactNode } from 'react'

// Re-export core types
export * from '@remyx/core'

// ── Editor Engine (from @remyx/core) ──────────────────────────────

export interface EditorEngine {
  element: HTMLElement
  eventBus: EventBus
  selection: Selection
  keyboard: KeyboardManager
  commands: CommandRegistry
  history: History
  sanitizer: Sanitizer
  clipboard: Clipboard
  dragDrop: DragDrop
  plugins: PluginManager
  outputFormat: 'html' | 'markdown'
  isSourceMode: boolean

  init(): void
  destroy(): void
  getHTML(): string
  setHTML(html: string): void
  getText(): string
  isEmpty(): boolean
  focus(): void
  blur(): void
  executeCommand(name: string, ...args: unknown[]): unknown
  getWordCount(): number
  getCharCount(): number
  on(event: string, handler: (...args: unknown[]) => void): void
  off(event: string, handler: (...args: unknown[]) => void): void
}

export interface EventBus {
  on(event: string, handler: (...args: unknown[]) => void): void
  off(event: string, handler: (...args: unknown[]) => void): void
  emit(event: string, ...args: unknown[]): void
  removeAllListeners(): void
}

// ── Menu Bar ──────────────────────────────────────────────────────

export interface MenuBarConfig {
  label: string
  items: (string | MenuBarConfig | '---')[]
}

// ── Plugin ────────────────────────────────────────────────────────

export interface PluginCommand {
  name: string
  execute: (engine: EditorEngine, ...args: unknown[]) => void
  isActive?: (engine: EditorEngine) => boolean
  shortcut?: string
  meta?: Record<string, unknown>
}

export interface PluginToolbarItem {
  name: string
  type?: 'button' | 'dropdown' | 'color-picker'
  icon?: string
  tooltip?: string
  group?: number
}

export interface PluginStatusBarItem {
  name: string
  render: (engine: EditorEngine) => string
}

export interface PluginContextMenuItem {
  name: string
  label: string
  icon?: string
  action: (engine: EditorEngine) => void
  isVisible?: (engine: EditorEngine) => boolean
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

// ── Sanitizer ─────────────────────────────────────────────────────

export interface SanitizeOptions {
  allowedTags?: Record<string, string[]>
  allowedStyles?: string[]
}

// ── Autosave ─────────────────────────────────────────────────────

export interface StorageProvider {
  save(key: string, content: string, metadata?: Record<string, unknown>): Promise<void>
  load(key: string): Promise<{ content: string; timestamp: number } | null>
  clear(key: string): Promise<void>
}

export interface CloudProviderConfig {
  endpoint: string
  headers?: Record<string, string>
  method?: string
  fetchFn?: typeof fetch
  buildUrl?: (key: string) => string
  buildBody?: (key: string, content: string) => string | FormData
  buildLoadUrl?: (key: string) => string
  buildDeleteUrl?: (key: string) => string
}

export interface FileSystemProviderConfig {
  writeFn: (key: string, data: string) => Promise<void>
  readFn: (key: string) => Promise<string | null>
  deleteFn: (key: string) => Promise<void>
}

export interface AutosaveConfig {
  enabled?: boolean
  interval?: number
  debounce?: number
  provider?: 'localStorage' | 'sessionStorage' | StorageProvider | CloudProviderConfig | FileSystemProviderConfig
  key?: string
  onRecover?: (data: { recoveredContent: string; timestamp: number }) => void
  showRecoveryBanner?: boolean
  showSaveStatus?: boolean
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

export declare class AutosaveManager {
  constructor(engine: EditorEngine, options?: AutosaveConfig)
  init(): void
  destroy(): void
  save(): Promise<void>
  checkRecovery(currentContent: string): Promise<{ recoveredContent: string; timestamp: number } | null>
  clearRecovery(): Promise<void>
}

export declare class LocalStorageProvider implements StorageProvider {
  constructor(options?: { prefix?: string })
  save(key: string, content: string, metadata?: Record<string, unknown>): Promise<void>
  load(key: string): Promise<{ content: string; timestamp: number } | null>
  clear(key: string): Promise<void>
  saveSync(key: string, content: string, metadata?: Record<string, unknown>): boolean
}

export declare class SessionStorageProvider implements StorageProvider {
  constructor(options?: { prefix?: string })
  save(key: string, content: string, metadata?: Record<string, unknown>): Promise<void>
  load(key: string): Promise<{ content: string; timestamp: number } | null>
  clear(key: string): Promise<void>
  saveSync(key: string, content: string, metadata?: Record<string, unknown>): boolean
}

export declare class FileSystemProvider implements StorageProvider {
  constructor(options: FileSystemProviderConfig)
  save(key: string, content: string, metadata?: Record<string, unknown>): Promise<void>
  load(key: string): Promise<{ content: string; timestamp: number } | null>
  clear(key: string): Promise<void>
}

export declare class CloudProvider implements StorageProvider {
  constructor(options: CloudProviderConfig)
  save(key: string, content: string, metadata?: Record<string, unknown>): Promise<void>
  load(key: string): Promise<{ content: string; timestamp: number } | null>
  clear(key: string): Promise<void>
}

export declare class CustomProvider implements StorageProvider {
  constructor(options: { save: StorageProvider['save']; load: StorageProvider['load']; clear: StorageProvider['clear'] })
  save(key: string, content: string, metadata?: Record<string, unknown>): Promise<void>
  load(key: string): Promise<{ content: string; timestamp: number } | null>
  clear(key: string): Promise<void>
}

export declare function createStorageProvider(
  config?: string | StorageProvider | CloudProviderConfig | FileSystemProviderConfig | { prefix?: string },
): StorageProvider

export declare function useAutosave(
  engine: EditorEngine | null,
  config?: AutosaveConfig,
): {
  saveStatus: SaveStatus
  lastSaved: number | null
  recoveryData: { recoveredContent: string; timestamp: number } | null
  recoverContent: () => void
  dismissRecovery: () => void
}

// ── RemyxEditor Props ─────────────────────────────────────────────

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
  commandPalette?: boolean
  autosave?: boolean | AutosaveConfig
  plugins?: Plugin[]
  uploadHandler?: (file: File) => Promise<string>
  shortcuts?: Record<string, string>
  sanitize?: SanitizeOptions
  attachTo?: RefObject<HTMLElement>
  onReady?: (engine: EditorEngine) => void
  onFocus?: () => void
  onBlur?: () => void
  className?: string
  style?: CSSProperties
}

// ── React Component ───────────────────────────────────────────────

export declare const RemyxEditor: React.FC<RemyxEditorProps>

// ── React Hooks ───────────────────────────────────────────────────

export interface UseRemyxEditorReturn {
  engine: EditorEngine | null
  containerRef: RefObject<HTMLDivElement>
  editableRef: RefObject<HTMLDivElement>
  ready: boolean
}

export interface UseRemyxEditorOptions {
  onChange?: (content: string) => void
  outputFormat?: 'html' | 'markdown'
  placeholder?: string
  theme?: 'light' | 'dark'
  height?: number
  readOnly?: boolean
  plugins?: Plugin[]
  uploadHandler?: (file: File) => Promise<string>
  shortcuts?: Record<string, string>
  sanitize?: SanitizeOptions
}

export declare function useRemyxEditor(
  targetRef: RefObject<HTMLElement>,
  options?: UseRemyxEditorOptions,
): UseRemyxEditorReturn

export declare function useEditorEngine(
  editAreaRef: RefObject<HTMLElement>,
  options?: Record<string, unknown>,
  readyTrigger?: unknown,
): {
  engine: EditorEngine | null
  ready: boolean
}

// ── Config Provider ───────────────────────────────────────────────

export interface RemyxConfig {
  theme?: 'light' | 'dark'
  placeholder?: string
  height?: number
  toolbar?: string[][]
  menuBar?: boolean | MenuBarConfig[]
  statusBar?: 'bottom' | 'top' | 'popup' | false
  floatingToolbar?: boolean
  contextMenu?: boolean
  commandPalette?: boolean
  autosave?: boolean | AutosaveConfig
  fonts?: string[]
  googleFonts?: string[]
  outputFormat?: 'html' | 'markdown'
  customTheme?: Record<string, string>
  toolbarItemTheme?: Record<string, Record<string, string>>
  editors?: Record<string, Partial<RemyxConfig>>
}

export interface RemyxConfigProviderProps {
  config: RemyxConfig
  children: ReactNode
}

export declare const RemyxConfigProvider: React.FC<RemyxConfigProviderProps>

export declare function useRemyxConfig(configName?: string): Partial<RemyxEditorProps>
