#!/bin/bash
# Double-click on macOS to play "10 Days on Mars" (Day 1). Starts a tiny local server (only on this computer) and opens the game.
cd "$(dirname "$0")"
PORT=8779
URL="http://localhost:$PORT/index.html"
if lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "اللعبة شغالة بالفعل. بفتحها في المتصفح..."
  open "$URL"; exit 0
fi
( sleep 1; open "$URL" ) &
echo "10 أيام على المريخ شغالة على $URL"
echo "سيب الشباك ده مفتوح وانت بتلعب. ولما تخلص اقفله."
python3 tools/dev_server.py $PORT
