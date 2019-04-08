'use strict'

const pino = require('pino')
const assert = require('assert')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

describe('complete', () => {
  let payload = null
  let complete = null
  let query = null
  let verify_token = null

  beforeEach(() => {
    query = sinon.stub()
    verify_token = sinon.stub()
    complete = proxyquire('../api/complete', {
      '../lib/pg': { query },
      '../lib/logger': pino({ level: 'silent' }),
      'auth-helper': { verify_token },
    })
    payload = {
      token: '',
      todo_id: 123,
      complete: true,
    }
    verify_token.resolves({ user_id: '12345' }) // default action
  })

  it('should return auth errors on bad token', async () => {
    verify_token.rejects(new Error('aw snap!'))
    const result = await complete(payload)
    assert.deepEqual(result, {
      status: 401,
      error: { code: 'TOKEN_INVALID', error: new Error('aw snap!') },
    })
    assert.equal(query.callCount, 0)
  })

  it('should return bad request if todo_id not provided', async () => {
    delete payload.todo_id
    const result = await complete(payload)
    assert.deepEqual(result, {
      status: 400,
      error: { code: 'TODO_ID_NOT_PROVIDED' },
    })
    assert.equal(query.callCount, 0)
  })

  it('should return bad request if complete not provided', async () => {
    delete payload.complete
    const result = await complete(payload)
    assert.deepEqual(result, {
      status: 400,
      error: { code: 'COMPLETE_NOT_PROVIDED' },
    })
    assert.equal(query.callCount, 0)
  })

  it('should return unprocessable if no rows returned', async () => {
    query.resolves({ rows: [] })
    const result = await complete(payload)
    assert.deepEqual(result, {
      status: 422,
      error: { code: 'TODO_NOT_COMPLETED' },
    })
  })

  it('should return success code', async () => {
    query.resolves({ rows: [{ update_todo_complete: null }] })
    const result = await complete(payload)
    assert.deepEqual(result, { status: 200, result: null })
  })

  it('should return database errors properly', async () => {
    query.rejects(new Error('aw snap!'))
    const result = await complete(payload)
    assert.deepEqual(result, {
      status: 500,
      error: { code: 'DATABASE_ERROR', error: new Error('aw snap!') },
    })
  })
})
