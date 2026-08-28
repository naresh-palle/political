#!/bin/sh
set -e

echo '--- STARTING PYTHON SERVICE ON RENDER ---'

# If virtual environment does not exist, create it
if [ ! -d '/tmp/venv' ]; then
    python3 -m venv /tmp/venv || true
fi

if [ -f '/tmp/venv/bin/pip' ]; then
    echo 'Using virtual environment at /tmp/venv'
    /tmp/venv/bin/pip install --no-cache-dir -r backend/requirements.txt
    cd backend
    exec /tmp/venv/bin/uvicorn server:app --host 0.0.0.0 --port 
else
    echo 'Virtualenv creation not supported, falling back to --break-system-packages'
    python3 -m pip install --break-system-packages -r backend/requirements.txt
    cd backend
    exec python3 -m uvicorn server:app --host 0.0.0.0 --port 
fi
