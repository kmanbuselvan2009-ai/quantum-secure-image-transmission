@echo off
start powershell -NoExit -Command "cd '%~dp0backend'; .\.venv\Scripts\uvicorn app.main:app --port 8000 --reload"
start powershell -NoExit -Command "cd '%~dp0frontend'; npm run dev"
timeout /t 2 >nul
start http://localhost:5173
