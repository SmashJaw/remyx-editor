import { describe, it, expect } from 'vitest'
import {
  detectLanguage,
  tokenize,
  SUPPORTED_LANGUAGES,
  LANGUAGE_MAP,
} from '../plugins/builtins/syntaxHighlight/tokenizers.js'

describe('Syntax Highlighting Tokenizers', () => {
  // ---------------------------------------------------------------------------
  // detectLanguage
  // ---------------------------------------------------------------------------
  describe('detectLanguage', () => {
    it('returns "plaintext" for empty or null input', () => {
      expect(detectLanguage('')).toBe('plaintext')
      expect(detectLanguage(null)).toBe('plaintext')
      expect(detectLanguage(undefined)).toBe('plaintext')
    })

    it('detects JSON', () => {
      expect(detectLanguage('{ "name": "test", "version": "1.0" }')).toBe('json')
      expect(detectLanguage('[1, 2, 3]')).toBe('json')
    })

    it('detects HTML', () => {
      expect(detectLanguage('<!DOCTYPE html>')).toBe('html')
      expect(detectLanguage('<div class="container">Hello</div>')).toBe('html')
    })

    it('detects SQL', () => {
      expect(detectLanguage('SELECT * FROM users WHERE id = 1')).toBe('sql')
      expect(detectLanguage('INSERT INTO table VALUES (1, 2)')).toBe('sql')
    })

    it('detects Python', () => {
      expect(detectLanguage('def hello():\n    print("hi")')).toBe('python')
      expect(detectLanguage('import os\nimport sys')).toBe('python')
      expect(detectLanguage('#!/usr/bin/env python3')).toBe('python')
    })

    it('detects Rust', () => {
      expect(detectLanguage('fn main() {')).toBe('rust')
      expect(detectLanguage('use std::io;')).toBe('rust')
      expect(detectLanguage('#[derive(Debug)]')).toBe('rust')
    })

    it('detects Go', () => {
      expect(detectLanguage('package main')).toBe('go')
      expect(detectLanguage('func main() {')).toBe('go')
    })

    it('detects Java', () => {
      expect(detectLanguage('public class Main {')).toBe('java')
      expect(detectLanguage('import java.util.List;')).toBe('java')
    })

    it('detects Bash', () => {
      expect(detectLanguage('#!/bin/bash')).toBe('bash')
      expect(detectLanguage('#!/bin/sh')).toBe('bash')
      expect(detectLanguage('export PATH="/usr/local/bin:$PATH"')).toBe('bash')
    })

    it('detects CSS', () => {
      expect(detectLanguage('@media (max-width: 768px) {')).toBe('css')
      expect(detectLanguage('.container { display: flex; }')).toBe('css')
    })

    it('detects JavaScript', () => {
      expect(detectLanguage('import React from "react"')).toBe('javascript')
      expect(detectLanguage('const x = () => 42')).toBe('javascript')
      expect(detectLanguage('import { useState } from "react"')).toBe('javascript')
    })

    it('returns "plaintext" for unrecognizable code', () => {
      expect(detectLanguage('hello world this is just text')).toBe('plaintext')
    })
  })

  // ---------------------------------------------------------------------------
  // tokenize
  // ---------------------------------------------------------------------------
  describe('tokenize', () => {
    it('returns null for unknown language', () => {
      expect(tokenize('hello', 'unknown_lang_xyz')).toBeNull()
    })

    it('returns null for plaintext', () => {
      expect(tokenize('hello world', 'plaintext')).toBeNull()
    })

    it('returns null for null language', () => {
      expect(tokenize('hello', null)).toBeNull()
    })

    it('tokenizes JavaScript keywords', () => {
      const tokens = tokenize('const x = 42', 'javascript')
      expect(tokens).not.toBeNull()
      const keyword = tokens.find(t => t.value === 'const')
      expect(keyword).toBeDefined()
      expect(keyword.type).toBe('keyword')
    })

    it('tokenizes JavaScript strings', () => {
      const tokens = tokenize('"hello world"', 'javascript')
      const str = tokens.find(t => t.type === 'string')
      expect(str).toBeDefined()
      expect(str.value).toBe('"hello world"')
    })

    it('tokenizes JavaScript comments', () => {
      const tokens = tokenize('// this is a comment', 'javascript')
      const comment = tokens.find(t => t.type === 'comment')
      expect(comment).toBeDefined()
    })

    it('tokenizes JavaScript numbers', () => {
      const tokens = tokenize('const n = 3.14', 'javascript')
      const num = tokens.find(t => t.type === 'number')
      expect(num).toBeDefined()
      expect(num.value).toBe('3.14')
    })

    it('tokenizes JavaScript functions', () => {
      const tokens = tokenize('function hello() {}', 'javascript')
      const fn = tokens.find(t => t.type === 'function')
      expect(fn).toBeDefined()
      expect(fn.value).toBe('hello')
    })

    it('tokenizes Python', () => {
      const tokens = tokenize('def greet(name):\n    print(f"Hello {name}")', 'python')
      expect(tokens).not.toBeNull()
      expect(tokens.find(t => t.value === 'def').type).toBe('keyword')
    })

    it('tokenizes CSS', () => {
      const tokens = tokenize('.class { color: red; }', 'css')
      expect(tokens).not.toBeNull()
      expect(tokens.some(t => t.type === 'tag')).toBe(true) // .class is a selector
    })

    it('tokenizes SQL', () => {
      const tokens = tokenize('SELECT name FROM users', 'sql')
      expect(tokens).not.toBeNull()
      expect(tokens.find(t => t.value === 'SELECT').type).toBe('keyword')
      expect(tokens.find(t => t.value === 'FROM').type).toBe('keyword')
    })

    it('tokenizes JSON', () => {
      const tokens = tokenize('{ "key": "value", "num": 42 }', 'json')
      expect(tokens).not.toBeNull()
      expect(tokens.find(t => t.value === '"key"').type).toBe('attr-name')
      expect(tokens.find(t => t.value === '"value"').type).toBe('string')
    })

    it('tokenizes Bash', () => {
      const tokens = tokenize('echo "hello"\n# comment', 'bash')
      expect(tokens).not.toBeNull()
      expect(tokens.find(t => t.value === 'echo').type).toBe('builtin')
      expect(tokens.some(t => t.type === 'comment')).toBe(true)
    })

    it('tokenizes Rust', () => {
      const tokens = tokenize('fn main() {\n    let x = 5;\n}', 'rust')
      expect(tokens).not.toBeNull()
      expect(tokens.find(t => t.value === 'fn').type).toBe('keyword')
      expect(tokens.find(t => t.value === 'let').type).toBe('keyword')
    })

    it('tokenizes Go', () => {
      const tokens = tokenize('package main\n\nfunc main() {}', 'go')
      expect(tokens).not.toBeNull()
      expect(tokens.find(t => t.value === 'package').type).toBe('keyword')
      expect(tokens.find(t => t.value === 'func').type).toBe('keyword')
    })

    it('tokenizes Java', () => {
      const tokens = tokenize('public class Main {\n  public static void main(String[] args) {}\n}', 'java')
      expect(tokens).not.toBeNull()
      expect(tokens.find(t => t.value === 'public').type).toBe('keyword')
      expect(tokens.find(t => t.value === 'class').type).toBe('keyword')
    })

    it('tokenizes HTML', () => {
      const tokens = tokenize('<div class="test">Hello</div>', 'html')
      expect(tokens).not.toBeNull()
      expect(tokens.some(t => t.type === 'tag')).toBe(true)
      expect(tokens.some(t => t.type === 'attr-name')).toBe(true)
    })

    it('handles language aliases (js, ts, py, sh, rs)', () => {
      expect(tokenize('const x = 1', 'js')).not.toBeNull()
      expect(tokenize('const x = 1', 'ts')).not.toBeNull()
      expect(tokenize('const x = 1', 'tsx')).not.toBeNull()
      expect(tokenize('x = 1', 'py')).not.toBeNull()
      expect(tokenize('echo hi', 'sh')).not.toBeNull()
      expect(tokenize('echo hi', 'shell')).not.toBeNull()
      expect(tokenize('fn main() {}', 'rs')).not.toBeNull()
      expect(tokenize('package main', 'golang')).not.toBeNull()
    })

    it('is case-insensitive for language', () => {
      expect(tokenize('const x = 1', 'JavaScript')).not.toBeNull()
      expect(tokenize('const x = 1', 'JAVASCRIPT')).not.toBeNull()
    })

    it('all tokens have type and value properties', () => {
      const tokens = tokenize('const x = "hello"', 'javascript')
      for (const token of tokens) {
        expect(token).toHaveProperty('type')
        expect(token).toHaveProperty('value')
        expect(typeof token.type).toBe('string')
        expect(typeof token.value).toBe('string')
        expect(token.value.length).toBeGreaterThan(0)
      }
    })

    it('tokens concatenated reproduce original source', () => {
      const source = 'const greeting = "hello";\nconsole.log(greeting);'
      const tokens = tokenize(source, 'javascript')
      const reconstructed = tokens.map(t => t.value).join('')
      expect(reconstructed).toBe(source)
    })
  })

  // ---------------------------------------------------------------------------
  // SUPPORTED_LANGUAGES & LANGUAGE_MAP
  // ---------------------------------------------------------------------------
  describe('SUPPORTED_LANGUAGES', () => {
    it('is an array of objects with id and label', () => {
      expect(Array.isArray(SUPPORTED_LANGUAGES)).toBe(true)
      for (const lang of SUPPORTED_LANGUAGES) {
        expect(lang).toHaveProperty('id')
        expect(lang).toHaveProperty('label')
        expect(typeof lang.id).toBe('string')
        expect(typeof lang.label).toBe('string')
      }
    })

    it('includes common languages', () => {
      const ids = SUPPORTED_LANGUAGES.map(l => l.id)
      expect(ids).toContain('javascript')
      expect(ids).toContain('python')
      expect(ids).toContain('css')
      expect(ids).toContain('sql')
      expect(ids).toContain('json')
      expect(ids).toContain('bash')
      expect(ids).toContain('rust')
      expect(ids).toContain('go')
      expect(ids).toContain('java')
      expect(ids).toContain('html')
    })
  })

  describe('LANGUAGE_MAP', () => {
    it('maps language ids to tokenizer functions', () => {
      for (const [key, value] of Object.entries(LANGUAGE_MAP)) {
        expect(typeof key).toBe('string')
        expect(typeof value).toBe('function')
      }
    })

    it('all SUPPORTED_LANGUAGES ids are in LANGUAGE_MAP', () => {
      for (const lang of SUPPORTED_LANGUAGES) {
        expect(LANGUAGE_MAP).toHaveProperty(lang.id)
      }
    })
  })
})
