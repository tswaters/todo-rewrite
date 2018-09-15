
const {sprintf} = require('sprintf-js')

const keys = {}

function init (locale, values) {
  keys[locale] = values
}

function get (key, locale) {

  if (keys[locale] == null || keys[locale][key] == null) {
    return key
  }

  return keys[locale][key]
}

function update (key, locale, value) {

  if (keys[locale] == null) {
    keys[locale] = {}
  }

  keys[locale][key] = value
}

function translate (key, locale, replacements = []) {
  return sprintf(get(key, locale), ...replacements)
}

module.exports = {init, get, update, translate}
