@echo off
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 ( echo ERROR: Python not found. & pause & exit /b 1 )

if not exist venv ( python -m venv venv )

call venv\Scripts\activate.bat
pip install -r requirements.txt -q
start http://localhost:5000
python app.py
pause
