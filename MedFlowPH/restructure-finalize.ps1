# Finalize Backend/Frontend folder names (run after stopping dev servers).
# 1. Removes Frontend junction if present
# 2. Renames medflow-web -> Frontend
# 3. Removes empty api/ if Backend already has the Python files
#
# Requires: no process using MedFlowPH/medflow-web (stop Vite, close IDE on that tree).

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

function Remove-JunctionIfPresent($path) {
    if (-not (Test-Path $path)) { return }
    $item = Get-Item $path -Force
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        cmd /c "rmdir `"$path`""
    } else {
        throw "Refusing to delete non-junction: $path"
    }
}

Remove-JunctionIfPresent (Join-Path $root 'Frontend')

$web = Join-Path $root 'medflow-web'
$frontend = Join-Path $root 'Frontend'

if (-not (Test-Path $web)) {
    Write-Host 'medflow-web already renamed or missing.'
} elseif (Test-Path $frontend) {
    throw "Frontend already exists and is not a junction."
} else {
    Rename-Item -Path $web -NewName 'Frontend'
    Write-Host 'Renamed medflow-web -> Frontend'
}

$api = Join-Path $root 'api'
if ((Test-Path $api) -and -not (Get-ChildItem $api -Force | Where-Object { $_.Name -ne '.' })) {
    Remove-Item $api -Force
    Write-Host 'Removed empty api/'
}

Write-Host 'Done. Use MedFlowPH/Backend and MedFlowPH/Frontend.'
