@echo off
REM Lakehouse Data Reset Script
REM Usage: double-click or run 'empty_data.bat'

setlocal
cd /d "%~dp0"

if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" "scripts\empty_data.py"
) else (
    python "scripts\empty_data.py"
)

endlocal

