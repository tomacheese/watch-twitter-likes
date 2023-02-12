#!/bin/sh

while :
do
  yarn build || true

  echo "Restarting..."
done