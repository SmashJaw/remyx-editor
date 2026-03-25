/**
 * Load a RemyxEditor configuration from a URL (JSON or YAML).
 *
 * Supports:
 * - JSON files (.json or any URL returning application/json)
 * - YAML files (.yml, .yaml) — parsed via a lightweight inline parser
 * - Environment-based config merging via `env` key
 * - Fetching from local file paths or remote URLs
 *
 * @param {string} url - URL or path to a JSON/YAML configuration file
 * @param {object} [options]
 * @param {string} [options.env] - Environment name for config merging (e.g., 'production', 'development')
 * @param {Record<string, string>} [options.headers] - Custom fetch headers (e.g., Authorization)
 * @param {AbortSignal} [options.signal] - AbortController signal for cancellation
 * @returns {Promise<object>} The resolved configuration object
 */
export async function loadConfig(url, options = {}) {
  const { env, headers, signal } = options

  const response = await fetch(url, {
    headers: { Accept: 'application/json, text/yaml, text/plain', ...headers },
    signal,
  })

  if (!response.ok) {
    throw new Error(`loadConfig: Failed to fetch "${url}" (HTTP ${response.status})`)
  }

  const text = await response.text()
  let config

  // Detect format: YAML if extension is .yml/.yaml, or if content doesn't start with { or [
  const isYaml = /\.ya?ml(\?.*)?$/i.test(url)
  if (isYaml) {
    config = parseSimpleYaml(text)
  } else {
    try {
      config = JSON.parse(text)
    } catch {
      // Fallback: try YAML parse if JSON fails
      config = parseSimpleYaml(text)
    }
  }

  if (!config || typeof config !== 'object') {
    throw new Error('loadConfig: Configuration must be a JSON/YAML object')
  }

  // Environment-based merging
  if (env && config.env && typeof config.env === 'object') {
    const envOverrides = config.env[env]
    if (envOverrides && typeof envOverrides === 'object') {
      const { env: _envKey, ...baseConfig } = config
      config = deepMerge(baseConfig, envOverrides)
    } else {
      const { env: _envKey, ...baseConfig } = config
      config = baseConfig
    }
  } else if (config.env) {
    // Strip the env key if no env option was provided
    const { env: _envKey, ...baseConfig } = config
    config = baseConfig
  }

  return config
}

/**
 * Deep merge two objects. Arrays are replaced, not merged.
 * @param {object} target
 * @param {object} source
 * @returns {object}
 */
function deepMerge(target, source) {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}

/**
 * Lightweight YAML parser for simple key-value and nested object configs.
 * Handles: strings, numbers, booleans, null, arrays (inline [...] and block - items),
 * nested objects via indentation, and quoted strings.
 *
 * This is NOT a full YAML parser — it covers the subset used in editor configs.
 * For complex YAML, use the `js-yaml` library and pass the parsed result to defineConfig().
 *
 * @param {string} text
 * @returns {object}
 */
function parseSimpleYaml(text) {
  const lines = text.split('\n')
  const root = {}
  const stack = [{ obj: root, indent: -1 }]

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    // Skip empty lines and comments
    if (/^\s*(#.*)?$/.test(raw)) continue

    const match = raw.match(/^(\s*)(.+)$/)
    if (!match) continue

    const indent = match[1].length
    const content = match[2]

    // Pop stack to find parent at correct indent level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }
    const parent = stack[stack.length - 1].obj

    // Array item (block style)
    const arrayMatch = content.match(/^-\s+(.*)$/)
    if (arrayMatch) {
      // Find the key that this array belongs to — it's the parent
      const val = parseYamlValue(arrayMatch[1])
      if (Array.isArray(parent)) {
        parent.push(val)
      }
      continue
    }

    // Key: value pair
    const kvMatch = content.match(/^([^:]+?):\s*(.*)$/)
    if (kvMatch) {
      const key = kvMatch[1].trim()
      const rawValue = kvMatch[2].trim()

      if (rawValue === '' || rawValue === '|' || rawValue === '>') {
        // Could be a nested object or a block array — check next line
        const nextLine = lines[i + 1]
        if (nextLine && /^\s+-\s/.test(nextLine)) {
          // Block array
          const arr = []
          parent[key] = arr
          stack.push({ obj: arr, indent })
        } else {
          // Nested object
          const nested = {}
          parent[key] = nested
          stack.push({ obj: nested, indent })
        }
      } else {
        parent[key] = parseYamlValue(rawValue)
      }
    }
  }

  return root
}

/**
 * Parse a simple YAML scalar value.
 */
function parseYamlValue(str) {
  if (str === 'true') return true
  if (str === 'false') return false
  if (str === 'null' || str === '~') return null

  // Inline array: [a, b, c]
  if (str.startsWith('[') && str.endsWith(']')) {
    return str.slice(1, -1).split(',').map(s => parseYamlValue(s.trim()))
  }

  // Quoted string
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1)
  }

  // Number
  const num = Number(str)
  if (!isNaN(num) && str !== '') return num

  return str
}
