#!/bin/sh
set -e
npx prisma migrate deploy
# The dataset is deliberately an explicit operation.  Running it on every
# container restart would duplicate data (or fail on unique constraints).
if [ "${SEED_DATABASE:-false}" = "true" ]; then
  npx prisma db seed
fi
node dist/server.js
