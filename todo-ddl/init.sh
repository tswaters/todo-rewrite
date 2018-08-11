#!/bin/bash
set -e

export PGPASSWORD=`cat /var/run/secrets/PGPASSWORD`

sqitch "$@"
