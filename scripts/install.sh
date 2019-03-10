#!/bin/bash

function install_dep() {
  pushd $1
  rm -Rf node_modules
  npm i
  npm link
  popd
}

function install() {
  pushd $1
  rm -Rf node_modules
  npm i
  npm link amqp-wrapper
  npm link auth-helper
  popd
}

install_dep ../node-lib/amqp-wrapper
install_dep ../node-lib/auth-helper

install ../todo-api
install ../todo-auth
install ../todo-items
install ../todo-localization
