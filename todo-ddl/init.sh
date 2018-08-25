#!/bin/bash
set -e

./wait-for-it.sh "$PGHOST:$PGPORT"

PGPASSWORD_FILE=/var/run/secrets/PGPASSWORD

if [ -f $PGPASSWORD_FILE ]; then
  export PGPASSWORD=`cat ${PGPASSWORD_FILE}`
fi

sqitch "$@" db:pg://$PGUSER@$PGHOST/$PGDATABASE
