param(
    [string]$PythonExe = "python"
)

$ErrorActionPreference = "Stop"

& $PythonExe ".\tools\test_calculadoras_formulas.py"
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    Write-Host "Formula regression tests failed." -ForegroundColor Red
    exit $exitCode
}

Write-Host "Formula regression tests passed." -ForegroundColor Green
exit 0
