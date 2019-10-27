# simple library for creating a healthchech server

## usage

```js
healthier({ logger, handle_signal: true, port: null })
  .server({ path: '/health' })
  .add('amqp', () => amqp.healthy)
  .add('database', () => pool.query('SELECT 1'))
  .listen(HEALTH_CHECK_PORT)
```

## api

* create ({logger?: {info: fn, warn: fn}, path?: string})

creates an http server

if provided, a logger will be called upon initialization and errors.

* server

returns the server that was created

* listen( port: number )

calls listen on the server

* add(name: string, fn: () => Promise)

adds a check.

## how it works

if you perform an http request to the defined port,
each of the checks that have been added will be run
if any of them return false or return a rejected promise, server returns 500
if all of them return truthy, server returns 200.

## License

MIT
