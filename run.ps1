$root = $PSScriptRoot
Start-Process powershell "-NoExit -Command cd '$root\backend'; .\.venv\Scripts\uvicorn app.main:app --port 8000 --reload"
Start-Process powershell "-NoExit -Command cd '$root\frontend'; npm run dev"
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"
