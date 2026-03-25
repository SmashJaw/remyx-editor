import { vi, beforeAll } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

// Mock ModalOverlay to render children directly
vi.mock('../components/Modals/ModalOverlay.jsx', () => ({
  ModalOverlay: ({ title, open, onClose, children }) => {
    if (!open) return null
    return (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        <button onClick={onClose} aria-label="Close">Close</button>
        {children}
      </div>
    )
  },
}))

// Mock @remyxjs/core
vi.mock('@remyxjs/core', () => ({
  htmlToMarkdown: vi.fn((html) => `markdown: ${html}`),
  markdownToHtml: vi.fn((md) => `<p>${md}</p>`),
  formatHTML: vi.fn((html) => html),
  exportAsMarkdown: vi.fn(),
  exportAsPDF: vi.fn(),
  exportAsDocx: vi.fn(),
  convertDocument: vi.fn().mockResolvedValue('<p>converted</p>'),
  getSupportedExtensions: vi.fn(() => '.docx,.md,.txt'),
  getSupportedFormatNames: vi.fn(() => ['Word', 'Markdown', 'Text']),
}))

// Mock CodeEditor
vi.mock('../components/Modals/CodeEditor/CodeEditor.jsx', () => ({
  CodeEditor: ({ value, onChange }) => (
    <textarea
      data-testid="code-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

import { LinkModal } from '../components/Modals/LinkModal.jsx'
import { ImageModal } from '../components/Modals/ImageModal.jsx'
import { TablePickerModal } from '../components/Modals/TablePickerModal.jsx'
import { EmbedModal } from '../components/Modals/EmbedModal.jsx'
import { SourceModal } from '../components/Modals/SourceModal.jsx'
import { ExportModal } from '../components/Modals/ExportModal.jsx'
import { FindReplacePanel } from '../components/Modals/FindReplaceModal.jsx'
import { AttachmentModal } from '../components/Modals/AttachmentModal.jsx'
import { ImportDocumentModal } from '../components/Modals/ImportDocumentModal.jsx'

function createMockEngine(opts = {}) {
  const handlers = {}
  return {
    executeCommand: vi.fn(),
    getHTML: vi.fn(() => opts.html || '<p>Hello</p>'),
    setHTML: vi.fn(),
    getText: vi.fn(() => 'Hello'),
    outputFormat: opts.outputFormat || 'html',
    isSourceMode: false,
    options: { uploadHandler: opts.uploadHandler || null },
    selection: { getSelectedText: vi.fn(() => 'selected') },
    history: { snapshot: vi.fn() },
    sanitizer: { sanitize: vi.fn((html) => html) },
    eventBus: {
      on: vi.fn((event, handler) => {
        if (!handlers[event]) handlers[event] = []
        handlers[event].push(handler)
        return () => {
          handlers[event] = handlers[event].filter(h => h !== handler)
        }
      }),
      emit: vi.fn((event, data) => {
        if (handlers[event]) handlers[event].forEach(h => h(data))
      }),
    },
    _handlers: handlers,
  }
}

// ── LinkModal ─────────────────────────────────────────────────────────────

describe('LinkModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <LinkModal open={false} onClose={vi.fn()} engine={createMockEngine()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders Insert Link title for new link', () => {
    render(
      <LinkModal open={true} onClose={vi.fn()} engine={createMockEngine()} data={{}} />
    )
    expect(screen.getByText('Insert Link')).toBeTruthy()
  })

  it('renders Edit Link title when data has href', () => {
    render(
      <LinkModal
        open={true}
        onClose={vi.fn()}
        engine={createMockEngine()}
        data={{ href: 'https://example.com', text: 'Example' }}
      />
    )
    expect(screen.getByText('Edit Link')).toBeTruthy()
  })

  it('populates fields from data', () => {
    render(
      <LinkModal
        open={true}
        onClose={vi.fn()}
        engine={createMockEngine()}
        data={{ href: 'https://test.com', text: 'Test' }}
      />
    )
    const urlInput = screen.getByLabelText('URL')
    const textInput = screen.getByLabelText('Display Text')
    expect(urlInput.value).toBe('https://test.com')
    expect(textInput.value).toBe('Test')
  })

  it('calls insertLink on submit for new link', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()
    render(
      <LinkModal open={true} onClose={onClose} engine={engine} data={{}} />
    )
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://example.com' } })
    fireEvent.change(screen.getByLabelText('Display Text'), { target: { value: 'Example' } })
    fireEvent.submit(screen.getByLabelText('URL').closest('form'))
    expect(engine.executeCommand).toHaveBeenCalledWith('insertLink', expect.objectContaining({
      href: 'https://example.com',
      text: 'Example',
    }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls editLink on submit for existing link', () => {
    const engine = createMockEngine()
    render(
      <LinkModal
        open={true}
        onClose={vi.fn()}
        engine={engine}
        data={{ href: 'https://old.com', text: 'Old' }}
      />
    )
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://new.com' } })
    fireEvent.submit(screen.getByLabelText('URL').closest('form'))
    expect(engine.executeCommand).toHaveBeenCalledWith('editLink', expect.any(Object))
  })

  it('shows Remove Link button for existing links', () => {
    const engine = createMockEngine()
    render(
      <LinkModal
        open={true}
        onClose={vi.fn()}
        engine={engine}
        data={{ href: 'https://test.com' }}
      />
    )
    expect(screen.getByText('Remove Link')).toBeTruthy()
  })

  it('removes link when Remove Link is clicked', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()
    render(
      <LinkModal
        open={true}
        onClose={onClose}
        engine={engine}
        data={{ href: 'https://test.com' }}
      />
    )
    fireEvent.click(screen.getByText('Remove Link'))
    expect(engine.executeCommand).toHaveBeenCalledWith('removeLink')
    expect(onClose).toHaveBeenCalled()
  })

  it('does not submit with empty URL', () => {
    const engine = createMockEngine()
    render(
      <LinkModal open={true} onClose={vi.fn()} engine={engine} data={{}} />
    )
    fireEvent.submit(screen.getByLabelText('URL').closest('form'))
    expect(engine.executeCommand).not.toHaveBeenCalled()
  })

  it('blocks javascript: protocol', () => {
    const engine = createMockEngine()
    render(
      <LinkModal open={true} onClose={vi.fn()} engine={engine} data={{}} />
    )
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'javascript:alert(1)' } })
    fireEvent.submit(screen.getByLabelText('URL').closest('form'))
    expect(engine.executeCommand).not.toHaveBeenCalled()
  })

  it('allows relative URLs', () => {
    const engine = createMockEngine()
    render(
      <LinkModal open={true} onClose={vi.fn()} engine={engine} data={{}} />
    )
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: '/about' } })
    fireEvent.submit(screen.getByLabelText('URL').closest('form'))
    expect(engine.executeCommand).toHaveBeenCalled()
  })

  it('has open in new tab checkbox', () => {
    render(
      <LinkModal open={true} onClose={vi.fn()} engine={createMockEngine()} data={{}} />
    )
    expect(screen.getByText('Open in new tab')).toBeTruthy()
  })

  it('Cancel button calls onClose', () => {
    const onClose = vi.fn()
    render(
      <LinkModal open={true} onClose={onClose} engine={createMockEngine()} data={{}} />
    )
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })
})

// ── ImageModal ────────────────────────────────────────────────────────────

describe('ImageModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <ImageModal open={false} onClose={vi.fn()} engine={createMockEngine()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders Insert Image title', () => {
    render(<ImageModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByText('Insert Image')).toBeTruthy()
  })

  it('has URL and Upload tabs', () => {
    render(<ImageModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByText('URL')).toBeTruthy()
    expect(screen.getByText('Upload')).toBeTruthy()
  })

  it('calls insertImage on submit', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()
    render(<ImageModal open={true} onClose={onClose} engine={engine} />)
    fireEvent.change(screen.getByLabelText('Image URL'), { target: { value: 'https://img.com/photo.jpg' } })
    fireEvent.change(screen.getByLabelText('Alt Text'), { target: { value: 'A photo' } })
    fireEvent.submit(screen.getByLabelText('Image URL').closest('form'))
    expect(engine.executeCommand).toHaveBeenCalledWith('insertImage', expect.objectContaining({
      src: 'https://img.com/photo.jpg',
      alt: 'A photo',
    }))
    expect(onClose).toHaveBeenCalled()
  })

  it('blocks javascript: URL', () => {
    const engine = createMockEngine()
    render(<ImageModal open={true} onClose={vi.fn()} engine={engine} />)
    fireEvent.change(screen.getByLabelText('Image URL'), { target: { value: 'javascript:alert(1)' } })
    fireEvent.submit(screen.getByLabelText('Image URL').closest('form'))
    expect(engine.executeCommand).not.toHaveBeenCalled()
  })

  it('has width field', () => {
    render(<ImageModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByLabelText('Width (px)')).toBeTruthy()
  })

  it('Cancel button calls onClose', () => {
    const onClose = vi.fn()
    render(<ImageModal open={true} onClose={onClose} engine={createMockEngine()} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })
})

// ── TablePickerModal ──────────────────────────────────────────────────────

describe('TablePickerModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <TablePickerModal open={false} onClose={vi.fn()} engine={createMockEngine()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders Insert Table title', () => {
    render(<TablePickerModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByText('Insert Table')).toBeTruthy()
  })

  it('has rows and columns inputs', () => {
    render(<TablePickerModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByLabelText('Rows')).toBeTruthy()
    expect(screen.getByLabelText('Columns')).toBeTruthy()
  })

  it('displays default grid size', () => {
    render(<TablePickerModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByText('3 x 3')).toBeTruthy()
  })

  it('Insert button calls insertTable', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()
    render(<TablePickerModal open={true} onClose={onClose} engine={engine} />)
    fireEvent.click(screen.getByText('Insert'))
    expect(engine.executeCommand).toHaveBeenCalledWith('insertTable', { rows: 3, cols: 3 })
    expect(onClose).toHaveBeenCalled()
  })

  it('updates rows via input', () => {
    const engine = createMockEngine()
    render(<TablePickerModal open={true} onClose={vi.fn()} engine={engine} />)
    fireEvent.change(screen.getByLabelText('Rows'), { target: { value: '5' } })
    expect(screen.getByText('5 x 3')).toBeTruthy()
  })

  it('updates columns via input', () => {
    const engine = createMockEngine()
    render(<TablePickerModal open={true} onClose={vi.fn()} engine={engine} />)
    fireEvent.change(screen.getByLabelText('Columns'), { target: { value: '4' } })
    expect(screen.getByText('3 x 4')).toBeTruthy()
  })

  it('Cancel button calls onClose', () => {
    const onClose = vi.fn()
    render(<TablePickerModal open={true} onClose={onClose} engine={createMockEngine()} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows error when insertTable throws', () => {
    const engine = createMockEngine()
    engine.executeCommand.mockImplementation(() => { throw new Error('Table error') })
    render(<TablePickerModal open={true} onClose={vi.fn()} engine={engine} />)
    fireEvent.click(screen.getByText('Insert'))
    expect(screen.getByText('Table error')).toBeTruthy()
  })
})

// ── EmbedModal ────────────────────────────────────────────────────────────

describe('EmbedModal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when not open', () => {
    const { container } = render(
      <EmbedModal open={false} onClose={vi.fn()} engine={createMockEngine()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders Embed Media title', () => {
    render(<EmbedModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByText('Embed Media')).toBeTruthy()
  })

  it('has video URL input', () => {
    render(<EmbedModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByLabelText('Video URL')).toBeTruthy()
  })

  it('calls embedMedia on submit with valid URL', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()
    render(<EmbedModal open={true} onClose={onClose} engine={engine} />)
    fireEvent.change(screen.getByLabelText('Video URL'), { target: { value: 'https://www.youtube.com/watch?v=abc123' } })
    fireEvent.submit(screen.getByLabelText('Video URL').closest('form'))
    expect(engine.executeCommand).toHaveBeenCalledWith('embedMedia', { url: 'https://www.youtube.com/watch?v=abc123' })
    expect(onClose).toHaveBeenCalled()
  })

  it('blocks javascript: URL', () => {
    const engine = createMockEngine()
    render(<EmbedModal open={true} onClose={vi.fn()} engine={engine} />)
    fireEvent.change(screen.getByLabelText('Video URL'), { target: { value: 'javascript:alert(1)' } })
    fireEvent.submit(screen.getByLabelText('Video URL').closest('form'))
    expect(engine.executeCommand).not.toHaveBeenCalled()
  })

  it('Embed button is disabled when URL is empty', () => {
    render(<EmbedModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByText('Embed').closest('button').disabled).toBe(true)
  })

  it('shows supported platforms hint', () => {
    render(<EmbedModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByText('Supports YouTube, Vimeo, and Dailymotion URLs')).toBeTruthy()
  })
})

// ── SourceModal ───────────────────────────────────────────────────────────

describe('SourceModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <SourceModal open={false} onClose={vi.fn()} engine={createMockEngine()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders Source Code title for HTML mode', () => {
    render(<SourceModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByText('Source Code')).toBeTruthy()
  })

  it('renders Markdown Source title for markdown mode', () => {
    render(
      <SourceModal open={true} onClose={vi.fn()} engine={createMockEngine({ outputFormat: 'markdown' })} />
    )
    expect(screen.getByText('Markdown Source')).toBeTruthy()
  })

  it('renders code editor with HTML source', () => {
    const engine = createMockEngine({ html: '<p>Test</p>' })
    render(<SourceModal open={true} onClose={vi.fn()} engine={engine} />)
    expect(screen.getByTestId('code-editor')).toBeTruthy()
  })

  it('Apply button updates engine HTML', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()
    render(<SourceModal open={true} onClose={onClose} engine={engine} />)
    fireEvent.click(screen.getByText('Apply'))
    expect(engine.history.snapshot).toHaveBeenCalled()
    expect(engine.setHTML).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('Cancel button calls onClose', () => {
    const onClose = vi.fn()
    render(<SourceModal open={true} onClose={onClose} engine={createMockEngine()} />)
    // When no changes, cancel should close directly
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })
})

// ── ExportModal ───────────────────────────────────────────────────────────

describe('ExportModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <ExportModal open={false} onClose={vi.fn()} engine={createMockEngine()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders Export Document title', () => {
    render(<ExportModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByText('Export Document')).toBeTruthy()
  })

  it('has PDF, Markdown, and Word buttons', () => {
    render(<ExportModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByText('PDF')).toBeTruthy()
    expect(screen.getByText('Markdown')).toBeTruthy()
    expect(screen.getByText('Word Document')).toBeTruthy()
  })

  it('PDF button calls export and closes', () => {
    const onClose = vi.fn()
    render(<ExportModal open={true} onClose={onClose} engine={createMockEngine()} />)
    fireEvent.click(screen.getByText('PDF'))
    // Export button should call onClose on success
    expect(onClose).toHaveBeenCalled()
  })

  it('shows error when export fails', async () => {
    const { exportAsPDF } = await import('@remyxjs/core')
    exportAsPDF.mockImplementationOnce(() => { throw new Error('Export failed') })
    render(<ExportModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    fireEvent.click(screen.getByText('PDF'))
    expect(screen.getByText('Export failed')).toBeTruthy()
  })
})

// ── FindReplacePanel ──────────────────────────────────────────────────────

describe('FindReplacePanel', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <FindReplacePanel open={false} onClose={vi.fn()} engine={createMockEngine()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders search role', () => {
    render(<FindReplacePanel open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByRole('search', { name: 'Find and replace' })).toBeTruthy()
  })

  it('has Find and Replace inputs', () => {
    render(<FindReplacePanel open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByPlaceholderText('Find...')).toBeTruthy()
    expect(screen.getByPlaceholderText('Replace...')).toBeTruthy()
  })

  it('Find button calls find command', () => {
    const engine = createMockEngine()
    render(<FindReplacePanel open={true} onClose={vi.fn()} engine={engine} />)
    fireEvent.change(screen.getByPlaceholderText('Find...'), { target: { value: 'hello' } })
    fireEvent.click(screen.getByText('Find'))
    expect(engine.executeCommand).toHaveBeenCalledWith('find', { text: 'hello', caseSensitive: false })
  })

  it('Replace button calls replace command', () => {
    const engine = createMockEngine()
    render(<FindReplacePanel open={true} onClose={vi.fn()} engine={engine} />)
    fireEvent.change(screen.getByPlaceholderText('Replace...'), { target: { value: 'world' } })
    fireEvent.click(screen.getByText('Replace'))
    expect(engine.executeCommand).toHaveBeenCalledWith('replace', { replaceText: 'world' })
  })

  it('All button calls replaceAll', () => {
    const engine = createMockEngine()
    render(<FindReplacePanel open={true} onClose={vi.fn()} engine={engine} />)
    fireEvent.click(screen.getByText('All'))
    expect(engine.executeCommand).toHaveBeenCalledWith('replaceAll', expect.any(Object))
  })

  it('shows No results by default', () => {
    render(<FindReplacePanel open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByText('No results')).toBeTruthy()
  })

  it('updates result count from find:results event', () => {
    const engine = createMockEngine()
    render(<FindReplacePanel open={true} onClose={vi.fn()} engine={engine} />)

    act(() => {
      const handler = engine.eventBus.on.mock.calls.find(c => c[0] === 'find:results')[1]
      handler({ total: 5, current: 2 })
    })

    expect(screen.getByText('2/5')).toBeTruthy()
  })

  it('Escape closes the panel', () => {
    const onClose = vi.fn()
    render(<FindReplacePanel open={true} onClose={onClose} engine={createMockEngine()} />)
    const panel = screen.getByRole('search')
    fireEvent.keyDown(panel, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('close button calls onClose', () => {
    const onClose = vi.fn()
    render(<FindReplacePanel open={true} onClose={onClose} engine={createMockEngine()} />)
    fireEvent.click(screen.getByLabelText('Close find and replace'))
    expect(onClose).toHaveBeenCalled()
  })

  it('Enter in find input calls findNext when results exist', () => {
    const engine = createMockEngine()
    render(<FindReplacePanel open={true} onClose={vi.fn()} engine={engine} />)

    // Set results
    act(() => {
      const handler = engine.eventBus.on.mock.calls.find(c => c[0] === 'find:results')[1]
      handler({ total: 3, current: 1 })
    })

    const findInput = screen.getByPlaceholderText('Find...')
    fireEvent.change(findInput, { target: { value: 'test' } })
    fireEvent.keyDown(findInput, { key: 'Enter' })
    expect(engine.executeCommand).toHaveBeenCalledWith('findNext')
  })

  it('case sensitive toggle works', () => {
    const engine = createMockEngine()
    render(<FindReplacePanel open={true} onClose={vi.fn()} engine={engine} />)
    const csToggle = screen.getByLabelText('Toggle case sensitive search')
    fireEvent.click(csToggle)
    fireEvent.change(screen.getByPlaceholderText('Find...'), { target: { value: 'Test' } })
    fireEvent.click(screen.getByText('Find'))
    expect(engine.executeCommand).toHaveBeenCalledWith('find', { text: 'Test', caseSensitive: true })
  })

  it('Previous and Next match buttons work', () => {
    const engine = createMockEngine()
    render(<FindReplacePanel open={true} onClose={vi.fn()} engine={engine} />)
    fireEvent.click(screen.getByLabelText('Previous match'))
    expect(engine.executeCommand).toHaveBeenCalledWith('findPrev')
    fireEvent.click(screen.getByLabelText('Next match'))
    expect(engine.executeCommand).toHaveBeenCalledWith('findNext')
  })

  it('clears find on close', () => {
    const engine = createMockEngine()
    const { rerender } = render(<FindReplacePanel open={true} onClose={vi.fn()} engine={engine} />)
    rerender(<FindReplacePanel open={false} onClose={vi.fn()} engine={engine} />)
    expect(engine.executeCommand).toHaveBeenCalledWith('clearFind')
  })
})

// ── AttachmentModal ───────────────────────────────────────────────────────

describe('AttachmentModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <AttachmentModal open={false} onClose={vi.fn()} engine={createMockEngine()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders Attach File title', () => {
    render(<AttachmentModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByText('Attach File')).toBeTruthy()
  })

  it('has URL and Upload tabs', () => {
    render(<AttachmentModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByText('URL')).toBeTruthy()
    expect(screen.getByText('Upload')).toBeTruthy()
  })

  it('calls insertAttachment on submit', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()
    render(<AttachmentModal open={true} onClose={onClose} engine={engine} />)
    fireEvent.change(screen.getByLabelText('File URL'), { target: { value: 'https://test.com/doc.pdf' } })
    fireEvent.change(screen.getByLabelText('Display Name'), { target: { value: 'My Document' } })
    fireEvent.submit(screen.getByLabelText('File URL').closest('form'))
    expect(engine.executeCommand).toHaveBeenCalledWith('insertAttachment', expect.objectContaining({
      url: 'https://test.com/doc.pdf',
      filename: 'My Document',
    }))
  })

  it('blocks javascript: URL', () => {
    const engine = createMockEngine()
    render(<AttachmentModal open={true} onClose={vi.fn()} engine={engine} />)
    fireEvent.change(screen.getByLabelText('File URL'), { target: { value: 'javascript:alert(1)' } })
    fireEvent.submit(screen.getByLabelText('File URL').closest('form'))
    expect(engine.executeCommand).not.toHaveBeenCalled()
  })

  it('shows upload unavailable message when no uploadHandler', () => {
    render(<AttachmentModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    fireEvent.click(screen.getByText('Upload'))
    expect(screen.getByText(/File upload is not available/)).toBeTruthy()
  })

  it('shows Choose File button when uploadHandler exists', () => {
    const engine = createMockEngine({ uploadHandler: vi.fn() })
    render(<AttachmentModal open={true} onClose={vi.fn()} engine={engine} />)
    fireEvent.click(screen.getByText('Upload'))
    expect(screen.getByText('Choose File')).toBeTruthy()
  })
})

// ── ImportDocumentModal ───────────────────────────────────────────────────

describe('ImportDocumentModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <ImportDocumentModal open={false} onClose={vi.fn()} engine={createMockEngine()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders Import Document title', () => {
    render(<ImportDocumentModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByText('Import Document')).toBeTruthy()
  })

  it('shows Choose Document button', () => {
    render(<ImportDocumentModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByText('Choose Document')).toBeTruthy()
  })

  it('shows supported formats', () => {
    render(<ImportDocumentModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    expect(screen.getByText(/Supported: Word, Markdown, Text/)).toBeTruthy()
  })

  it('Insert button is disabled when no preview', () => {
    render(<ImportDocumentModal open={true} onClose={vi.fn()} engine={createMockEngine()} />)
    const insertBtn = screen.getAllByText('Insert').find(el => el.tagName === 'BUTTON')
    expect(insertBtn.disabled).toBe(true)
  })

  it('Cancel button calls onClose and resets state', () => {
    const onClose = vi.fn()
    render(<ImportDocumentModal open={true} onClose={onClose} engine={createMockEngine()} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })
})

// ── EditorModals ──────────────────────────────────────────────────────────

describe('EditorModals', () => {
  // EditorModals uses React.lazy, so test via import
  it('is a valid React component', async () => {
    const { EditorModals } = await import('../components/EditorModals.jsx')
    expect(typeof EditorModals).toBe('function')
  })
})
