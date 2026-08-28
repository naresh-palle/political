#!/bin/sh
set -e

if [ ! -d '/tmp/venv' ]; then
    python3 -m venv /tmp/venv || true
fi

if [ -f '/tmp/venv/bin/pip' ]; then
    /tmp/venv/bin/pip install --no-cache-dir -r backend/requirements.txt
else
    python3 -m pip install --break-system-packages -r backend/requirements.txt
fi
