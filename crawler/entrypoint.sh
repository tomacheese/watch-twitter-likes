#!/bin/sh

while :
do
  node index.js || true

  echo "Restarting..."
done