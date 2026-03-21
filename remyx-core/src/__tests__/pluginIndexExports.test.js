/**
 * Tests that import through index.js re-export files
 * to ensure those modules get counted in coverage.
 */

import { KeyboardPlugin, getHeadings, selectNextOccurrence } from '../plugins/builtins/keyboardFeatures/index.js'
import { DragDropPlugin } from '../plugins/builtins/dragDropFeatures/index.js'
import { MathPlugin, getSymbolPalette, parseMathExpressions, latexToMathML } from '../plugins/builtins/mathFeatures/index.js'
import { SyntaxHighlightPlugin } from '../plugins/builtins/syntaxHighlight/index.js'
import {
  SUPPORTED_LANGUAGES, LANGUAGE_MAP, detectLanguage, tokenize, registerLanguage, unregisterLanguage, runRules,
} from '../plugins/builtins/syntaxHighlight/index.js'
import { CollaborationPlugin } from '../plugins/builtins/collaborationFeatures/index.js'
import { CrdtEngine, offsetToRange, rangeToOffset } from '../plugins/builtins/collaborationFeatures/index.js'
import { AwarenessProtocol } from '../plugins/builtins/collaborationFeatures/index.js'
import { WebSocketTransport } from '../plugins/builtins/collaborationFeatures/index.js'
import { SpellcheckPlugin } from '../plugins/builtins/spellcheckFeatures/index.js'
import {
  analyzeGrammar, summarizeIssues, detectPassiveVoice, detectWordiness,
  detectCliches, detectPunctuationIssues, STYLE_PRESETS,
} from '../plugins/builtins/spellcheckFeatures/index.js'

describe('Plugin index re-exports', () => {
  it('keyboardFeatures re-exports all', () => {
    expect(KeyboardPlugin).toBeDefined()
    expect(getHeadings).toBeDefined()
    expect(selectNextOccurrence).toBeDefined()
  })

  it('dragDropFeatures re-exports DragDropPlugin', () => {
    expect(DragDropPlugin).toBeDefined()
  })

  it('mathFeatures re-exports all', () => {
    expect(MathPlugin).toBeDefined()
    expect(getSymbolPalette).toBeDefined()
    expect(parseMathExpressions).toBeDefined()
    expect(latexToMathML).toBeDefined()
  })

  it('syntaxHighlight re-exports all', () => {
    expect(SyntaxHighlightPlugin).toBeDefined()
    expect(SUPPORTED_LANGUAGES).toBeDefined()
    expect(LANGUAGE_MAP).toBeDefined()
    expect(detectLanguage).toBeDefined()
    expect(tokenize).toBeDefined()
    expect(registerLanguage).toBeDefined()
    expect(unregisterLanguage).toBeDefined()
    expect(runRules).toBeDefined()
  })

  it('collaborationFeatures re-exports all', () => {
    expect(CollaborationPlugin).toBeDefined()
    expect(CrdtEngine).toBeDefined()
    expect(offsetToRange).toBeDefined()
    expect(rangeToOffset).toBeDefined()
    expect(AwarenessProtocol).toBeDefined()
    expect(WebSocketTransport).toBeDefined()
  })

  it('spellcheckFeatures re-exports all', () => {
    expect(SpellcheckPlugin).toBeDefined()
    expect(analyzeGrammar).toBeDefined()
    expect(summarizeIssues).toBeDefined()
    expect(detectPassiveVoice).toBeDefined()
    expect(detectWordiness).toBeDefined()
    expect(detectCliches).toBeDefined()
    expect(detectPunctuationIssues).toBeDefined()
    expect(STYLE_PRESETS).toBeDefined()
  })
})
