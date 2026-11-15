@echo off
REM Windows: double-click to run. Needs Python 3 installed (python.org). Keep this window open while playing.
cd /d "%~dp0"
start "" "http://localhost:8779/index.html"
python tools\dev_server.py 8779
