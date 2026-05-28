#!/bin/bash
cd "$(dirname "$0")"
if [ -f bot.pid ]; then
  kill $(cat bot.pid) 2>/dev/null
  rm bot.pid
  echo "Bot stopped"
else
  echo "No bot.pid found"
fi
