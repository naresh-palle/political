#!/bin/sh
python3 -m pip install -r backend/requirements.txt
cd backend && python3 -m uvicorn server:app --host 0.0.0.0 --port 
