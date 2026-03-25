import {
  tokenize,
  tokenizeJavaScript,
  tokenizePython,
  tokenizeCSS,
  tokenizeSQL,
  tokenizeJSON,
  tokenizeBash,
  tokenizeRust,
  tokenizeGo,
  tokenizeJava,
  tokenizeHTML,
  tokenizePlainText,
  detectLanguage,
  registerLanguage,
  unregisterLanguage,
  LANGUAGE_MAP,
  SUPPORTED_LANGUAGES,
  runRules,
} from '../plugins/builtins/syntaxHighlight/tokenizers.js'

describe('tokenize', () => {
  it('returns null for unknown language', () => {
    expect(tokenize('code', 'brainfuck')).toBeNull()
  })

  it('returns null for plaintext', () => {
    expect(tokenize('code', 'plaintext')).toBeNull()
    expect(tokenize('code', 'text')).toBeNull()
  })

  it('returns tokens for JavaScript', () => {
    const tokens = tokenize('const x = 1', 'javascript')
    expect(tokens).not.toBeNull()
    expect(tokens.length).toBeGreaterThan(0)
    const types = tokens.map(t => t.type)
    expect(types).toContain('keyword')
  })

  it('normalizes language to lowercase', () => {
    expect(tokenize('const x', 'JAVASCRIPT')).not.toBeNull()
  })

  it('handles null language', () => {
    expect(tokenize('code', null)).toBeNull()
  })

  it('converts internal format to public format', () => {
    const tokens = tokenize('// comment', 'js')
    expect(tokens[0].type).toBe('comment')
    expect(tokens[0].value).toBe('// comment')
  })
})

describe('tokenizeJavaScript', () => {
  it('tokenizes keywords', () => {
    const tokens = tokenizeJavaScript('const let var')
    const keywords = tokens.filter(t => t.className === 'rmx-syn-keyword')
    expect(keywords.length).toBe(3)
  })

  it('tokenizes strings', () => {
    const tokens = tokenizeJavaScript('"hello" \'world\' `template`')
    const strings = tokens.filter(t => t.className === 'rmx-syn-string')
    expect(strings.length).toBe(3)
  })

  it('tokenizes comments', () => {
    const tokens = tokenizeJavaScript('// line comment\n/* block */')
    const comments = tokens.filter(t => t.className === 'rmx-syn-comment')
    expect(comments.length).toBe(2)
  })

  it('tokenizes numbers', () => {
    const tokens = tokenizeJavaScript('42 3.14 0xFF 0b1010')
    const numbers = tokens.filter(t => t.className === 'rmx-syn-number')
    expect(numbers.length).toBeGreaterThanOrEqual(3)
  })

  it('tokenizes builtins', () => {
    const tokens = tokenizeJavaScript('console Array Object')
    const builtins = tokens.filter(t => t.className === 'rmx-syn-builtin')
    expect(builtins.length).toBe(3)
  })

  it('tokenizes functions', () => {
    const tokens = tokenizeJavaScript('myFunc()')
    const fns = tokens.filter(t => t.className === 'rmx-syn-function')
    expect(fns.length).toBe(1)
  })

  it('tokenizes decorators', () => {
    const tokens = tokenizeJavaScript('@decorator')
    const decorators = tokens.filter(t => t.className === 'rmx-syn-decorator')
    expect(decorators.length).toBe(1)
  })
})

describe('tokenizePython', () => {
  it('tokenizes keywords', () => {
    const tokens = tokenizePython('def class if else')
    const keywords = tokens.filter(t => t.className === 'rmx-syn-keyword')
    expect(keywords.length).toBe(4)
  })

  it('tokenizes comments', () => {
    const tokens = tokenizePython('# comment')
    const comments = tokens.filter(t => t.className === 'rmx-syn-comment')
    expect(comments.length).toBe(1)
  })

  it('tokenizes triple-quoted strings', () => {
    const tokens = tokenizePython('"""docstring"""')
    const strings = tokens.filter(t => t.className === 'rmx-syn-string')
    expect(strings.length).toBe(1)
  })

  it('tokenizes builtins', () => {
    const tokens = tokenizePython('print len range')
    const builtins = tokens.filter(t => t.className === 'rmx-syn-builtin')
    expect(builtins.length).toBe(3)
  })
})

describe('tokenizeCSS', () => {
  it('tokenizes selectors', () => {
    const tokens = tokenizeCSS('.container { color: red; }')
    expect(tokens.length).toBeGreaterThan(0)
  })

  it('tokenizes comments', () => {
    const tokens = tokenizeCSS('/* comment */')
    const comments = tokens.filter(t => t.className === 'rmx-syn-comment')
    expect(comments.length).toBe(1)
  })

  it('tokenizes hex colors', () => {
    const tokens = tokenizeCSS('#ff0000')
    const numbers = tokens.filter(t => t.className === 'rmx-syn-number')
    expect(numbers.length).toBe(1)
  })
})

describe('tokenizeSQL', () => {
  it('tokenizes keywords case-insensitively', () => {
    const tokens = tokenizeSQL('SELECT name FROM users WHERE id')
    const keywords = tokens.filter(t => t.className === 'rmx-syn-keyword')
    expect(keywords.length).toBeGreaterThanOrEqual(3)
  })

  it('tokenizes strings', () => {
    const tokens = tokenizeSQL("WHERE name = 'Alice'")
    const strings = tokens.filter(t => t.className === 'rmx-syn-string')
    expect(strings.length).toBe(1)
  })

  it('tokenizes SQL comments', () => {
    const tokens = tokenizeSQL('-- line comment')
    const comments = tokens.filter(t => t.className === 'rmx-syn-comment')
    expect(comments.length).toBe(1)
  })
})

describe('tokenizeJSON', () => {
  it('tokenizes property names', () => {
    const tokens = tokenizeJSON('{"key": "value"}')
    const attrs = tokens.filter(t => t.className === 'rmx-syn-attr-name')
    expect(attrs.length).toBe(1)
  })

  it('tokenizes booleans', () => {
    const tokens = tokenizeJSON('true false null')
    const builtins = tokens.filter(t => t.className === 'rmx-syn-builtin')
    expect(builtins.length).toBe(3)
  })

  it('tokenizes numbers', () => {
    const tokens = tokenizeJSON('42 3.14 -5')
    const numbers = tokens.filter(t => t.className === 'rmx-syn-number')
    expect(numbers.length).toBeGreaterThanOrEqual(2)
  })
})

describe('tokenizeBash', () => {
  it('tokenizes keywords', () => {
    const tokens = tokenizeBash('if then else fi')
    const keywords = tokens.filter(t => t.className === 'rmx-syn-keyword')
    expect(keywords.length).toBe(4)
  })

  it('tokenizes builtins', () => {
    const tokens = tokenizeBash('echo ls grep')
    const builtins = tokens.filter(t => t.className === 'rmx-syn-builtin')
    expect(builtins.length).toBe(3)
  })

  it('tokenizes variables', () => {
    const tokens = tokenizeBash('$HOME ${PATH}')
    const entities = tokens.filter(t => t.className === 'rmx-syn-entity')
    expect(entities.length).toBe(2)
  })
})

describe('tokenizeRust', () => {
  it('tokenizes keywords', () => {
    const tokens = tokenizeRust('fn let mut impl struct')
    const keywords = tokens.filter(t => t.className === 'rmx-syn-keyword')
    expect(keywords.length).toBe(5)
  })

  it('tokenizes types', () => {
    const tokens = tokenizeRust('i32 String Vec')
    const types = tokens.filter(t => t.className === 'rmx-syn-type')
    expect(types.length).toBe(3)
  })
})

describe('tokenizeGo', () => {
  it('tokenizes keywords', () => {
    const tokens = tokenizeGo('func if else for range')
    const keywords = tokens.filter(t => t.className === 'rmx-syn-keyword')
    expect(keywords.length).toBe(5)
  })
})

describe('tokenizeJava', () => {
  it('tokenizes keywords', () => {
    const tokens = tokenizeJava('public class int return')
    const keywords = tokens.filter(t => t.className === 'rmx-syn-keyword')
    expect(keywords.length).toBe(4)
  })

  it('tokenizes annotations', () => {
    const tokens = tokenizeJava('@Override')
    const decorators = tokens.filter(t => t.className === 'rmx-syn-decorator')
    expect(decorators.length).toBe(1)
  })
})

describe('tokenizeHTML', () => {
  it('tokenizes tags', () => {
    const tokens = tokenizeHTML('<div class="a">text</div>')
    const tags = tokens.filter(t => t.className === 'rmx-syn-tag')
    expect(tags.length).toBeGreaterThanOrEqual(2)
  })

  it('tokenizes comments', () => {
    const tokens = tokenizeHTML('<!-- comment -->')
    const comments = tokens.filter(t => t.className === 'rmx-syn-comment')
    expect(comments.length).toBe(1)
  })
})

describe('tokenizePlainText', () => {
  it('returns single plain token', () => {
    const tokens = tokenizePlainText('hello world')
    expect(tokens).toEqual([{ text: 'hello world', className: null }])
  })
})

describe('detectLanguage', () => {
  it('detects Rust', () => {
    expect(detectLanguage('fn main() {\n    println!("hello")\n}')).toBe('rust')
  })

  it('detects Go', () => {
    expect(detectLanguage('package main\n\nimport "fmt"')).toBe('go')
  })

  it('detects Java', () => {
    expect(detectLanguage('public class Main {')).toBe('java')
  })

  it('detects Bash', () => {
    expect(detectLanguage('#!/bin/bash\necho hello')).toBe('bash')
  })

  it('detects CSS', () => {
    expect(detectLanguage('.container {\n  color: red;\n}')).toBe('css')
  })

  it('returns plaintext for unknown', () => {
    expect(detectLanguage('random text here 123')).toBe('plaintext')
  })
})

describe('registerLanguage / unregisterLanguage', () => {
  afterEach(() => {
    unregisterLanguage('ruby', ['rb'])
  })

  it('should register a custom language', () => {
    const tokenizer = (code) => [{ text: code, className: null }]
    registerLanguage('ruby', 'Ruby', tokenizer, ['rb'])
    expect(LANGUAGE_MAP.ruby).toBe(tokenizer)
    expect(LANGUAGE_MAP.rb).toBe(tokenizer)
    expect(SUPPORTED_LANGUAGES.find(l => l.id === 'ruby')).toBeDefined()
  })

  it('should throw for missing id', () => {
    expect(() => registerLanguage('', 'Test', () => [])).toThrow('id is required')
  })

  it('should throw for missing label', () => {
    expect(() => registerLanguage('test', '', () => [])).toThrow('label is required')
  })

  it('should throw for non-function tokenizer', () => {
    expect(() => registerLanguage('test', 'Test', 'notfn')).toThrow('tokenizer must be a function')
  })

  it('should unregister a language', () => {
    const tokenizer = (code) => [{ text: code, className: null }]
    registerLanguage('ruby', 'Ruby', tokenizer, ['rb'])
    unregisterLanguage('ruby', ['rb'])
    expect(LANGUAGE_MAP.ruby).toBeUndefined()
    expect(LANGUAGE_MAP.rb).toBeUndefined()
  })
})

describe('runRules', () => {
  it('should tokenize using regex rules', () => {
    const rules = [
      [/\d+/g, 'number'],
    ]
    const tokens = runRules('abc 123 def', rules)
    expect(tokens.find(t => t.className === 'number')?.text).toBe('123')
  })

  it('should handle empty input', () => {
    expect(runRules('', [])).toEqual([])
  })
})
