import React, { useRef, useState, useCallback, useEffect, useMemo, Suspense } from 'react'
import { useEditorEngine } from '../hooks/useEditorEngine.js'
import { useSelection } from '../hooks/useSelection.js'
import { useModal } from '../hooks/useModal.js'
import { useContextMenu } from '../hooks/useContextMenu.js'
import { useConfigFile } from '../hooks/useConfigFile.js'
import { useAutosave } from '../hooks/useAutosave.js'
import { useEditorRect } from '../hooks/useEditorRect.js'
import { useDragDrop } from '../hooks/useDragDrop.js'
import { useSwipeGesture } from '../hooks/useSwipeGesture.js'
import { useLongPress } from '../hooks/useLongPress.js'
import { usePinchZoom } from '../hooks/usePinchZoom.js'
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard.js'
import { loadGoogleFonts, DEFAULT_FONTS } from '@remyxjs/core'
import { SelectionContext } from '../config/SelectionContext.js'
import { Toolbar } from './Toolbar/Toolbar.jsx'
import { EditArea } from './EditArea/EditArea.jsx'
import { FloatingToolbar } from './EditArea/FloatingToolbar.jsx'
import { ImageResizeHandles } from './EditArea/ImageResizeHandles.jsx'
import { TableControls } from './EditArea/TableControls.jsx'
import { CodeBlockControls } from './EditArea/CodeBlockControls.jsx'
import { DropZoneOverlay } from './EditArea/DropZoneOverlay.jsx'
import { BlockDragHandle } from './EditArea/BlockDragHandle.jsx'
import { StatusBar, WordCountButton } from './StatusBar/StatusBar.jsx'
import { RecoveryBanner } from './RecoveryBanner/RecoveryBanner.jsx'
import { EditorErrorBoundary } from './ErrorBoundary.jsx'
import { EmptyState } from './EmptyState/EmptyState.jsx'
import { BreadcrumbBar } from './BreadcrumbBar/BreadcrumbBar.jsx'
import { Minimap } from './Minimap/Minimap.jsx'
import { SplitPreview } from './SplitPreview/SplitPreview.jsx'
import { useToast } from './Toast/Toast.jsx'

const MenuBar = React.lazy(() => import('./MenuBar/MenuBar.jsx').then(m => ({ default: m.MenuBar })))
const ContextMenu = React.lazy(() => import('./ContextMenu/ContextMenu.jsx').then(m => ({ default: m.ContextMenu })))

import { EditorModals, FindReplacePanel } from './EditorModals.jsx'

/**
 * RemyxEditor — Config-driven rich text editor component.
 *
 * @param {object} props
 * @param {string} props.config - Config name mapping to remyxjs/config/<name>.json
 * @param {string} [props.value] - Controlled content (HTML or Markdown)
 * @param {string} [props.defaultValue] - Initial content for uncontrolled mode
 * @param {Function} [props.onChange] - Content change callback
 * @param {Function} [props.onReady] - Callback when engine is ready
 * @param {Function} [props.onError] - Error callback
 * @param {Function} [props.onFocus] - Focus callback
 * @param {Function} [props.onBlur] - Blur callback
 * @param {string} [props.className] - CSS class for the wrapper
 * @param {object} [props.style] - Inline styles for the wrapper
 */
export default function RemyxEditor(props) {
  const resolved = useConfigFile(props.config, props)

  if (!resolved) {
    return <div className="rmx-editor rmx-error">Config &quot;{props.config}&quot; not found</div>
  }

  const {
    value, defaultValue, onChange, toolbar, toolbarWrap,
    theme, placeholder, height, minHeight, maxHeight,
    readOnly, plugins, onReady, onFocus, onBlur,
    className, style, uploadHandler, outputFormat,
    showFloatingToolbar, showContextMenu, fonts, googleFonts,
    statusBar, customTheme, toolbarItemTheme, sanitize, shortcuts,
    baseHeadingLevel, menuBarConfig, onError, errorFallback,
    showCommandPalette,
    autosaveConfig,
    showBreadcrumb,
    showMinimap,
    splitViewFormat,
  } = resolved

  const editAreaRef = useRef(null)
  const editorRootRef = useRef(null)

  useEffect(() => {
    if (googleFonts && googleFonts.length > 0) {
      loadGoogleFonts(googleFonts)
    }
  }, [googleFonts])

  const mergedFonts = useMemo(() => {
    if (!googleFonts || googleFonts.length === 0) return fonts
    const googleFontNames = googleFonts.map(f => f.split(':')[0])
    const base = fonts || DEFAULT_FONTS
    const existing = new Set(base.map(f => f.toLowerCase()))
    const newFonts = googleFontNames.filter(f => !existing.has(f.toLowerCase()))
    return [...base, ...newFonts]
  }, [fonts, googleFonts])

  const { engine, ready } = useEditorEngine(editAreaRef, {
    value,
    defaultValue,
    onChange,
    outputFormat,
    placeholder,
    readOnly,
    plugins,
    onReady,
    onFocus,
    onBlur,
    uploadHandler,
    sanitize,
    shortcuts,
    baseHeadingLevel,
  })

  const { formatState, uiState } = useSelection(engine)
  const { modals, openModal, closeModal } = useModal()
  const { contextMenu, hideContextMenu } = useContextMenu(engine, editAreaRef)
  const { saveStatus, recoveryData, recoverContent, dismissRecovery } = useAutosave(engine, autosaveConfig)

  const [toastEl, showToast] = useToast()

  useEffect(() => {
    if (!engine) return
    const unsubs = [
      engine.eventBus.on('export:success', () => showToast('Export successful', 'success')),
      engine.eventBus.on('clipboard:copy', () => showToast('Copied to clipboard', 'info')),
    ]
    return () => unsubs.forEach(unsub => typeof unsub === 'function' && unsub())
  }, [engine, showToast])

  const editorRect = useEditorRect(editorRootRef)

  useEffect(() => {
    if (editorRootRef.current && engine) {
      editorRootRef.current.__engine = engine
    }
  }, [engine])

  const { isExternalDrag, dragFileTypes } = useDragDrop(engine)

  useSwipeGesture(engine, editAreaRef, {
    onDismissToolbar: () => {
      if (engine?.element) window.getSelection()?.removeAllRanges()
    },
  })

  const handleLongPress = useCallback(({ x, y }) => {
    if (!engine) return
    engine.eventBus.emit('contextmenu', { clientX: x, clientY: y, preventDefault: () => {} })
  }, [engine])
  useLongPress(editAreaRef, handleLongPress, { enabled: showContextMenu && !readOnly })

  const { zoomedElement, resetZoom } = usePinchZoom(editAreaRef)

  useVirtualKeyboard(engine, editorRootRef)

  useEffect(() => {
    if (!engine) return
    return engine.eventBus.on('mode:change', ({ sourceMode: sm }) => {
      if (sm) openModal('source')
    })
  }, [engine, openModal])

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  useEffect(() => {
    if (!engine) return
    const handleKeyDown = (e) => {
      const mod = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey
      if (mod && e.key === 'f') {
        e.preventDefault()
        openModal('findReplace')
      }
      if (showCommandPalette && mod && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        setCommandPaletteOpen(prev => !prev)
      }
    }
    engine.element?.addEventListener('keydown', handleKeyDown)
    return () => engine.element?.removeEventListener('keydown', handleKeyDown)
  }, [engine, openModal, showCommandPalette])

  useEffect(() => {
    if (!engine || !onError) return
    const unsubs = [
      engine.eventBus.on('plugin:error', ({ name, error }) => onError(error, { source: 'plugin', pluginName: name })),
      engine.eventBus.on('editor:error', ({ phase, error }) => onError(error, { source: 'engine', phase })),
      engine.eventBus.on('upload:error', ({ file, error }) => onError(error, { source: 'upload', file })),
    ]
    return () => unsubs.forEach(unsub => unsub())
  }, [engine, onError])

  const handleOpenModal = useCallback((name, data) => {
    if (name === 'commandPalette') {
      setCommandPaletteOpen(true)
      return
    }
    // Save current selection so modals can restore it before executing commands
    if (engine?.selection) {
      engine._savedSelection = engine.selection.save()
    }
    openModal(name, data)
  }, [openModal, engine])

  const [isEmpty, setIsEmpty] = useState(true)
  useEffect(() => {
    if (!engine) return
    const check = () => {
      const text = engine.getText().trim()
      setIsEmpty(text === '' || text === '\n')
    }
    const unsub = engine.eventBus.on('content:change', check)
    check()
    return unsub
  }, [engine])

  const [splitViewActive, setSplitViewActive] = useState(false)
  useEffect(() => {
    if (!engine) return
    return engine.eventBus.on('splitView:toggle', ({ active }) => setSplitViewActive(active))
  }, [engine])

  // Analytics panel toggle
  const [analyticsVisible, setAnalyticsVisible] = useState(false)
  const [analyticsData, setAnalyticsData] = useState(null)

  // Helper: extract text from editor DOM with newline separators between block
  // elements so sentence/paragraph splitting works across <p> tags.
  // engine.getText() returns element.textContent which concatenates blocks
  // without whitespace, causing "end.Start" to be treated as one token.
  const getEditorDomText = useCallback((eng) => {
    if (!eng?.element) return ''
    const blockEls = eng.element.querySelectorAll('p, li, blockquote, h1, h2, h3, h4, h5, h6, pre')
    const blocks = Array.from(blockEls).map(b => b.textContent.trim()).filter(t => t.length > 0)
    return blocks.length > 0 ? blocks.join('\n') : (eng.getText() || '')
  }, [])

  useEffect(() => {
    if (!engine) return
    const unsubs = [
      engine.eventBus.on('analytics:toggle', ({ visible }) => {
        setAnalyticsVisible(visible)
        if (visible && engine._analytics?.analyzeContent) {
          // Override the text used for analysis with DOM-derived text
          const domText = getEditorDomText(engine)
          const { analyzeContent } = engine._analytics
          // analyzeContent uses engine.getText() internally, but we need DOM text
          // so we call the exported function with proper text if available
          const stats = analyzeContent()
          // Patch sentence count from DOM text
          const sentences = domText.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 0)
          const paragraphs = domText.split(/\n/).map(p => p.trim()).filter(p => p.length > 0)
          setAnalyticsData({ ...stats, sentenceCount: sentences.length, paragraphCount: paragraphs.length })
        }
      }),
      engine.eventBus.on('analytics:update', (data) => {
        // Patch the update with DOM-derived sentence/paragraph counts
        const domText = getEditorDomText(engine)
        const sentences = domText.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 0)
        const paragraphs = domText.split(/\n/).map(p => p.trim()).filter(p => p.length > 0)
        setAnalyticsData({ ...data, sentenceCount: sentences.length, paragraphCount: paragraphs.length })
      }),
    ]
    return () => unsubs.forEach(unsub => typeof unsub === 'function' && unsub())
  }, [engine, getEditorDomText])

  const wordCountBtn = useMemo(() =>
    statusBar === 'popup' ? <WordCountButton engine={engine} /> : null,
    [statusBar, engine]
  )

  const themeClassName = useMemo(() =>
    `rmx-editor rmx-theme-${/^[a-zA-Z0-9_-]+$/.test(theme) ? theme : 'light'} ${className || ''}`,
    [theme, className]
  )

  const editAreaStyle = useMemo(() => ({
    minHeight: minHeight || height,
    maxHeight: maxHeight || undefined,
    height: maxHeight ? undefined : height,
    overflowY: 'auto',
  }), [minHeight, height, maxHeight])

  const mergedStyle = useMemo(() =>
    customTheme ? { ...customTheme, ...style } : style,
    [customTheme, style]
  )

  return (
    <EditorErrorBoundary onError={onError} fallback={errorFallback}>
    <SelectionContext.Provider value={formatState}>
    <div
      ref={editorRootRef}
      className={themeClassName}
      style={mergedStyle}
    >
      <a className="rmx-skip-link" href="#rmx-edit-area">
        Skip to editor content
      </a>

      {menuBarConfig && (
        <Suspense fallback={<div className="rmx-loading-spinner" />}>
          <MenuBar
            config={menuBarConfig}
            engine={engine}
            onOpenModal={handleOpenModal}
          />
        </Suspense>
      )}

      <Toolbar
        config={toolbar}
        engine={engine}
        onOpenModal={handleOpenModal}
        fonts={mergedFonts}
        statusBarMode={statusBar}
        wordCountButton={wordCountBtn}
        toolbarItemTheme={toolbarItemTheme}
        wrap={toolbarWrap}
      />

      {analyticsVisible && analyticsData && (
        <div className="rmx-analytics-panel">
          {analyticsData.readingTime != null && (
            <div className="rmx-analytics-stat">
              <span className="rmx-analytics-label">Reading Time</span>
              <span className="rmx-analytics-value">
                {typeof analyticsData.readingTime === 'object'
                  ? analyticsData.readingTime.seconds < 60
                    ? `${analyticsData.readingTime.seconds}s`
                    : `${Math.floor(analyticsData.readingTime.seconds / 60)}m ${analyticsData.readingTime.seconds % 60}s`
                  : `${analyticsData.readingTime} min`}
              </span>
            </div>
          )}
          {analyticsData.fleschKincaid != null && (
            <div className="rmx-analytics-stat">
              <span className="rmx-analytics-label">Grade Level</span>
              <span className="rmx-analytics-value">{Number(analyticsData.fleschKincaid).toFixed(1)}</span>
            </div>
          )}
          {analyticsData.fleschReadingEase != null && (
            <div className="rmx-analytics-stat">
              <span className="rmx-analytics-label">Reading Ease</span>
              <span className="rmx-analytics-value">{Number(analyticsData.fleschReadingEase).toFixed(1)}</span>
            </div>
          )}
          {analyticsData.vocabularyLevel && (
            <div className="rmx-analytics-stat">
              <span className="rmx-analytics-label">Vocabulary</span>
              <span className="rmx-analytics-value">{String(analyticsData.vocabularyLevel)}</span>
            </div>
          )}
          {analyticsData.sentenceCount != null && (
            <div className="rmx-analytics-stat">
              <span className="rmx-analytics-label">Sentences</span>
              <span className="rmx-analytics-value">{analyticsData.sentenceCount}</span>
            </div>
          )}
          {analyticsData.paragraphCount != null && (
            <div className="rmx-analytics-stat">
              <span className="rmx-analytics-label">Paragraphs</span>
              <span className="rmx-analytics-value">{analyticsData.paragraphCount}</span>
            </div>
          )}
        </div>
      )}

      {autosaveConfig.enabled && autosaveConfig.showRecoveryBanner !== false && (
        <RecoveryBanner
          recoveryData={recoveryData}
          onRecover={recoverContent}
          onDismiss={dismissRecovery}
        />
      )}

      {showBreadcrumb && engine && <BreadcrumbBar engine={engine} />}

      {statusBar === 'top' && (
        <StatusBar
          engine={engine}
          position="top"
          saveStatus={saveStatus}
          showSaveStatus={autosaveConfig.enabled && autosaveConfig.showSaveStatus !== false}
        />
      )}

      <div className="rmx-editor-body" style={{ position: 'relative' }}>
        <EditArea
          ref={editAreaRef}
          style={editAreaStyle}
          readOnly={readOnly}
          id="rmx-edit-area"
        />

        {splitViewActive && engine && (
          <SplitPreview engine={engine} format={splitViewFormat} />
        )}

        {showMinimap && engine && (
          <Minimap engine={engine} editAreaRef={editAreaRef} />
        )}

        {showFloatingToolbar && (
          <FloatingToolbar
            visible={uiState.hasSelection}
            selectionRect={uiState.selectionRect}
            engine={engine}
            editorRect={editorRect}
            onOpenModal={handleOpenModal}
          />
        )}

        {uiState.focusedImage && (
          <ImageResizeHandles image={uiState.focusedImage} engine={engine} editorRect={editorRect} />
        )}

        {uiState.focusedTable && (
          <TableControls table={uiState.focusedTable} engine={engine} editorRect={editorRect} />
        )}

        {uiState.focusedCodeBlock && (
          <CodeBlockControls codeBlock={uiState.focusedCodeBlock} engine={engine} editorRect={editorRect} />
        )}

        {zoomedElement && (
          <button className="rmx-pinch-zoom-reset" onClick={resetZoom} type="button" aria-label="Reset zoom">
            Reset Zoom
          </button>
        )}

        <DropZoneOverlay visible={isExternalDrag} fileTypes={dragFileTypes} />

        <Suspense fallback={<div className="rmx-loading-spinner" />}>
          {modals.findReplace.open && (
            <FindReplacePanel open={modals.findReplace.open} onClose={() => closeModal('findReplace')} engine={engine} />
          )}
        </Suspense>
      </div>

      {statusBar === 'bottom' && (
        <StatusBar
          engine={engine}
          saveStatus={saveStatus}
          showSaveStatus={autosaveConfig.enabled && autosaveConfig.showSaveStatus !== false}
        />
      )}

      {showContextMenu && (
        <Suspense fallback={<div className="rmx-loading-spinner" />}>
          <ContextMenu contextMenu={contextMenu} onHide={hideContextMenu} onOpenModal={handleOpenModal} />
        </Suspense>
      )}

      {toastEl}

      <EditorModals
        modals={modals}
        closeModal={closeModal}
        engine={engine}
        showCommandPalette={showCommandPalette}
        commandPaletteOpen={commandPaletteOpen}
        setCommandPaletteOpen={setCommandPaletteOpen}
        handleOpenModal={handleOpenModal}
      />
    </div>
    </SelectionContext.Provider>
    </EditorErrorBoundary>
  )
}
