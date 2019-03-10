# distributed todo

this is a distributed todo application.

each sub-directory here is a component of the application (except for `node-lib` - these are shared helpers)

each of the application components talks over rabbitmq.

## starting

If you haven't already initialized swarm, you'll need to do that:

```
$ docker swarm init
```

With that done, you can start the project:

```
$ npm run start
```

This will build all the images, and attempt to start them with docker swarm.  The configuration attempts to take port 80 so if another server is already running there, docker will likely be pretty upset about it.

There you go, now you can use the application - visit `localhost` and it should work.

## running tests

```
npm run coverage
```

This will spin up everything in an isolated network and attempt to run tests.

For the integration tests to pass, everything needs to be running.

## development

You're probably going to want to start the db/etc. services on their own --

```
$ npm run start:deps
```

This will run redis/postgres/rabbit, opening all their ports on the host.

Everything has a health check installed so you can check `docker ps` and see if they are healthy before running anything.

You'll need to go into each of the services and run `npm i` and link the `node-lib` helpers.

This is provided in `./scripts/install.sh` - there's also `./scripts/upgrade.sh` to bump dependencies.

```
$ ./scripts/install.sh
```

At the root of the project, run `npm i` - this has a few common dependencies for the project as a whole.

This includes a configuration for `fuge`.  You can start all the node processes by running `npm start:dev`

From the fuge terminal, type `start all` to get everything to start.

Fuge watches each of the processes for changes and will restart them.
