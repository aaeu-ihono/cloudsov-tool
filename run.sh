#!/bin/bash
cd "$(dirname "$0")"

if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 not found."
    exit 1
fi

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt -q
echo "Starting CloudSov at http://localhost:5000"
open "http://localhost:5000" 2>/dev/null || xdg-open "http://localhost:5000" 2>/dev/null &
python app.py
