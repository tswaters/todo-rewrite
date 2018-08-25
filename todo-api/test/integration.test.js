
'use strict'

const request = require('supertest')
const server = require('../server')
const {query} = require('../lib/db')
const {PORT = '3001'} = process.env

describe('todo integration', () => {

  let app = null

  before(async () => {
    await new Promise(resolve => server.listen(PORT, resolve))
    app = request.agent(server)
  })

  beforeEach(async () => {
    await query('TRUNCATE TABLE auth.user CASCADE')
  })

  after(done => {
    server.close(done)
  })

  it('authentication', async () => {

    let token = null

    // without any authentication it should fail with 401
    await app.get('/api/todo').expect(401)

    // registering should give us a valid token
    await app.post('/api/auth/register').send({identifier: 'test', password: 'test'}).expect(200).then(res => token = res.body.token)

    // using that token allows us to view things
    await app.get('/api/todo').set('token', token).expect(200)

    // logging out should revoke the token
    await app.post('/api/auth/logout')

    // if we try to do things with it now, it should be 401.
    await app.get('/api/todo').set('token', token).expect(401)

    // but we can login again - this is a new token
    await app.post('/api/auth/login').send({identifier: 'test', password: 'test'}).expect(200).then(res => token = res.body.token)

    // at this point accessing things should be fine
    await app.get('/api/todo').set('token', token).expect(200)

  })

})
