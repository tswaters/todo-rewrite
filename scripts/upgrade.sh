#!/bin/bash

function upgrade() {
  pushd $1
  npm upgrade
  popd
}

upgrade ../node-lib/amqp-wrapper
upgrade ../node-lib/auth-helper
upgrade ../todo-api
upgrade ../todo-auth
upgrade ../todo-items
upgrade ../todo-localization
