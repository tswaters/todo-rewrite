
const {Router} = require('express')

const {query} = require('../lib/db')
const {bad_request, unprocessable} = require('../lib/errors')
const authentication = require('../middleware/authentication')

const router = new Router()

router.get('/', [authentication, async (req, res, next) => {

  req.logger.debug('GET /todo/')

  let rows = null
  try {
    ({rows} = await query(
      'SELECT * FROM todo.vw_todos WHERE user_id = $1',
      [req.user.user_id]
    ))
  } catch (err) {
    return next(err)
  }

  res.json(rows)

}])

router.post('/', [authentication, async (req, res, next) => {

  const {text} = req.body

  req.logger.debug(`POST /todo/ with ${text}`)

  if (!text) {
    return next(bad_request('text must be provided'))
  }

  let todo_id

  try {
    const result = await query(
      'SELECT todo.add_todo($1, $2)',
      [req.user.user_id, text]
    )

    if (result.rows.length === 0) {
      return next(unprocessable('could not add todo'))
    }

    ({add_todo: todo_id} = result.rows[0])

  } catch (err) {
    return next(err)
  }

  res.status(200).send({success: true, todo_id})

}])

router.post('/:id/complete', [authentication, async (req, res, next) => {

  const {id} = req.params
  const {complete} = req.body

  req.logger.debug(`POST /todo/:id/complete with ${id} and ${complete}`)

  try {

    const {rows} = await query(
      'SELECT todo.update_todo_complete($1, $2, $3)',
      [req.user.user_id, id, complete]
    )

    if (rows.update_todo_complete === 0) {
      throw unprocessable('could not update todo')
    }

  } catch (err) {
    return next(err)
  }

  res.status(200).send({success: true})

}])

router.put('/:id', [authentication, async (req, res, next) => {

  const {id} = req.params
  const {text} = req.body

  req.logger.debug(`PUT /todo/:id with ${id} and ${text}`)

  if (!text) {
    return next(bad_request('text must be provided'))
  }

  try {

    const {rows} = await query(
      'SELECT todo.update_todo_text($1, $2, $3)',
      [req.user.user_id, id, text]
    )

    if (rows.update_todo_text === 0) {
      throw unprocessable('could not update todo')
    }

  } catch (err) {
    return next(err)
  }

  res.status(200).send({success: true})

}])

router.delete('/:id', [authentication, async (req, res, next) => {

  const {id} = req.params
  req.logger.debug(`DELETE /todo/:id with ${id}`)

  try {

    const {rows} = await query(
      'SELECT todo.update_todo_delete($1, $2, $3)',
      [req.user.user_id, id, true]
    )

    if (rows.delete_todo === 0) {
      throw unprocessable('could not delete todo')
    }

  } catch (err) {
    return next(err)
  }

  res.status(200).send({success: true})

}])

router.post('/:id/restore', [authentication, async (req, res, next) => {

  const {id} = req.params
  req.logger.debug(`POST /todo/:id/restore with ${id}`)

  try {

    const {rows} = await query(
      'SELECT todo.update_todo_delete($1, $2, $3)',
      [req.user.user_id, id, false]
    )

    if (rows.delete_todo === 0) {
      throw unprocessable('could not restore todo')
    }

  } catch (err) {
    return next(err)
  }

  res.status(200).send({success: true})

}])

module.exports = router
