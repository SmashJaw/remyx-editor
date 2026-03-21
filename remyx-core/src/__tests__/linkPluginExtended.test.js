import { vi } from 'vitest'
import { detectLinks } from '../plugins/builtins/linkFeatures/LinkPlugin.js'

describe('detectLinks', () => {
  it('detects http URLs', () => {
    const results = detectLinks('Visit http://example.com today')
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0].type).toBe('url')
    expect(results[0].value).toContain('http://example.com')
  })

  it('detects https URLs', () => {
    const results = detectLinks('Go to https://example.com/path')
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('url')
  })

  it('detects www URLs', () => {
    const results = detectLinks('See www.example.com')
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('url')
  })

  it('detects email addresses', () => {
    const results = detectLinks('Email user@example.com for info')
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('email')
    expect(results[0].value).toBe('user@example.com')
  })

  it('detects phone numbers', () => {
    const results = detectLinks('Call 555-123-4567')
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('phone')
  })

  it('detects phone numbers with parentheses', () => {
    const results = detectLinks('Call (555) 123-4567')
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('phone')
  })

  it('detects multiple links', () => {
    const results = detectLinks('Visit https://a.com and email b@c.com')
    expect(results.length).toBe(2)
  })

  it('returns empty for plain text', () => {
    expect(detectLinks('Just some text')).toEqual([])
  })

  it('returns empty for empty string', () => {
    expect(detectLinks('')).toEqual([])
  })

  it('includes correct index position', () => {
    const results = detectLinks('prefix https://x.com suffix')
    expect(results[0].index).toBe(7)
  })

  it('detects phone with country code', () => {
    const results = detectLinks('Call +1-555-123-4567')
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('phone')
  })
})
