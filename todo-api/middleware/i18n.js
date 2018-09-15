
function parseAcceptLanguage (str, supported_langs) {

  if (!str || !str.split) { return null }

  return str

    .split(',')

    .map(raw => {

      const [lang, extra = 'q=1.0'] = raw.split(';')
      const quality = parseFloat(extra.split('=')[1]) || 1
      return {lang, quality}

    })

    .sort((a, b) => {

      if (a.quality < b.quality) { return 1 }
      if (a.quality === b.quality) { return 0 }
      else { return -1 }

    })

    .map(language => language.lang.toLowerCase())

    .reduce((memo, lang) => {
      if (memo) { return memo }

      if (supported_langs.indexOf(lang) > 0) {
        return lang
      }

      // if provided lang includes region, check if we match the language part
      // i.e., en-CA => en is valid language that we can match on.
      if (supported_langs.indexOf(lang.split('-')[0]) > 0) {
        return lang.split('-')[0]
      }

      return null

    }, null)

}

module.exports = (supported_langs, default_lang) => (req, res, next) => {
  const accepted_langs = req.headers['accept-language']
  supported_langs = supported_langs.map(lang => lang.toLowerCase())
  const locale = parseAcceptLanguage(accepted_langs, supported_langs)
  req.locale = locale || default_lang.toLowerCase()
  next()
}
