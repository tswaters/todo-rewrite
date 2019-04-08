const assert = require('assert')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const pino = require('pino')

describe('register', () => {
  let register = null
  let payload = null
  let query = null

  beforeEach(() => {
    query = sinon.stub()
    register = proxyquire('../api/register', {
      '../lib/pg': { connect: () => ({ query, release: () => {} }) },
      '../lib/logger': pino({ level: 'silent' }),
    })
    payload = { identifier: 'test', password: 'test' }
  })

  it('fails with no identifier', async () => {
    delete payload.identifier
    const result = await register(payload)
    assert.deepEqual(result, {
      status: 400,
      error: { code: 'IDENTIFIER_NOT_PROVIDED' },
    })
    assert.equal(query.callCount, 0)
  })

  it('fails with no password', async () => {
    delete payload.password
    const result = await register(payload)
    assert.deepEqual(result, {
      status: 400,
      error: { code: 'PASSWORD_NOT_PROVIDED' },
    })
    assert.equal(query.callCount, 0)
  })

  it('returns failures from db', async () => {
    query.rejects(new Error('aw snap!'))
    const result = await register(payload)
    assert.deepEqual(result, {
      status: 500,
      error: { code: 'DATABASE_ERROR', error: new Error('aw snap!') },
    })
    assert.equal(query.callCount, 1)
  })

  it('returns not found from db', async () => {
    query.resolves({ rows: [] })
    const result = await register(payload)
    assert.deepEqual(result, { status: 401, error: { code: 'INVALID_USER' } })
    assert.equal(query.callCount, 1)
  })

  it('returns unique constraint specially', async () => {
    query.rejects({ code: '23505' })
    const result = await register(payload)
    assert.deepEqual(result, { status: 400, error: { code: 'DUPLICATE_USER' } })
    assert.equal(query.callCount, 1)
  })

  it('returns token upon success', async () => {
    query.resolves({ rows: [{ user_id: '12345' }] })
    const result = await register(payload)
    assert.deepEqual(result, { status: 200, result: { user_id: '12345' } })
  })
})
