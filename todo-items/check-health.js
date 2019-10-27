#!/usr/local/bin/node

require('healthier').checker({
  host: 'localhost',
  path: '/health',
  port: process.argv.slice(1)[1],
  timeout: 2000,
})
