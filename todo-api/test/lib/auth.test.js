
'use strict'

const assert = require('assert')
const sinon = require('sinon')
//const auth = require('../../lib/auth')

describe('lib/auth', () => {

  let auth = null
  let clock = null
  const user = {user_id: '12345', roles: [], identifier: 'test'}

  beforeEach(() => {
    delete require.cache[require.resolve('../../lib/auth')]
    clock = sinon.useFakeTimers()
    auth = require('../../lib/auth')
  })

  afterEach(() => {
    clock.restore()
  })

  it('should work properly', async () => {

    const encoded = await auth.sign_token(user)
    assert(encoded.success)
    assert(encoded.token)

    const decoded = await auth.verify_token(encoded.token)
    assert(decoded.success)
    assert.deepEqual(decoded.user, user)

    try {
      await auth.verify_token()
    } catch (err) {
      assert.equal(err.status, 401)
      assert.equal(err.message, 'invalid token')
    }

    try {
      await auth.verify_token('completely invalid')
    } catch (err) {
      assert.equal(err.status, 401)
      assert.equal(err.message, 'invalid token')
    }

    await auth.revoke_token(encoded.token_id)

    try {
      await auth.verify_token(encoded.token)
      assert.ok(false)
    } catch (err) {
      assert.equal(err.status, 401)
      assert.equal(err.message, 'invalid token')
    }

  })

  it('should handle expiry properly', async () => {

    const encoded = await auth.sign_token(user)
    assert(encoded.success)
    assert(encoded.token)

    clock.tick(450 * 1000) // refreshes token
    await auth.verify_token(encoded.token)

    clock.tick(901 * 1000) // token is expired

    try {
      await auth.verify_token(encoded.token)
      assert.ok(false)
    } catch (err) {
      assert.equal(err.status, 401)
      assert.equal(err.message, 'invalid token')
    }

  })

})
