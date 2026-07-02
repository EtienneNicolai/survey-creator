@echo off
echo Starting Survey Creator...
cd /d "%~dp0"

echo Setting up Python path...
set PYTHONPATH=%CD%;%CD%\backend\lib

echo Checking frontend build...
if not exist frontend\dist (
    echo No frontend build found. Building now...
    cd frontend
    call npm install
    call npm run build
    cd ..
    echo Frontend built.
)

echo.
echo Starting server at http://localhost:8000
echo Press Ctrl+C to stop.
echo.
python -m uvicorn backend.src.api.main:app --host 127.0.0.1 --port 8000 --reload

pause
