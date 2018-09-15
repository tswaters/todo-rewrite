
'use strict'

const pino = require('pino')
const assert = require('assert')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

describe('fetch', () => {

  let payload = null
  let fetch = null
  let query = null
  let verify_token = null

  beforeEach(() => {
    query = sinon.stub()
    verify_token = sinon.stub()
    fetch = proxyquire('../api/fetch', {
      '../lib/pg': {query},
      '../lib/logger': pino({level: 'silent'}),
      'auth-helper': {verify_token}
    })
    payload = {
      token: ''
    }
    verify_token.resolves({user_id: '12345'}) // default action
  })

  it('should return auth errors on bad token', async () => {
    verify_token.rejects(new Error('aw snap!'))
    const result = await fetch(payload)
    assert.deepEqual(result, {status: 401, error: {code: 'TOKEN_INVALID', error: new Error('aw snap!')}})
    assert.equal(query.callCount, 0)
  })

  it('should return success code', async () => {
    query.resolves({rows: [{todo_id: 1}, {todo_id: 2}]})
    const result = await fetch(payload)
    assert.deepEqual(result, {status: 200, result: [{todo_id: 1}, {todo_id: 2}]})
  })

  it('should return database errors properly', async () => {
    query.rejects(new Error('aw snap!'))
    const result = await fetch(payload)
    assert.deepEqual(result, {status: 500, error: {code: 'DATABASE_ERROR', error: new Error('aw snap!')}})
  })

})
