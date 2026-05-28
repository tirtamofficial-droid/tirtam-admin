#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Tirtam WhatsApp Bot..."
node index.js >> bot.log 2>&1 &
echo $! > bot.pid
echo "Bot started with PID $(cat bot.pid)"
echo "Logs: $(dirname "$0")/bot.log"
echo "To stop: kill $(cat bot.pid)"
