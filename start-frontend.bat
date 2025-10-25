@echo off
echo Setting up Frontend...
cd frontend

echo Installing dependencies...
call npm install

echo.
echo Starting Frontend Server...
echo Frontend will run on: http://localhost:3001
echo.
echo Login with:
echo Phone: 01712345678
echo Password: password123
echo.
call npm run dev
