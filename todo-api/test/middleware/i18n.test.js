'use strict'

const express = require('express')
const request = require('supertest')
const i18nMiddleware = require('../../middleware/i18n')

describe('i18n middleware', () => {
  let app = null
  let server = null

  const route = (req, res) => res.send({ locale: req.locale })

  beforeEach(done => {
    app = express()
    server = app.listen(3001, done)
  })

  afterEach(done => {
    server.close(done)
  })

  it('no language falls back on default', async () => {
    app.get('/locale', [i18nMiddleware(['en'], 'en'), route])

    await request(app)
      .get('/locale')
      .expect(200, { locale: 'en' })
  })

  it('exact language match', async () => {
    app.get('/locale', [i18nMiddleware(['af', 'en-US', 'pa'], 'en-US'), route])

    await request(app)
      .get('/locale')
      .set(
        'Accept-Language',
        'pa,sv;q=0.8,fi;q=0.7,it-ch;q=0.5,en-us;q=0.3,en;q=0.2'
      )
      .expect(200, { locale: 'pa' })
  })

  it('best locale without region', async () => {
    app.get('/locale', [i18nMiddleware(['af', 'en-US', 'pa'], 'en-US'), route])

    await request(app)
      .get('/locale')
      .set(
        'Accept-Language',
        'pa-it,sv;q=0.8,fi;q=0.7,it-ch;q=0.5,en-us;q=0.3,en;q=0.2'
      )
      .expect(200, { locale: 'pa' })
  })

  it('dont go into region without best match', async () => {
    app.get('/locale', [
      i18nMiddleware(['af', 'en-US', 'pa-IT'], 'en-US'),
      route,
    ])

    await request(app)
      .get('/locale')
      .set(
        'Accept-Language',
        'pa,sv;q=0.8,fi;q=0.7,it-ch;q=0.5,en-us;q=0.3,en;q=0.2'
      )
      .expect(200, { locale: 'en-us' })
  })

  it('dont match finnish to ligurian', async () => {
    app.get('/locale', [i18nMiddleware(['en-US', 'fi'], 'en-US'), route])

    await request(app)
      .get('/locale')
      .set(
        'Accept-Language',
        'fil-PH,fil;q=0.97,en-US;q=0.94,en;q=0.91,en-ph;' +
          'q=0.89,en-gb;q=0.86,hu-HU;q=0.83,hu;q=0.8,en-AU;q=0.77,en-nl;' +
          'q=0.74,nl-en;q=0.71,nl;q=0.69,en-HK;q=0.66,en-sg;q=0.63,en-th;' +
          'q=0.6,pl-PL;q=0.57,pl;q=0.54,fr-FR;q=0.51,fr;q=0.49,en-AE;' +
          'q=0.46,zh-CN;q=0.43,zh;q=0.4,ja-JP;q=0.37,ja;q=0.34,id-ID;' +
          'q=0.31,id;q=0.29,ru-RU;q=0.26,ru;q=0.23,de-DE;q=0.2,de;' +
          'q=0.17,ko-KR;q=0.14,ko;q=0.11,es-ES;q=0.09,es;q=0.06,en-AP;q=0.0'
      )
      .expect(200, { locale: 'en-us' })
  })

  it('support ligurian', async () => {
    app.get('/locale', [
      i18nMiddleware(['en-US', 'fi', 'fil-PH'], 'en-US'),
      route,
    ])

    await request(app)
      .get('/locale')
      .set(
        'Accept-Language',
        'fil-PH,fil;q=0.97,en-US;q=0.94,en;q=0.91,en-ph;' +
          'q=0.89,en-gb;q=0.86,hu-HU;q=0.83,hu;q=0.8,en-AU;q=0.77,en-nl;' +
          'q=0.74,nl-en;q=0.71,nl;q=0.69,en-HK;q=0.66,en-sg;q=0.63,en-th;' +
          'q=0.6,pl-PL;q=0.57,pl;q=0.54,fr-FR;q=0.51,fr;q=0.49,en-AE;' +
          'q=0.46,zh-CN;q=0.43,zh;q=0.4,ja-JP;q=0.37,ja;q=0.34,id-ID;' +
          'q=0.31,id;q=0.29,ru-RU;q=0.26,ru;q=0.23,de-DE;q=0.2,de;' +
          'q=0.17,ko-KR;q=0.14,ko;q=0.11,es-ES;q=0.09,es;q=0.06,en-AP;q=0.0'
      )
      .expect(200, { locale: 'fil-ph' })
  })

  it('support ligurian without region', async () => {
    app.get('/locale', [i18nMiddleware(['en-US', 'fi', 'fil'], 'en-US'), route])

    await request(app)
      .get('/locale')
      .set(
        'Accept-Language',
        'fil-PH,fil;q=0.97,en-US;q=0.94,en;q=0.91,en-ph;' +
          'q=0.89,en-gb;q=0.86,hu-HU;q=0.83,hu;q=0.8,en-AU;q=0.77,en-nl;' +
          'q=0.74,nl-en;q=0.71,nl;q=0.69,en-HK;q=0.66,en-sg;q=0.63,en-th;' +
          'q=0.6,pl-PL;q=0.57,pl;q=0.54,fr-FR;q=0.51,fr;q=0.49,en-AE;' +
          'q=0.46,zh-CN;q=0.43,zh;q=0.4,ja-JP;q=0.37,ja;q=0.34,id-ID;' +
          'q=0.31,id;q=0.29,ru-RU;q=0.26,ru;q=0.23,de-DE;q=0.2,de;' +
          'q=0.17,ko-KR;q=0.14,ko;q=0.11,es-ES;q=0.09,es;q=0.06,en-AP;q=0.0'
      )
      .expect(200, { locale: 'fil' })
  })
})
