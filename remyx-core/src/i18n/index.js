/**
 * Internationalization (i18n) system for the Remyx Editor.
 *
 * Provides a simple, lightweight locale system with:
 * - Default English locale included
 * - Runtime locale switching via setLocale()
 * - String lookup via t() with fallback to key
 * - Interpolation support: t('greeting', { name: 'World' }) → 'Hello, World!'
 * - Custom locale registration via registerLocale()
 */

import { en } from './locales/en.js'

/** Currently active locale strings */
let _currentLocale = { ...en }

/** Registered locale packs keyed by language code */
const _locales = { en }

/** Current language code */
let _currentLang = 'en'

/**
 * Translate a key using the current locale.
 *
 * Supports interpolation with `{{variable}}` placeholders:
 * ```js
 * t('save.status', { status: 'saved' }) // "Document saved"
 * ```
 *
 * Returns the key itself if no translation is found (safe fallback).
 *
 * @param {string} key - Dot-separated translation key (e.g., 'toolbar.bold')
 * @param {Object} [vars] - Interpolation variables
 * @returns {string} The translated string, or the key if not found
 */
export function t(key, vars) {
  let str = _currentLocale[key]
  if (str === undefined) return key

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
    }
  }

  return str
}

/**
 * Set the active locale by language code.
 *
 * @param {string} lang - Language code (e.g., 'en', 'ar', 'ja')
 * @throws {Error} If the locale has not been registered
 */
export function setLocale(lang) {
  const locale = _locales[lang]
  if (!locale) {
    throw new Error(`Locale "${lang}" is not registered. Use registerLocale() first.`)
  }
  _currentLang = lang
  // Merge with English fallback so missing keys fall through
  _currentLocale = { ...en, ...locale }
}

/**
 * Get the current language code.
 *
 * @returns {string} The active language code
 */
export function getLocale() {
  return _currentLang
}

/**
 * Register a locale pack.
 *
 * A locale pack is a flat object mapping translation keys to strings.
 * Partial packs are supported — missing keys fall back to English.
 *
 * @param {string} lang - Language code (e.g., 'fr', 'de', 'ar')
 * @param {Object} strings - Translation key-value pairs
 *
 * @example
 * registerLocale('fr', {
 *   'toolbar.bold': 'Gras',
 *   'toolbar.italic': 'Italique',
 *   'toolbar.underline': 'Souligné',
 * })
 */
export function registerLocale(lang, strings) {
  if (!lang || typeof lang !== 'string') throw new Error('registerLocale: lang is required')
  if (!strings || typeof strings !== 'object') throw new Error('registerLocale: strings object is required')
  _locales[lang] = strings
}

/**
 * Unregister a locale pack. Cannot unregister 'en' (default).
 *
 * @param {string} lang - Language code to remove
 */
export function unregisterLocale(lang) {
  if (lang === 'en') return // Cannot remove default
  delete _locales[lang]
  if (_currentLang === lang) {
    setLocale('en')
  }
}

/**
 * Get all registered locale codes.
 *
 * @returns {string[]} Array of registered language codes
 */
export function getRegisteredLocales() {
  return Object.keys(_locales)
}
