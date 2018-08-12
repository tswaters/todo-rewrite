
'use strict'

const {app, context} = require('./server')()
const assert = require('assert')
const sinon = require('sinon')
const request = require('supertest')
const proxyquire = require('proxyquire')

describe('localization', () => {

  let server = null

  const query = sinon.stub()

  beforeEach(done => {
    const localization = proxyquire('../api/localization', {
      '../lib/db': {
        query
      }
    })
    context.use('/', localization)
    server = app.listen(3001, done)
  })

  afterEach(done => {
    query.reset()
    server.close(done)
  })

  describe('fetch', () => {

    const uri = '/fetch'
    let payload = null

    beforeEach(() => {
      payload = {locale: 'en', keys: ['test 1', 'test 2']}
    })

    it('fails with no locale', async () => {
      delete payload.locale
      await request(server)
        .post(uri)
        .send(payload)
        .expect(400, {status: 400, message: 'valid locale must be provided'})
      assert.equal(query.callCount, 0)
    })

    it('fails with locale being bad type', async () => {
      payload.locale = 12345
      await request(server)
        .post(uri)
        .send(payload)
        .expect(400, {status: 400, message: 'valid locale must be provided'})
      assert.equal(query.callCount, 0)
    })

    it('fails with invalid locale', async () => {
      payload.locale = 'invalid'
      await request(server)
        .post(uri)
        .send(payload)
        .expect(400, {status: 400, message: 'valid locale must be provided'})
      assert.equal(query.callCount, 0)
    })

    it('fails with no keys', async () => {
      delete payload.keys
      await request(server)
        .post(uri)
        .send(payload)
        .expect(400, {status: 400, message: 'keys must be provided'})
      assert.equal(query.callCount, 0)
    })

    it('fails with keys being bad type', async () => {
      payload.keys = 'invalid'
      await request(server)
        .post(uri)
        .send(payload)
        .expect(400, {status: 400, message: 'keys must be provided'})
      assert.equal(query.callCount, 0)
    })

    it('fails with no keys provided', async () => {
      payload.keys = []
      await request(server)
        .post(uri)
        .send(payload)
        .expect(400, {status: 400, message: 'keys must be provided'})
      assert.equal(query.callCount, 0)
    })

    it('returns failures from db', async () => {
      query.rejects(new Error('aw snap!'))
      await request(server)
        .post(uri)
        .send(payload)
        .expect(500)
      assert.equal(query.callCount, 1)
    })

    it('returns keys upon success', async () => {
      query.resolves({rows: [
        {key: 'test 1', value: 'value 1'},
        {key: 'test 2', value: 'value 2'}
      ]})
      await request(server)
        .post(uri)
        .send(payload)
        .expect(200, {'test 1': 'value 1', 'test 2': 'value 2'})
      assert.equal(query.callCount, 1)
    })

  })

})

