
'use strict'

const pino = require('pino')
const assert = require('assert')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

describe('create', () => {

  let payload = null
  let create = null
  let query = null
  let verify_token = null

  beforeEach(() => {
    query = sinon.stub()
    verify_token = sinon.stub()
    create = proxyquire('../api/create', {
      '../lib/pg': {query},
      '../lib/logger': pino({level: 'silent'}),
      'auth-helper': {verify_token}
    })
    payload = {
      token: '',
      text: 'new todo'
    }
    verify_token.resolves({user_id: '12345'}) // default action
  })

  it('should return auth errors on bad token', async () => {
    verify_token.rejects(new Error('aw snap!'))
    const result = await create(payload)
    assert.deepEqual(result, {status: 401, error: {code: 'TOKEN_INVALID', error: new Error('aw snap!')}})
    assert.equal(query.callCount, 0)
  })

  it('should return bad request if text not provided', async () => {
    delete payload.text
    const result = await create(payload)
    assert.deepEqual(result, {status: 400, error: {code: 'TEXT_NOT_PROVIDED'}})
    assert.equal(query.callCount, 0)
  })

  it('should return unprocessable if no rows returned', async () => {
    query.resolves({rows: []})
    const result = await create(payload)
    assert.deepEqual(result, {status: 422, error: {code: 'TODO_NOT_ADDED'}})
  })

  it('should return success code', async () => {
    query.resolves({rows: [{add_todo: 123}]})
    const result = await create(payload)
    assert.deepEqual(result, {status: 200, result: {todo_id: 123}})
  })

  it('should return database errors properly', async () => {
    query.rejects(new Error('aw snap!'))
    const result = await create(payload)
    assert.deepEqual(result, {status: 500, error: {code: 'DATABASE_ERROR', error: new Error('aw snap!')}})
  })

})
