
'use strict'

const pino = require('pino')
const assert = require('assert')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

describe('update', () => {

  let payload = null
  let update = null
  let query = null
  let verify_token = null

  beforeEach(() => {
    query = sinon.stub()
    verify_token = sinon.stub()
    update = proxyquire('../api/update', {
      '../lib/pg': {query},
      '../lib/logger': pino({level: 'silent'}),
      'auth-helper': {verify_token}
    })
    payload = {
      token: '',
      todo_id: 123,
      text: ''
    }
    verify_token.resolves({user_id: '12345'}) // default action
  })

  it('should return auth errors on bad token', async () => {
    verify_token.rejects(new Error('aw snap!'))
    const result = await update(payload)
    assert.deepEqual(result, {status: 401, message: 'bad token', error: new Error('aw snap!')})
    assert.equal(query.callCount, 0)
  })

  it('should return bad request if todo_id not provided', async () => {
    delete payload.todo_id
    const result = await update(payload)
    assert.deepEqual(result, {status: 400, error: 'todo_id must be provided'})
    assert.equal(query.callCount, 0)
  })

  it('should return bad request if text not provided', async () => {
    delete payload.text
    const result = await update(payload)
    assert.deepEqual(result, {status: 400, error: 'text must be provided'})
    assert.equal(query.callCount, 0)
  })

  it('should return unprocessable if no rows returned', async () => {
    query.resolves({rows: []})
    const result = await update(payload)
    assert.deepEqual(result, {status: 422, error: 'could not update todo'})
  })

  it('should return success code', async () => {
    query.resolves({rows: [{update_todo_text: null}]})
    const result = await update(payload)
    assert.deepEqual(result, {status: 200, result: null})
  })

  it('should return database errors properly', async () => {
    query.rejects(new Error('aw snap!'))
    const result = await update(payload)
    assert.deepEqual(result, {status: 500, message: 'unexpected error', error: new Error('aw snap!')})
  })

})