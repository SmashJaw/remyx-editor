/**
 * Syntax highlighting tokenizers for common programming languages.
 *
 * Each tokenizer takes a source string and returns an array of
 * { text, className } tokens where className uses the `rmx-syn-` prefix.
 * Tokens with no syntactic meaning have className: null.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Run a list of ordered regex rules against `code` in a single linear pass.
 * Each rule is [RegExp, className | null]. The first match at the current
 * position wins. Unmatched characters are collected into a plain-text token.
 */
function runRules(code, rules) {
  const tokens = [];
  let pos = 0;
  let plain = '';

  const flush = () => {
    if (plain) {
      tokens.push({ text: plain, className: null });
      plain = '';
    }
  };

  while (pos < code.length) {
    let matched = false;
    for (const [re, cls] of rules) {
      re.lastIndex = pos;
      const m = re.exec(code);
      if (m && m.index === pos) {
        flush();
        tokens.push({ text: m[0], className: cls });
        pos += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      plain += code[pos];
      pos++;
    }
  }
  flush();
  return tokens;
}

/** Build a keyword regex from an array of words (bounded, case-sensitive). */
function kw(words) {
  return new RegExp(`\\b(?:${words.join('|')})\\b`, 'g');
}

/** Same as kw but case-insensitive. */
function kwi(words) {
  return new RegExp(`\\b(?:${words.join('|')})\\b`, 'gi');
}

// ---------------------------------------------------------------------------
// JavaScript / TypeScript
// ---------------------------------------------------------------------------

const JS_KEYWORDS = [
  'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
  'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export',
  'extends', 'finally', 'for', 'from', 'function', 'if', 'implements',
  'import', 'in', 'instanceof', 'interface', 'let', 'new', 'of',
  'package', 'return', 'static', 'super', 'switch', 'this', 'throw',
  'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'async',
];

const JS_BUILTINS = [
  'Array', 'Boolean', 'console', 'Date', 'Error', 'JSON', 'Map',
  'Math', 'Number', 'Object', 'Promise', 'Proxy', 'RegExp', 'Set',
  'String', 'Symbol', 'WeakMap', 'WeakSet', 'parseInt', 'parseFloat',
  'undefined', 'null', 'true', 'false', 'NaN', 'Infinity',
];

const JS_TYPES = [
  'any', 'boolean', 'never', 'number', 'string', 'unknown', 'void',
  'type', 'keyof', 'readonly', 'infer',
];

const JS_RULES = [
  [/\/\/[^\n]{0,500}/g, 'rmx-syn-comment'],
  [/\/\*[^]*?(?:\*\/|$)/g, 'rmx-syn-comment'],
  [/\/(?:[^/\\*\n]|\\.){1,200}\/[gimsuy]{0,6}/g, 'rmx-syn-regex'],
  [/`(?:[^`\\]|\\.|\$\{[^}]{0,200}\}){0,2000}`/g, 'rmx-syn-string'],
  [/"(?:[^"\\]|\\.){0,1000}"/g, 'rmx-syn-string'],
  [/'(?:[^'\\]|\\.){0,1000}'/g, 'rmx-syn-string'],
  [/@\w{1,50}/g, 'rmx-syn-decorator'],
  [kw(JS_TYPES), 'rmx-syn-type'],
  [kw(JS_KEYWORDS), 'rmx-syn-keyword'],
  [kw(JS_BUILTINS), 'rmx-syn-builtin'],
  [/\b\d[\d_]{0,30}(?:\.\d[\d_]{0,30})?(?:[eE][+-]?\d{1,10})?\b/g, 'rmx-syn-number'],
  [/0[xX][\da-fA-F_]{1,20}/g, 'rmx-syn-number'],
  [/0[bB][01_]{1,64}/g, 'rmx-syn-number'],
  [/\b[a-zA-Z_$]\w{0,50}(?=\s{0,5}\()/g, 'rmx-syn-function'],
  [/(?<=\.)[a-zA-Z_$]\w{0,50}/g, 'rmx-syn-property'],
  [/=>|[+\-*/%=!<>&|^~?:]{1,3}/g, 'rmx-syn-operator'],
  [/[{}()[\];,.]/g, 'rmx-syn-punctuation'],
];

export function tokenizeJavaScript(code) {
  return runRules(code, JS_RULES);
}

// ---------------------------------------------------------------------------
// Python
// ---------------------------------------------------------------------------

const PY_KEYWORDS = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'while', 'with', 'yield',
];

const PY_BUILTINS = [
  'abs', 'all', 'any', 'bin', 'bool', 'bytes', 'callable', 'chr',
  'dict', 'dir', 'enumerate', 'eval', 'filter', 'float', 'format',
  'frozenset', 'getattr', 'hasattr', 'hash', 'hex', 'id', 'input',
  'int', 'isinstance', 'issubclass', 'iter', 'len', 'list', 'map',
  'max', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow',
  'print', 'property', 'range', 'repr', 'reversed', 'round', 'set',
  'setattr', 'slice', 'sorted', 'staticmethod', 'str', 'sum', 'super',
  'tuple', 'type', 'vars', 'zip',
];

const PY_RULES = [
  [/#[^\n]{0,500}/g, 'rmx-syn-comment'],
  [/"""[^]*?(?:"""|$)/g, 'rmx-syn-string'],
  [/'''[^]*?(?:'''|$)/g, 'rmx-syn-string'],
  [/f"(?:[^"\\]|\\.|\{[^}]{0,200}\}){0,1000}"/g, 'rmx-syn-string'],
  [/f'(?:[^'\\]|\\.|\{[^}]{0,200}\}){0,1000}'/g, 'rmx-syn-string'],
  [/"(?:[^"\\]|\\.){0,1000}"/g, 'rmx-syn-string'],
  [/'(?:[^'\\]|\\.){0,1000}'/g, 'rmx-syn-string'],
  [/@\w{1,50}/g, 'rmx-syn-decorator'],
  [kw(PY_KEYWORDS), 'rmx-syn-keyword'],
  [kw(PY_BUILTINS), 'rmx-syn-builtin'],
  [/\b\d[\d_]{0,30}(?:\.\d[\d_]{0,30})?(?:[eE][+-]?\d{1,10})?\b/g, 'rmx-syn-number'],
  [/0[xX][\da-fA-F_]{1,20}/g, 'rmx-syn-number'],
  [/0[bBoO][\d_]{1,64}/g, 'rmx-syn-number'],
  [/\b[a-zA-Z_]\w{0,50}(?=\s{0,5}\()/g, 'rmx-syn-function'],
  [/(?<=\.)[a-zA-Z_]\w{0,50}/g, 'rmx-syn-property'],
  [/[+\-*/%=!<>&|^~@:]{1,3}/g, 'rmx-syn-operator'],
  [/[{}()[\];,.]/g, 'rmx-syn-punctuation'],
];

export function tokenizePython(code) {
  return runRules(code, PY_RULES);
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

const CSS_AT_RULES = [
  'charset', 'import', 'namespace', 'media', 'supports', 'keyframes',
  'font-face', 'layer', 'container', 'property', 'scope',
];

const CSS_RULES = [
  [/\/\*[^]*?(?:\*\/|$)/g, 'rmx-syn-comment'],
  [new RegExp(`@(?:${CSS_AT_RULES.join('|')})\\b`, 'g'), 'rmx-syn-keyword'],
  [/"(?:[^"\\]|\\.){0,1000}"/g, 'rmx-syn-string'],
  [/'(?:[^'\\]|\\.){0,1000}'/g, 'rmx-syn-string'],
  [/#[\da-fA-F]{3,8}\b/g, 'rmx-syn-number'],
  [/\b\d[\d.]{0,20}(?:%|px|rem|em|vh|vw|ch|ex|s|ms|deg|fr|vmin|vmax)?\b/g, 'rmx-syn-number'],
  [/(?:^|\s|[{;])\s{0,10}[a-zA-Z-]{1,40}(?=\s{0,5}:)/gm, 'rmx-syn-attr-name'],
  [/[.#][\w-]{1,60}/g, 'rmx-syn-tag'],
  [/::?[\w-]{1,40}/g, 'rmx-syn-entity'],
  [/\b(?:rgb|rgba|hsl|hsla|var|calc|min|max|clamp)(?=\()/g, 'rmx-syn-builtin'],
  [/!important\b/g, 'rmx-syn-keyword'],
  [/[{}();:,]/g, 'rmx-syn-punctuation'],
];

export function tokenizeCSS(code) {
  return runRules(code, CSS_RULES);
}

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE',
  'CREATE', 'DROP', 'ALTER', 'TABLE', 'INDEX', 'VIEW', 'JOIN',
  'INNER', 'LEFT', 'RIGHT', 'OUTER', 'FULL', 'CROSS', 'ON', 'AS',
  'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL',
  'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'UNION',
  'ALL', 'DISTINCT', 'SET', 'VALUES', 'EXISTS', 'CASE', 'WHEN',
  'THEN', 'ELSE', 'END', 'ASC', 'DESC', 'PRIMARY', 'KEY',
  'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'DEFAULT', 'WITH',
  'RECURSIVE', 'RETURNING', 'BEGIN', 'COMMIT', 'ROLLBACK',
  'TRANSACTION', 'GRANT', 'REVOKE', 'TRUNCATE',
];

const SQL_TYPES = [
  'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'FLOAT',
  'DOUBLE', 'DECIMAL', 'NUMERIC', 'CHAR', 'VARCHAR', 'TEXT',
  'BLOB', 'BOOLEAN', 'DATE', 'TIMESTAMP', 'SERIAL',
];

const SQL_BUILTINS = [
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'IFNULL',
  'NULLIF', 'CAST', 'CONVERT', 'SUBSTRING', 'TRIM', 'UPPER',
  'LOWER', 'LENGTH', 'CONCAT', 'NOW', 'CURRENT_TIMESTAMP',
];

const SQL_RULES = [
  [/--[^\n]{0,500}/g, 'rmx-syn-comment'],
  [/\/\*[^]*?(?:\*\/|$)/g, 'rmx-syn-comment'],
  [/'(?:[^'\\]|\\.){0,1000}'/g, 'rmx-syn-string'],
  [/"(?:[^"\\]|\\.){0,1000}"/g, 'rmx-syn-string'],
  [kwi(SQL_TYPES), 'rmx-syn-type'],
  [kwi(SQL_KEYWORDS), 'rmx-syn-keyword'],
  [kwi(SQL_BUILTINS), 'rmx-syn-builtin'],
  [/\b(?:TRUE|FALSE)\b/gi, 'rmx-syn-builtin'],
  [/\b\d[\d.]{0,20}\b/g, 'rmx-syn-number'],
  [/[+\-*/%=!<>]{1,3}/g, 'rmx-syn-operator'],
  [/[{}()[\];,.]/g, 'rmx-syn-punctuation'],
];

export function tokenizeSQL(code) {
  return runRules(code, SQL_RULES);
}

// ---------------------------------------------------------------------------
// JSON
// ---------------------------------------------------------------------------

const JSON_RULES = [
  [/"(?:[^"\\]|\\.){0,1000}"(?=\s{0,10}:)/g, 'rmx-syn-attr-name'],
  [/"(?:[^"\\]|\\.){0,1000}"/g, 'rmx-syn-string'],
  [/\b(?:true|false)\b/g, 'rmx-syn-builtin'],
  [/\bnull\b/g, 'rmx-syn-builtin'],
  [/-?\b\d[\d.]{0,20}(?:[eE][+-]?\d{1,10})?\b/g, 'rmx-syn-number'],
  [/[{}[\]:,]/g, 'rmx-syn-punctuation'],
];

export function tokenizeJSON(code) {
  return runRules(code, JSON_RULES);
}

// ---------------------------------------------------------------------------
// Bash / Shell
// ---------------------------------------------------------------------------

const BASH_KEYWORDS = [
  'if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'until', 'do',
  'done', 'case', 'esac', 'in', 'function', 'select', 'return',
  'exit', 'break', 'continue', 'local', 'export', 'declare',
  'readonly', 'unset', 'shift', 'source', 'trap',
];

const BASH_BUILTINS = [
  'echo', 'printf', 'cd', 'pwd', 'ls', 'cp', 'mv', 'rm', 'mkdir',
  'cat', 'grep', 'sed', 'awk', 'find', 'sort', 'uniq', 'wc',
  'head', 'tail', 'chmod', 'chown', 'curl', 'wget', 'tar', 'git',
  'docker', 'npm', 'yarn', 'pip', 'sudo', 'apt', 'brew', 'test',
  'read', 'eval', 'exec', 'set',
];

const BASH_RULES = [
  [/#[^\n]{0,500}/g, 'rmx-syn-comment'],
  [/"(?:[^"\\]|\\.|\$\{[^}]{0,200}\}|\$\w{1,50}){0,1000}"/g, 'rmx-syn-string'],
  [/'[^']{0,2000}'/g, 'rmx-syn-string'],
  [/\$\{[^}]{0,200}\}/g, 'rmx-syn-entity'],
  [/\$[\w?!#@*]{1,50}/g, 'rmx-syn-entity'],
  [kw(BASH_KEYWORDS), 'rmx-syn-keyword'],
  [kw(BASH_BUILTINS), 'rmx-syn-builtin'],
  [/\b\d[\d.]{0,20}\b/g, 'rmx-syn-number'],
  [/[|&;<>]{1,3}/g, 'rmx-syn-operator'],
  [/[{}()[\]]/g, 'rmx-syn-punctuation'],
];

export function tokenizeBash(code) {
  return runRules(code, BASH_RULES);
}

// ---------------------------------------------------------------------------
// Rust
// ---------------------------------------------------------------------------

const RUST_KEYWORDS = [
  'as', 'async', 'await', 'break', 'const', 'continue', 'crate',
  'dyn', 'else', 'enum', 'extern', 'fn', 'for', 'if', 'impl',
  'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub',
  'ref', 'return', 'self', 'static', 'struct', 'super', 'trait',
  'type', 'unsafe', 'use', 'where', 'while', 'yield',
];

const RUST_TYPES = [
  'bool', 'char', 'f32', 'f64', 'i8', 'i16', 'i32', 'i64', 'i128',
  'isize', 'str', 'u8', 'u16', 'u32', 'u64', 'u128', 'usize',
  'Self', 'Box', 'Vec', 'String', 'Option', 'Result', 'Rc', 'Arc',
  'HashMap', 'HashSet', 'BTreeMap', 'BTreeSet', 'Cow',
];

const RUST_BUILTINS = [
  'Some', 'None', 'Ok', 'Err', 'true', 'false', 'println', 'eprintln',
  'format', 'panic', 'assert', 'assert_eq', 'assert_ne', 'todo',
  'unimplemented', 'unreachable', 'dbg', 'cfg', 'derive',
];

const RUST_RULES = [
  [/\/\/[^\n]{0,500}/g, 'rmx-syn-comment'],
  [/\/\*[^]*?(?:\*\/|$)/g, 'rmx-syn-comment'],
  [/"(?:[^"\\]|\\.){0,1000}"/g, 'rmx-syn-string'],
  [/r#*"[^]*?"#*/g, 'rmx-syn-string'],
  [/'[a-zA-Z_]\w{0,30}/g, 'rmx-syn-entity'],
  [/b?'(?:[^'\\]|\\.){1,4}'/g, 'rmx-syn-string'],
  [/#!\[[\w:]{1,50}/g, 'rmx-syn-decorator'],
  [/#\[[\w:]{1,50}/g, 'rmx-syn-decorator'],
  [/\b\w{1,30}!/g, 'rmx-syn-builtin'],
  [kw(RUST_TYPES), 'rmx-syn-type'],
  [kw(RUST_KEYWORDS), 'rmx-syn-keyword'],
  [kw(RUST_BUILTINS), 'rmx-syn-builtin'],
  [/\b\d[\d_]{0,30}(?:\.\d[\d_]{0,30})?(?:[eE][+-]?\d{1,10})?(?:_?(?:f32|f64|i8|i16|i32|i64|i128|u8|u16|u32|u64|u128|isize|usize))?\b/g, 'rmx-syn-number'],
  [/0[xX][\da-fA-F_]{1,20}/g, 'rmx-syn-number'],
  [/0[bB][01_]{1,64}/g, 'rmx-syn-number'],
  [/\b[a-zA-Z_]\w{0,50}(?=\s{0,5}\()/g, 'rmx-syn-function'],
  [/(?<=\.)[a-zA-Z_]\w{0,50}/g, 'rmx-syn-property'],
  [/[+\-*/%=!<>&|^]{1,3}|::|=>/g, 'rmx-syn-operator'],
  [/[{}()[\];,.]/g, 'rmx-syn-punctuation'],
];

export function tokenizeRust(code) {
  return runRules(code, RUST_RULES);
}

// ---------------------------------------------------------------------------
// Go
// ---------------------------------------------------------------------------

const GO_KEYWORDS = [
  'break', 'case', 'chan', 'const', 'continue', 'default', 'defer',
  'else', 'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import',
  'interface', 'map', 'package', 'range', 'return', 'select', 'struct',
  'switch', 'type', 'var',
];

const GO_TYPES = [
  'bool', 'byte', 'complex64', 'complex128', 'error', 'float32',
  'float64', 'int', 'int8', 'int16', 'int32', 'int64', 'rune',
  'string', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr',
];

const GO_BUILTINS = [
  'append', 'cap', 'close', 'complex', 'copy', 'delete', 'imag',
  'len', 'make', 'new', 'panic', 'print', 'println', 'real',
  'recover', 'true', 'false', 'nil', 'iota',
];

const GO_RULES = [
  [/\/\/[^\n]{0,500}/g, 'rmx-syn-comment'],
  [/\/\*[^]*?(?:\*\/|$)/g, 'rmx-syn-comment'],
  [/`[^`]{0,5000}`/g, 'rmx-syn-string'],
  [/"(?:[^"\\]|\\.){0,1000}"/g, 'rmx-syn-string'],
  [kw(GO_TYPES), 'rmx-syn-type'],
  [kw(GO_KEYWORDS), 'rmx-syn-keyword'],
  [kw(GO_BUILTINS), 'rmx-syn-builtin'],
  [/\b\d[\d_]{0,30}(?:\.\d[\d_]{0,30})?(?:[eE][+-]?\d{1,10})?\b/g, 'rmx-syn-number'],
  [/0[xX][\da-fA-F_]{1,20}/g, 'rmx-syn-number'],
  [/\b[a-zA-Z_]\w{0,50}(?=\s{0,5}\()/g, 'rmx-syn-function'],
  [/(?<=\.)[a-zA-Z_]\w{0,50}/g, 'rmx-syn-property'],
  [/:=|[+\-*/%=!<>&|^]{1,3}/g, 'rmx-syn-operator'],
  [/[{}()[\];,.]/g, 'rmx-syn-punctuation'],
];

export function tokenizeGo(code) {
  return runRules(code, GO_RULES);
}

// ---------------------------------------------------------------------------
// Java
// ---------------------------------------------------------------------------

const JAVA_KEYWORDS = [
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch',
  'char', 'class', 'const', 'continue', 'default', 'do', 'double',
  'else', 'enum', 'extends', 'final', 'finally', 'float', 'for',
  'goto', 'if', 'implements', 'import', 'instanceof', 'int',
  'interface', 'long', 'native', 'new', 'package', 'private',
  'protected', 'public', 'return', 'short', 'static', 'strictfp',
  'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
  'transient', 'try', 'void', 'volatile', 'while', 'var', 'record',
  'sealed', 'permits', 'yield',
];

const JAVA_TYPES = [
  'String', 'Integer', 'Long', 'Double', 'Float', 'Boolean', 'Byte',
  'Character', 'Short', 'Object', 'List', 'Map', 'Set', 'Collection',
  'ArrayList', 'HashMap', 'HashSet', 'Optional', 'Stream',
];

const JAVA_BUILTINS = [
  'true', 'false', 'null', 'System', 'Math', 'Arrays', 'Collections',
];

const JAVA_RULES = [
  [/\/\/[^\n]{0,500}/g, 'rmx-syn-comment'],
  [/\/\*[^]*?(?:\*\/|$)/g, 'rmx-syn-comment'],
  [/"(?:[^"\\]|\\.){0,1000}"/g, 'rmx-syn-string'],
  [/'(?:[^'\\]|\\.){1,4}'/g, 'rmx-syn-string'],
  [/@\w{1,50}/g, 'rmx-syn-decorator'],
  [kw(JAVA_TYPES), 'rmx-syn-type'],
  [kw(JAVA_KEYWORDS), 'rmx-syn-keyword'],
  [kw(JAVA_BUILTINS), 'rmx-syn-builtin'],
  [/\b\d[\d_]{0,30}(?:\.\d[\d_]{0,30})?(?:[eE][+-]?\d{1,10})?[lLfFdD]?\b/g, 'rmx-syn-number'],
  [/0[xX][\da-fA-F_]{1,20}[lL]?/g, 'rmx-syn-number'],
  [/0[bB][01_]{1,64}[lL]?/g, 'rmx-syn-number'],
  [/\b[a-zA-Z_]\w{0,50}(?=\s{0,5}\()/g, 'rmx-syn-function'],
  [/(?<=\.)[a-zA-Z_]\w{0,50}/g, 'rmx-syn-property'],
  [/[+\-*/%=!<>&|^~?:]{1,3}|->/g, 'rmx-syn-operator'],
  [/[{}()[\];,.]/g, 'rmx-syn-punctuation'],
];

export function tokenizeJava(code) {
  return runRules(code, JAVA_RULES);
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

const HTML_RULES = [
  [/<!--[^]*?(?:-->|$)/g, 'rmx-syn-comment'],
  [/<!DOCTYPE[^>]{0,200}>/gi, 'rmx-syn-entity'],
  [/<\/?[a-zA-Z][\w.-]{0,50}/g, 'rmx-syn-tag'],
  [/\/?>/g, 'rmx-syn-tag'],
  [/\b[a-zA-Z_:][\w:.-]{0,50}(?=\s{0,5}=)/g, 'rmx-syn-attr-name'],
  [/=\s{0,5}"[^"]{0,1000}"/g, 'rmx-syn-attr-value'],
  [/=\s{0,5}'[^']{0,1000}'/g, 'rmx-syn-attr-value'],
  [/&\w{1,20};/g, 'rmx-syn-entity'],
];

export function tokenizeHTML(code) {
  return runRules(code, HTML_RULES);
}

// ---------------------------------------------------------------------------
// Plain Text
// ---------------------------------------------------------------------------

export function tokenizePlainText(code) {
  return [{ text: code, className: null }];
}

// ---------------------------------------------------------------------------
// Language map & supported languages list
// ---------------------------------------------------------------------------

export const LANGUAGE_MAP = {
  javascript: tokenizeJavaScript,
  js: tokenizeJavaScript,
  jsx: tokenizeJavaScript,
  typescript: tokenizeJavaScript,
  ts: tokenizeJavaScript,
  tsx: tokenizeJavaScript,
  python: tokenizePython,
  py: tokenizePython,
  css: tokenizeCSS,
  sql: tokenizeSQL,
  json: tokenizeJSON,
  bash: tokenizeBash,
  sh: tokenizeBash,
  shell: tokenizeBash,
  zsh: tokenizeBash,
  rust: tokenizeRust,
  rs: tokenizeRust,
  go: tokenizeGo,
  golang: tokenizeGo,
  java: tokenizeJava,
  html: tokenizeHTML,
  htm: tokenizeHTML,
  xml: tokenizeHTML,
  svg: tokenizeHTML,
  plaintext: tokenizePlainText,
  text: tokenizePlainText,
  txt: tokenizePlainText,
};

export const SUPPORTED_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'css', label: 'CSS' },
  { id: 'sql', label: 'SQL' },
  { id: 'json', label: 'JSON' },
  { id: 'bash', label: 'Bash' },
  { id: 'rust', label: 'Rust' },
  { id: 'go', label: 'Go' },
  { id: 'java', label: 'Java' },
  { id: 'html', label: 'HTML' },
  { id: 'plaintext', label: 'Plain Text' },
];

// ---------------------------------------------------------------------------
// Extensible Language Registry
// ---------------------------------------------------------------------------

/**
 * Register a custom language tokenizer.
 *
 * @param {string} id - Language identifier (e.g. 'ruby', 'swift')
 * @param {string} label - Display label (e.g. 'Ruby', 'Swift')
 * @param {function} tokenizer - Function that takes source code string and
 *   returns an array of { text: string, className: string | null } tokens.
 *   className should use the `rmx-syn-` prefix (e.g. 'rmx-syn-keyword').
 * @param {string[]} [aliases] - Additional identifiers that map to this
 *   tokenizer (e.g. ['rb'] for Ruby).
 */
export function registerLanguage(id, label, tokenizer, aliases = []) {
  if (!id || typeof id !== 'string') throw new Error('registerLanguage: id is required')
  if (!label || typeof label !== 'string') throw new Error('registerLanguage: label is required')
  if (typeof tokenizer !== 'function') throw new Error('registerLanguage: tokenizer must be a function')

  LANGUAGE_MAP[id.toLowerCase()] = tokenizer
  for (const alias of aliases) {
    LANGUAGE_MAP[alias.toLowerCase()] = tokenizer
  }

  // Add to SUPPORTED_LANGUAGES if not already present
  if (!SUPPORTED_LANGUAGES.find(l => l.id === id)) {
    SUPPORTED_LANGUAGES.push({ id, label })
  }
}

/**
 * Unregister a previously registered language tokenizer.
 * Built-in languages can also be removed.
 *
 * @param {string} id - Language identifier to remove
 * @param {string[]} [aliases] - Aliases to also remove
 */
export function unregisterLanguage(id, aliases = []) {
  delete LANGUAGE_MAP[id.toLowerCase()]
  for (const alias of aliases) {
    delete LANGUAGE_MAP[alias.toLowerCase()]
  }
  const idx = SUPPORTED_LANGUAGES.findIndex(l => l.id === id)
  if (idx !== -1) SUPPORTED_LANGUAGES.splice(idx, 1)
}

// ---------------------------------------------------------------------------
// Public tokenize(code, language) API
// ---------------------------------------------------------------------------

/**
 * Tokenize source code using the appropriate language tokenizer.
 * Returns an array of { type, value } tokens where `type` is either
 * 'plain' or a token kind (e.g. 'keyword', 'string', 'comment').
 * Returns null if no tokenizer is available for the language.
 *
 * @param {string} code - Source code to tokenize
 * @param {string} language - Language identifier (e.g. 'javascript', 'python')
 * @returns {{ type: string, value: string }[] | null}
 */
export function tokenize(code, language) {
  const tokenizer = LANGUAGE_MAP[language?.toLowerCase()]
  if (!tokenizer || tokenizer === tokenizePlainText) return null

  const rawTokens = tokenizer(code)
  // Convert internal { text, className } format to public { type, value } format
  return rawTokens.map(({ text, className }) => ({
    type: className ? className.replace('rmx-syn-', '') : 'plain',
    value: text,
  }))
}

/**
 * Helper exported for consumers who want to build custom tokenizers using
 * the same regex-rule engine used by all built-in tokenizers.
 *
 * @param {string} code - Source code to tokenize
 * @param {Array<[RegExp, string|null]>} rules - Ordered regex rules
 * @returns {{ text: string, className: string|null }[]}
 */
export { runRules }

// ---------------------------------------------------------------------------
// Language detection heuristic
// ---------------------------------------------------------------------------

/**
 * Guess the language of a code snippet by checking for distinctive patterns.
 * Returns a language id string (a key in LANGUAGE_MAP) or 'plaintext'.
 */
export function detectLanguage(code) {
  if (!code || typeof code !== 'string') return 'plaintext';

  const trimmed = code.trimStart();
  const first200 = trimmed.slice(0, 200);
  const lower = first200.toLowerCase();

  // JSON — starts with { or [, try to parse
  if (/^\s*[{\[]/.test(trimmed)) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON — could still be JS/other
    }
  }

  // HTML — starts with a tag or doctype
  if (/^\s*<!doctype\s+html/i.test(trimmed) || /^\s*<(?:html|head|body|div|span|p|a|img|ul|ol|li|table|form|section|header|footer|nav|main|article)\b/i.test(trimmed)) {
    return 'html';
  }

  // SQL — starts with common SQL keywords
  if (/^\s*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|GRANT|EXPLAIN)\b/i.test(trimmed)) {
    return 'sql';
  }

  // Python — def, import os/sys/re, class Foo:, elif, #!.*python
  if (/^#!.*python/i.test(trimmed) || /^\s*(?:def |class \w+[:(]|from \w+ import|import (?:os|sys|re|json|math|typing|collections|pathlib|django|flask|numpy|pandas))\b/.test(trimmed)) {
    return 'python';
  }

  // Rust — fn main, use std, let mut, impl, #[derive
  if (/^\s*(?:fn |use std|pub fn|impl |#\[derive|mod \w+;|extern crate)/.test(trimmed)) {
    return 'rust';
  }

  // Go — package main, import (, func main
  if (/^\s*(?:package \w+|func (?:main|\w+)\(|import \()/.test(trimmed)) {
    return 'go';
  }

  // Java — public class, import java, @Override
  if (/^\s*(?:(?:public|private|protected)\s+(?:class|interface|enum|abstract)|import java|@Override|package [a-z]+\.)/.test(trimmed)) {
    return 'java';
  }

  // Bash — #!/bin/bash, #!/bin/sh, common shell patterns
  if (/^#!\/(?:bin\/(?:ba)?sh|usr\/bin\/env (?:ba)?sh)/.test(trimmed) || /^\s*(?:export |alias |source |if \[)/.test(trimmed)) {
    return 'bash';
  }

  // CSS — selectors, @media, @import url
  if (/^\s*(?:@(?:media|import|charset|keyframes|font-face)|[.#][\w-]+\s*\{|:root\s*\{|\*\s*\{|body\s*\{)/.test(trimmed)) {
    return 'css';
  }

  // JavaScript/TypeScript — import/export/const/let/var, arrow functions, React
  if (/^\s*(?:import |export |const |let |var |function |class |async |'use strict')/.test(trimmed) || /=>/.test(first200) || /(?:React|require\(|module\.exports)/.test(first200)) {
    return 'javascript';
  }

  return 'plaintext';
}
