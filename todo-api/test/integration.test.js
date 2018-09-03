
'use strict'

const assert = require('assert')
const request = require('supertest')
const server = require('../server')
const services = require('../services')
const {query} = require('../lib/db')
const {PORT = '3001'} = process.env

describe('todo integration', () => {

  let app = null

  before(async () => {
    await services.init()
    await new Promise(resolve => server.listen(PORT, resolve))
    app = request.agent(server)
  })

  beforeEach(async () => {
    await query('TRUNCATE TABLE auth.user CASCADE')
  })

  after(async () => {
    await services.close()
    await new Promise(resolve => server.close(resolve))
  })

  it('authentication', async () => {

    // without any authentication it should fail with 401
    await app.get('/api/todo').expect(401)

    // registering should give us a valid user session
    await app.post('/api/auth/register').send({identifier: 'test', password: 'test'}).expect(200)

    // now that we're authenticated, we can view things
    await app.get('/api/todo').expect(200)

    // logging out should turf the session
    await app.post('/api/auth/logout')

    // if we try to do things with it now, it should be 401.
    await app.get('/api/todo').expect(401)

    // but we can login again - this gives a new user session
    await app.post('/api/auth/login').send({identifier: 'test', password: 'test'}).expect(200)

    // at this point accessing things should be fine
    await app.get('/api/todo').expect(200)

  })
  it('todo crud operations', async () => {

    let todo1 = null
    let todo2 = null
    let todo3 = null

    // register - todo list should be empty
    await app.post('/api/auth/register').send({identifier: 'test', password: 'test'})
    await app.get('/api/todo').expect(200, [])

    // add a bunch of todo items
    await app.post('/api/todo').send({text: 'learn express'}).expect(200).then(res => todo1 = res.body.todo_id)
    await app.post('/api/todo').send({text: 'learn koa'}).expect(200).then(res => todo2 = res.body.todo_id)
    await app.post('/api/todo').send({text: 'take over the world'}).expect(200).then(res => todo3 = res.body.todo_id)

    // make sure everything is there
    await app.get('/api/todo').expect(200).expect(res =>
      assert.deepEqual(res.body.map(todo => ({
        value: todo.value,
        todo_id: todo.todo_id,
        complete: todo.complete
      })), [
        {todo_id: todo1, complete: false, value: 'learn express'},
        {todo_id: todo2, complete: false, value: 'learn koa'},
        {todo_id: todo3, complete: false, value: 'take over the world'}
      ])
    )

    // make sure another user doesn't have those todos
    await app.post('/api/auth/logout')
    await app.post('/api/auth/register').send({identifier: 'test2', password: 'test'}).expect(200)
    await app.get('/api/todo').expect(200, [])

    // login & make sure everything is there.
    await app.post('/api/auth/login').send({identifier: 'test', password: 'test'}).expect(200)
    await app.get('/api/todo').expect(200).expect(res =>
      assert.deepEqual(res.body.map(todo => ({
        value: todo.value,
        todo_id: todo.todo_id,
        complete: todo.complete
      })), [
        {todo_id: todo1, complete: false, value: 'learn express'},
        {todo_id: todo2, complete: false, value: 'learn koa'},
        {todo_id: todo3, complete: false, value: 'take over the world'}
      ])
    )

    // perform update - make sure everything is correct
    await app.put(`/api/todo/${todo2}`).send({text: 'learn docker'}).expect(200)
    await app.get('/api/todo').expect(200).expect(res =>
      assert.deepEqual(res.body.map(todo => ({
        value: todo.value,
        todo_id: todo.todo_id,
        complete: todo.complete
      })), [
        {todo_id: todo1, complete: false, value: 'learn express'},
        {todo_id: todo2, complete: false, value: 'learn docker'},
        {todo_id: todo3, complete: false, value: 'take over the world'}
      ])
    )

    // mark an item as complete - make sure everything is there
    await app.post(`/api/todo/${todo1}/complete`).send({complete: true}).expect(200)
    await app.post(`/api/todo/${todo2}/complete`).send({complete: true}).expect(200)
    await app.get('/api/todo').expect(200).expect(res =>
      assert.deepEqual(res.body.map(todo => ({
        value: todo.value,
        todo_id: todo.todo_id,
        complete: todo.complete
      })), [
        {todo_id: todo1, complete: true, value: 'learn express'},
        {todo_id: todo2, complete: true, value: 'learn docker'},
        {todo_id: todo3, complete: false, value: 'take over the world'}
      ])
    )

    // mark an item as not complete - make sure everything is there
    await app.post(`/api/todo/${todo2}/complete`).send({complete: false}).expect(200)
    await app.get('/api/todo').expect(200).expect(res =>
      assert.deepEqual(res.body.map(todo => ({
        value: todo.value,
        todo_id: todo.todo_id,
        complete: todo.complete
      })), [
        {todo_id: todo1, complete: true, value: 'learn express'},
        {todo_id: todo2, complete: false, value: 'learn docker'},
        {todo_id: todo3, complete: false, value: 'take over the world'}
      ])
    )

    // delete an item, it should not show up anymore
    await app.delete(`/api/todo/${todo1}`).expect(200)
    await app.delete(`/api/todo/${todo3}`).expect(200)
    await app.get('/api/todo').expect(200).expect(res =>
      assert.deepEqual(res.body.map(todo => ({
        value: todo.value,
        todo_id: todo.todo_id,
        complete: todo.complete
      })), [
        {todo_id: todo2, complete: false, value: 'learn docker'}
      ])
    )

    // restore an item, it should now show up
    await app.post(`/api/todo/${todo1}/restore`).expect(200)
    await app.get('/api/todo').expect(200).expect(res =>
      assert.deepEqual(res.body.map(todo => ({
        value: todo.value,
        todo_id: todo.todo_id,
        complete: todo.complete
      })), [
        {todo_id: todo1, complete: true, value: 'learn express'},
        {todo_id: todo2, complete: false, value: 'learn docker'}
      ])
    )
  })
})
