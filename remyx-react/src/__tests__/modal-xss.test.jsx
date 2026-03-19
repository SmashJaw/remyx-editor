import { vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { LinkModal } from '../components/Modals/LinkModal.jsx'
import { ImageModal } from '../components/Modals/ImageModal.jsx'
import { EmbedModal } from '../components/Modals/EmbedModal.jsx'
import { AttachmentModal } from '../components/Modals/AttachmentModal.jsx'

// Helper: create a mock engine that tracks command calls
function createMockEngine() {
  return {
    executeCommand: vi.fn(),
    options: {},
  }
}

// Helper: submit a modal form by finding the submit button and clicking it
function submitForm(container) {
  const form = container.querySelector('form')
  fireEvent.submit(form)
}

// ── LinkModal XSS Tests ────────────────────────────────────────────────────

describe('LinkModal XSS protection', () => {
  it('rejects javascript: URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <LinkModal open={true} onClose={onClose} engine={engine} data={null} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'javascript:alert(1)' } })
    submitForm(container)

    expect(engine.executeCommand).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('rejects percent-encoded java%73cript: URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <LinkModal open={true} onClose={onClose} engine={engine} data={null} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'java%73cript:alert(1)' } })
    submitForm(container)

    expect(engine.executeCommand).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('rejects vbscript: URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <LinkModal open={true} onClose={onClose} engine={engine} data={null} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'vbscript:MsgBox("XSS")' } })
    submitForm(container)

    expect(engine.executeCommand).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('rejects data:text/html URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <LinkModal open={true} onClose={onClose} engine={engine} data={null} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'data:text/html,<script>alert(1)</script>' } })
    submitForm(container)

    expect(engine.executeCommand).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('allows safe https: URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <LinkModal open={true} onClose={onClose} engine={engine} data={null} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } })
    submitForm(container)

    expect(engine.executeCommand).toHaveBeenCalledWith('insertLink', expect.any(Object))
    expect(onClose).toHaveBeenCalled()
  })
})

// ── ImageModal XSS Tests ───────────────────────────────────────────────────

describe('ImageModal XSS protection', () => {
  it('blocks data:image/svg+xml URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <ImageModal open={true} onClose={onClose} engine={engine} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'data:image/svg+xml,<svg onload="alert(1)"/>' } })
    submitForm(container)

    expect(engine.executeCommand).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('blocks javascript: URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <ImageModal open={true} onClose={onClose} engine={engine} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'javascript:alert(1)' } })
    submitForm(container)

    expect(engine.executeCommand).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('allows safe data:image/png URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <ImageModal open={true} onClose={onClose} engine={engine} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'data:image/png;base64,iVBORw0KGgo=' } })
    submitForm(container)

    expect(engine.executeCommand).toHaveBeenCalledWith('insertImage', expect.any(Object))
    expect(onClose).toHaveBeenCalled()
  })

  it('allows safe https: image URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <ImageModal open={true} onClose={onClose} engine={engine} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'https://example.com/image.png' } })
    submitForm(container)

    expect(engine.executeCommand).toHaveBeenCalledWith('insertImage', expect.any(Object))
    expect(onClose).toHaveBeenCalled()
  })
})

// ── EmbedModal XSS Tests ───────────────────────────────────────────────────

describe('EmbedModal XSS protection', () => {
  it('rejects javascript: URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <EmbedModal open={true} onClose={onClose} engine={engine} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'javascript:alert(1)' } })
    submitForm(container)

    expect(engine.executeCommand).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('rejects percent-encoded java%73cript: URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <EmbedModal open={true} onClose={onClose} engine={engine} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'java%73cript:alert(1)' } })
    submitForm(container)

    expect(engine.executeCommand).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('rejects vbscript: URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <EmbedModal open={true} onClose={onClose} engine={engine} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'vbscript:MsgBox("XSS")' } })
    submitForm(container)

    expect(engine.executeCommand).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('rejects data:text/html URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <EmbedModal open={true} onClose={onClose} engine={engine} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    // Use a data:text/html: URL that matches the DANGEROUS_PROTOCOL regex
    fireEvent.change(urlInput, { target: { value: 'data:text/html:base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==' } })
    submitForm(container)

    expect(engine.executeCommand).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('allows safe YouTube URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <EmbedModal open={true} onClose={onClose} engine={engine} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } })
    submitForm(container)

    expect(engine.executeCommand).toHaveBeenCalledWith('embedMedia', expect.any(Object))
    expect(onClose).toHaveBeenCalled()
  })
})

// ── AttachmentModal XSS Tests ──────────────────────────────────────────────

describe('AttachmentModal XSS protection', () => {
  it('rejects javascript: URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <AttachmentModal open={true} onClose={onClose} engine={engine} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'javascript:alert(1)' } })
    submitForm(container)

    expect(engine.executeCommand).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('rejects percent-encoded java%73cript: URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <AttachmentModal open={true} onClose={onClose} engine={engine} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'java%73cript:alert(1)' } })
    submitForm(container)

    expect(engine.executeCommand).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('rejects vbscript: URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <AttachmentModal open={true} onClose={onClose} engine={engine} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'vbscript:MsgBox("XSS")' } })
    submitForm(container)

    expect(engine.executeCommand).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('rejects data:text/html URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <AttachmentModal open={true} onClose={onClose} engine={engine} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    // Use a data:text/html: URL that matches the DANGEROUS_PROTOCOL regex
    fireEvent.change(urlInput, { target: { value: 'data:text/html:base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==' } })
    submitForm(container)

    expect(engine.executeCommand).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('allows safe https: URLs', () => {
    const engine = createMockEngine()
    const onClose = vi.fn()

    const { container } = render(
      <AttachmentModal open={true} onClose={onClose} engine={engine} />
    )

    const urlInput = container.querySelector('input[type="url"]')
    fireEvent.change(urlInput, { target: { value: 'https://example.com/document.pdf' } })
    submitForm(container)

    expect(engine.executeCommand).toHaveBeenCalledWith('insertAttachment', expect.any(Object))
    expect(onClose).toHaveBeenCalled()
  })
})
