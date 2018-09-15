
'use strict'

const pino = require('pino')
const express = require('express')
const request = require('supertest')
const auth = require('../../middleware/authorization')

describe('authorization middleware', () => {

  let app = null
  let router = null
  let server = null

  const route = (req, res) => res.send({success: true})
  const user = user => (req, res, next) => {req.user = user; next()}

  beforeEach(done => {
    app = express()
    router = new express.Router()
    app.use((req, res, next) => {
      req.logger = pino({level: 'silent'})
      next()
    })
    app.use(router)
    app.use((err, req, res, next) => {
      if (res.headersSent) { return next(err) }
      res.status(err.status)
      res.send({code: err.code})
    })
    server = app.listen(3001, done)
  })

  afterEach(done => {
    server.close(done)
  })

  it('throws if no user', async () => {
    router.get('/', [auth(['USER']), route])
    await request(app).get('/').expect(401, {code: 'UNAUTHORIZED'})
  })

  it('throws if no roles', async () => {
    router.get('/', [user({}), auth(['USER']), route])
    await request(app).get('/').expect(403, {code: 'FORBIDDEN'})
  })

  it('throws if roles.length == 0', async () => {
    router.get('/', [user({roles: []}), auth(['USER']), route])
    await request(app).get('/').expect(403, {code: 'FORBIDDEN'})
  })

  it('allows admin', async () => {
    router.get('/', [user({roles: ['ADMIN']}), auth(['USER']), route])
    await request(app).get('/').expect(200, {success: true})
  })

  it('throws if forbidden', async () => {
    router.get('/', [user({roles: ['NOT-A-USER']}), auth(['USER']), route])
    await request(app).get('/').expect(403, {code: 'FORBIDDEN'})
  })

  it('lets users in', async () => {
    router.get('/', [user({roles: ['USER']}), auth(['USER']), route])
    await request(app).get('/').expect(200, {success: true})
  })

  it('lets users in - multiple roles', async () => {
    router.get('/', [user({roles: ['AUTHOR']}), auth(['AUTHOR', 'USER']), route])
    await request(app).get('/').expect(200, {success: true})
  })
})
