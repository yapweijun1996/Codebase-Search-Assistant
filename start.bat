@echo off
cd /d "%~dp0"
echo Codebase Search Assistant
echo URL: http://localhost:3123
echo Press Ctrl+C to stop.
echo.
start /b cmd /c "ping 127.0.0.1 -n 3 > nul && start http://localhost:3123"
node server.js
