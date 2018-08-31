# amqp-wrapper

this is an opinionated wrapper around libamqp that exposes a few common patterns for using amqp (rpc calls, pub/sub)

it keeps a connection for each Client invocation, and will automatically reconnect if the connection is lost.

if a connection is restored, the initialization function for each defined channel is re-run.

if no handlers are defined and a client calls into it, a (configurable) error is thrown immedietely.

if a handler is available, but it takes longer than predefined time period (60000), a (configurable) error is thrown.

## install

```sh
npm i amqp-wrapper
```

## api

### Client

keeps the connection to amqp and implements login logic

```js
const amqp = new Client(); // first parameter is passed directly to amqplib#connect
await amqp.channel(channel => {}) // this establishes connection & options a channel
await amqp.channel(channel => {}) // re-uses connection, opens a new channel
await amqp.close() // cleanly close connections, i.e. SIGTERM/SIGINT handling
```

### Channel

Keeps a channel open to amqp server.  created when `Client#channel` is invoked.  Not intended to be instantiated directly.


### RpcServer

Wraps the `server` component of an RPC relationship

```js
amqp.channel(async ch => {
  await RpcServer.build(ch, 'queue-name', worker, {prefetch: 1})
})
async function worker (msg) {
  // you can process messages here -- throwing an exception will nack the message and requeue it for later.
  // handle business errors with `{success: false, message}` or `{status: 400, message}` or whatever else
}
```

#### options

* prefetch - passed to the underlying channel.

#### notes

- this will set up a durable auto-delete queue named `${queueName}-request`.

-  unhandled errors will `nack` the message, emit an `error` event, and put the message back in the queue for processing.

- make sure to only throw if another worker should be able to process the message (i.e., external service is temporarily unreachable).
  if it's something any worker will have problems with, return `{success: false}` or something to that effect.


### RpcClient

Wraps the `client` component of an RPC relationship

```js
let client = null

amqp.channel(async ch => {
  client = await RpcClient.build(ch, 'queue-name', options)
})

app.post('/some-endpoint', async (req, res, next) => {
  try {
    const result = await client.send(req.body)
    res.json(result)
  } catch (err) {
    next(err)
  }
})
```

#### options

* timeout - time to wait in milliseconds before sending gateway timeout (default `60000`)

* serviceUnavailable - function that returns a pojo that will be returned when service unavailable.  default `() => ({status: 502, error: 'service unavailable'})`

* gatewayTimeout - function that returns a pojo that will be returned when timeout occurs.  default `() => ({status: 504, error: 'gateway timeout'})`

#### notes

this will set up an exclusive queue named `${queueName}-response-${hostName}-${pid}`.

any messages sent via `send` will be sent to `${queueName}-request` and will have `replyTo` set to the exclusive queue.

the first parameter of `send` must match a `queue-name` set up with an `RpcServer`

if no servers are available (queueName is `autoDelete`) you will get back an immediete response, the result of `this.serviceUnavailable(msg)`

if a request takes longer than the configured `timeout`, you'll get back the result of `this.gatewayTimeout(msg)`

## example

here's an example showing an rpc request/resonse in a single process.

you can add event handlers for logging, and query the `close` and `connect` events to determine if the connection is healthy.

```js

const logger = console
const app = require('./app') // express app maybe?
const amqp = new Client('amqp://localhost', {timeout})

let http_server = null
let rpc_client = null
let rpc_server = null
let amqp_healthy = false

amqp.on('error', err => logger.error(err))
amqp.on('channel-error', err => logger.error(err))
amqp.on('connect', () => amqp_healthy = true)
amqp.on('close', () => amqp_healthy = false)
amqp.on('channel-connect', () => logger.info('channel connected'))
amqp.on('channel-close', () => logger.info('channel closed'))

async function worker (msg) => {
  if (msg === 'foo') { return 'bar' }
  else { return 'what?!' }
}

app.get('/healthy', (req, res) => res.status(amqp_healthy ? 200 : 500).end())

app.get('/request/:type', async (req, res, next) => {
  try {
    const result = await rpc_client.send('requests', req.params.type)
    res.json(result) // "bar"
  } catch (err) {
    next(err)
  }
})

;(async () => {

  await new Promise(resolve => http_server = http.createServer(app).listen(3000, resolve))

  await amqp.channel(ch => {
    // ch.assertQueue
    // ch.bindExchange
    // ...or use one the classes...

    rpc_client = await RpcClient.build(ch, 'queue-name')
    rpc_server = await RpcServer.build(ch, 'queue-name', worker, {prefetch: 1})

    // unhandled errors encountered in the workers will be emitted here.
    // if channel/connection goes away, these instances are rebound to new instances
    // so make sure to attach any handlers you want here.

    rpc_server.on('error', err => logger.error(err))
    rpc_client.on('error', err => logger.error(err))
  })

})()
  .catch(err => {
    logger.error(err)
    process.exit(1)
  })

process.on('SIGTERM', close)
process.on('SIGINT', close)

async function close () {
  await amqp.close()
  http_server.close(() => process.exit(0))
}

```
