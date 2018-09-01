
'use strict'

const {app, context} = require('../server')()
const assert = require('assert')
const sinon = require('sinon')
const request = require('supertest')
const proxyquire = require('proxyquire')

describe('auth controller', () => {

  let server = null

  const login = sinon.stub()
  const register = sinon.stub()

  beforeEach(done => {
    const auth = proxyquire('../../api/auth', {
      '../services/auth': {
        login,
        register
      }
    })
    context.use('/', auth)
    server = app.listen(3001, done)
  })

  afterEach(done => {
    login.reset()
    register.reset()
    server.close(done)
  })

  describe('logout', () => {

    it('should work properly', async () => {
      await request(server).post('/logout')
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
      await request(server)
        .post(uri)
        .send(payload)
        .expect(400, {status: 400, message: 'identifier must be provided'})
      assert.equal(login.callCount, 0)
    })

    it('fails with no password', async () => {
      delete payload.password
      await request(server)
        .post(uri)
        .send(payload)
        .expect(400, {status: 400, message: 'password must be provided'})
      assert.equal(login.callCount, 0)
    })

    it('returns failures from service', async () => {
      login.rejects({status: 401, error: 'unauthorized'})
      await request(server)
        .post(uri)
        .send(payload)
        .expect(401, {status: 401})
      assert.equal(login.callCount, 1)
    })

    it('logs user in upon success', async () => {
      login.resolves({user_id: '12345'})
      await request(server).post(uri).send(payload).expect(200, {success: true})
      assert.equal(login.callCount, 1)
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
      assert.equal(register.callCount, 0)
    })

    it('fails with no password', async () => {
      delete payload.password
      await request(server)
        .post(uri)
        .send(payload)
        .expect(400, {status: 400, message: 'password must be provided'})
      assert.equal(register.callCount, 0)
    })

    it('returns failures from services', async () => {
      register.rejects({status: 401, error: 'invalid username or password'})
      await request(server)
        .post(uri)
        .send(payload)
        .expect(401, {status: 401})
      assert.equal(register.callCount, 1)
    })

    it('returns token upon success', async () => {
      register.resolves({user_id: '12345'})
      await request(server)
        .post(uri)
        .send(payload)
        .expect(200, {success: true})
      assert.equal(register.callCount, 1)
    })
  })

})

