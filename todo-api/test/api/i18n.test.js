'use strict'

const { app, context } = require('../server')()
const assert = require('assert')
const sinon = require('sinon')
const request = require('supertest')
const proxyquire = require('proxyquire')
const { negotiate } = require('../../lib/errors')

describe('i18n controller', () => {
  let server = null

  const fetch = sinon.stub()
  const update = sinon.stub()

  beforeEach(done => {
    const localization = proxyquire('../../api/i18n', {
      '../services/i18n': { fetch, update },
    })
    context.use('/', localization)
    server = app.listen(3001, done)
  })

  afterEach(done => {
    fetch.reset()
    update.reset()
    server.close(done)
  })

  describe('fetch', () => {
    const uri = '/'
    let payload = null

    beforeEach(() => {
      payload = { locale: 'en', keys: ['test 1', 'test 2'] }
    })

    it('fails with no locale', async () => {
      delete payload.locale
      await request(server)
        .get(uri)
        .query(payload)
        .expect(400, {
          status: 400,
          code: 'LOCALE_NOT_PROVIDED',
          message: 'ERROR.LOCALE_NOT_PROVIDED',
        })
      assert.equal(fetch.callCount, 0)
    })

    it('fails with locale being bad type', async () => {
      payload.locale = 12345
      await request(server)
        .get(uri)
        .query(payload)
        .expect(400, {
          status: 400,
          code: 'LOCALE_NOT_PROVIDED',
          message: 'ERROR.LOCALE_NOT_PROVIDED',
        })
      assert.equal(fetch.callCount, 0)
    })

    it('fails with invalid locale', async () => {
      payload.locale = 'invalid'
      await request(server)
        .get(uri)
        .query(payload)
        .expect(400, {
          status: 400,
          code: 'LOCALE_NOT_PROVIDED',
          message: 'ERROR.LOCALE_NOT_PROVIDED',
        })
      assert.equal(fetch.callCount, 0)
    })

    it('returns failures from db', async () => {
      fetch.rejects(negotiate({ code: 'DATABASE_ERROR' }, 500))
      await request(server)
        .get(uri)
        .query(payload)
        .then(res => {
          assert.equal(res.body.code, 'DATABASE_ERROR')
          assert.equal(res.body.message, 'ERROR.DATABASE_ERROR')
        })
      assert.equal(fetch.callCount, 1)
    })

    it('returns keys upon success', async () => {
      fetch.resolves({ 'test 1': 'value 1', 'test 2': 'value 2' })
      await request(server)
        .get(uri)
        .query(payload)
        .expect(200, { 'test 1': 'value 1', 'test 2': 'value 2' })
      assert.equal(fetch.callCount, 1)
    })
  })
})
