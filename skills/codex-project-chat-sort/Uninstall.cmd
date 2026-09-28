@echo off
powershell.exe -NoProfile -File "%~dp0scripts\Setup.ps1" -Restore
set "result=%ERRORLEVEL%"
pause
exit /b %result%
