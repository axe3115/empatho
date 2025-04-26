@echo off
echo Starting Empatho Backend Server...

:: Activate virtual environment
call .\venv\Scripts\activate.bat

:: Start the Python server
python main.py

:: If the server stops, don't close the window immediately
pause 