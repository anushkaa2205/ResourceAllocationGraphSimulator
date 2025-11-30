@echo off
echo ============================================
echo Launching RAG Simulator (Backend + Frontend)
echo ============================================

REM --- START BACKEND ---
echo Starting Python Backend...
start "RAG Backend" cmd /k "cd backend && python backend.py"

REM --- START FRONTEND ---
echo Starting React Frontend...
start "RAG Frontend" cmd /k "npm run dev"

REM --- OPEN BROWSER ---
explorer "http://localhost:5173"

echo ============================================
echo Both servers are running.
echo ============================================

exit
