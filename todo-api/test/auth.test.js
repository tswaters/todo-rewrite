
'use strict'

const {app, context} = require('./server')()
const assert = require('assert')
const sinon = require('sinon')
const request = require('supertest')
const proxyquire = require('proxyquire')

describe('auth', () => {

  let server = null

  const revoke_token = sinon.stub()
  const sign_token = sinon.stub()

  beforeEach(done => {
    const auth = proxyquire('../api/auth', {
      '../lib/auth': {
        revoke_token,
        sign_token
      }
    })
    context.use('/', auth)
    server = app.listen(3001, done)
  })

  afterEach(done => {
    revoke_token.reset()
    sign_token.reset()
    server.close(done)
  })

  describe('logout', () => {

    it('should work properly', async () => {
      await request(server).post('/logout')
      assert.equal(revoke_token.callCount, 1)
    })

  })

  describe('login', () => {

    it('')

  })

  describe('register', () => {

    it('fails with no identifier')

    it('fails with no password')

    it('fails with no identifier')

  })

})

