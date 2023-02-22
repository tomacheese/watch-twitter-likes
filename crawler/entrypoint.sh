#!/bin/sh

rm /tmp/.X*-lock || true

Xvfb :99 -ac -screen 0 600x1000x16 -listen tcp &
x11vnc -rfbport 5910 -forever -noxdamage -display :99 -nopw -loop -xkb &

rm -rf /data/userdata/Singleton* || true

yarn start

kill -9 "$(pgrep -f "Xvfb" | awk '{print $2}')"
kill -9 "$(pgrep -f "x11vnc" | awk '{print $2}')"
