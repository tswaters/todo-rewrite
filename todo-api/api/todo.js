
const {Router} = require('express')

const {sign_token} = require('auth-helper')
const todo = require('../services/todo')

const {bad_request} = require('../lib/errors')
const authentication = require('../middleware/authentication')

const router = new Router()

router.get('/', [authentication, async (req, res, next) => {

  req.logger.debug('GET /todo/')

  try {
    const token = await sign_token(req.session.user)
    const result = await todo.fetch({token})
    res.json(result)
  } catch (err) {
    next(err)
  }
}])

router.post('/', [authentication, async (req, res, next) => {
  const {text} = req.body

  req.logger.debug('POST /todo/ with %s', text)

  if (text == null) {
    return next(bad_request('text must be provided'))
  }

  try {
    const token = await sign_token(req.session.user)
    const result = await todo.create({token, text})
    const {todo_id} = result
    res.status(200).send({success: true, todo_id})
  } catch (err) {
    next(err)
  }
}])

router.post('/:todo_id/complete', [authentication, async (req, res, next) => {
  const {todo_id} = req.params
  const {complete} = req.body

  req.logger.debug('POST /todo/%s/complete %s', todo_id, complete)

  if (complete == null) {
    return next(bad_request('complete must be provided'))
  }

  try {
    const token = await sign_token(req.session.user)
    await todo.complete({token, todo_id, complete})
    res.status(200).send({success: true})
  } catch (err) {
    return next(err)
  }
}])

router.put('/:todo_id', [authentication, async (req, res, next) => {
  const {todo_id} = req.params
  const {text} = req.body

  req.logger.debug('PUT /todo/%s with %s', todo_id, text)

  if (text == null) {
    return next(bad_request('text must be provided'))
  }

  try {
    const token = await sign_token(req.session.user)
    await todo.update({token, todo_id, text})
    res.status(200).send({success: true})
  } catch (err) {
    return next(err)
  }
}])

router.delete('/:todo_id', [authentication, async (req, res, next) => {
  const {todo_id} = req.params

  req.logger.debug('DELETE /todo/%s with', todo_id)

  try {
    const token = await sign_token(req.session.user)
    await todo.remove({token, todo_id})
    res.status(200).send({success: true})
  } catch (err) {
    return next(err)
  }
}])

router.post('/:todo_id/restore', [authentication, async (req, res, next) => {
  const {todo_id} = req.params

  req.logger.debug('POST /todo/%s/restore', todo_id)

  try {
    const token = await sign_token(req.session.user)
    await todo.restore({token, todo_id})
    res.status(200).send({success: true})
  } catch (err) {
    return next(err)
  }
}])

module.exports = router
