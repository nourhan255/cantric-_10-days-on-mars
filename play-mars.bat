@echo off
REM Starts the game server on this computer and opens the game. Keep this window open while you play.
cd /d "%~dp0"
start "" "http://localhost:8779/index.html"
python tools\dev_server.py 8779
