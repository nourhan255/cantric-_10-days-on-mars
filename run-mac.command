#!/bin/bash
# macOS: double-click to run. Starts a local server (this computer only) and opens the game.
cd "$(dirname "$0")"
PORT=8779; URL="http://localhost:$PORT/index.html"
if lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then open "$URL"; exit 0; fi
( sleep 1; open "$URL" ) &
echo "Game running at $URL — keep this window open while playing, close it to stop."
python3 tools/dev_server.py $PORT
