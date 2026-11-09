# Lakehouse Data Reset Script
# Usage: .\empty_data.ps1

Write-Host "Resetting Iceberg Lakehouse tables and warehouse..." -ForegroundColor Cyan

$PythonExe = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python"
}

& $PythonExe (Join-Path $PSScriptRoot "scripts\empty_data.py")

