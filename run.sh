#!/bin/sh
# Linux / any Unix: ./run.sh  then open http://localhost:8779/index.html
cd "$(dirname "$0")" && python3 tools/dev_server.py 8779
