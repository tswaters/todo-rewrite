
'use strict'

const {app, context} = require('../server')()
const assert = require('assert')
const sinon = require('sinon')
const request = require('supertest')
const proxyquire = require('proxyquire')

describe('auth', () => {

  let server = null

  const revoke_token = sinon.stub()
  const sign_token = sinon.stub()
  const query = sinon.stub()

  beforeEach(done => {
    const auth = proxyquire('../../api/auth', {
      '../lib/auth': {
        revoke_token,
        sign_token
      },
      '../lib/db': {
        query
      }
    })
    context.use('/', auth)
    server = app.listen(3001, done)
  })

  afterEach(done => {
    revoke_token.reset()
    sign_token.reset()
    query.reset()
    server.close(done)
  })

  describe('logout', () => {

    it('should work properly', async () => {
      await request(server).post('/logout')
      assert.equal(revoke_token.callCount, 1)
    })

  })

  describe('login', () => {

    const uri = '/login'
    let payload = null

    beforeEach(() => {
      payload = {identifier: 'test', password: 'test'}
    })

    it('fails with no identifier', async () => {
      delete payload.identifier
      await request(server).post(uri).send(payload).expect(400)
      assert.equal(query.callCount, 0)
    })

    it('fails with no password', async () => {
      delete payload.password
      await request(server).post(uri).send(payload).expect(400)
      assert.equal(query.callCount, 0)
    })

    it('returns failures from db', async () => {
      query.resolves({rows: []})
      await request(server).post(uri).send(payload).expect(401)
      assert.equal(query.callCount, 1)
    })

    it('returns token upon success', async () => {
      query.resolves({rows: [{}]})
      sign_token.resolves({token: 'token'})
      await request(server).post(uri).send(payload).expect(200, {success: true, token: 'token'})
      assert.equal(query.callCount, 1)
      assert.equal(sign_token.callCount, 1)
    })

  })

  describe('register', () => {

    const uri = '/register'
    let payload = null

    beforeEach(() => {
      payload = {identifier: 'test', password: 'test'}
    })

    it('fails with no identifier', async () => {
      delete payload.identifier
      await request(server)
        .post(uri)
        .send(payload)
        .expect(400, {status: 400, message: 'identifier must be provided'})
      assert.equal(query.callCount, 0)
    })

    it('fails with no password', async () => {
      delete payload.password
      await request(server)
        .post(uri)
        .send(payload)
        .expect(400, {status: 400, message: 'password must be provided'})
      assert.equal(query.callCount, 0)
    })

    it('returns failures from db', async () => {
      query.resolves({rows: []})
      await request(server)
        .post(uri)
        .send(payload)
        .expect(401, {status: 401, message: 'invalid username or password'})
      assert.equal(query.callCount, 1)
    })

    it('returns unique constraint specially', async () => {
      query.rejects({code: '23505'})
      await request(server)
        .post(uri)
        .send(payload)
        .expect(400, {status: 400, message: 'user account already exists'})
      assert.equal(query.callCount, 1)
    })

    it('returns token upon success', async () => {
      query.resolves({rows: [{}]})
      sign_token.resolves({token: 'token'})
      await request(server)
        .post(uri)
        .send(payload)
        .expect(200, {success: true, token: 'token'})
      assert.equal(query.callCount, 1)
      assert.equal(sign_token.callCount, 1)
    })
  })

})

