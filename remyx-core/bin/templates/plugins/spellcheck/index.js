import './spellcheck.css'

export { SpellcheckPlugin } from './SpellcheckPlugin.js'
export {
  analyzeGrammar,
  summarizeIssues,
  detectPassiveVoice,
  detectWordiness,
  detectCliches,
  detectPunctuationIssues,
  STYLE_PRESETS,
} from './GrammarEngine.js'
