@echo off
setlocal

cd /d "%~dp0"

if not exist ".env.local" (
  copy ".env.example" ".env.local" >nul
  echo Created .env.local from .env.example.
  echo Add your GROQ_API_KEY before posting AI-powered takes.
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto error
)

echo.
echo Starting Hot Take at http://localhost:3000
echo Press Ctrl+C to stop the dev server.
echo.
call npm run dev
if errorlevel 1 goto error

goto end

:error
echo.
echo Hot Take could not start. Check the error above.
pause

:end
endlocal
