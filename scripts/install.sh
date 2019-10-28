#!/bin/bash

function install() {
  pushd $1
  npm ci
  popd
}

install ../node-lib/amqp-wrapper
install ../node-lib/auth-helper
install ../node-lib/healthier
install ../todo-api
install ../todo-auth
install ../todo-items
install ../todo-localization
