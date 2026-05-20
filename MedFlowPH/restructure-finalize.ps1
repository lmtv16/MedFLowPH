# Legacy helper: Frontend is now a real folder (contents moved from medflow-web).
# Run only if an empty medflow-web/ or Frontend junction still exists after closing IDE/Vite.

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

function Remove-JunctionIfPresent($path) {
    if (-not (Test-Path $path)) { return }
    $item = Get-Item $path -Force
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        cmd /c "rmdir `"$path`""
        Write-Host "Removed junction: $path"
    }
}

Remove-JunctionIfPresent (Join-Path $root 'Frontend')

$web = Join-Path $root 'medflow-web'
$frontend = Join-Path $root 'Frontend'

if ((Test-Path $web) -and -not (Get-ChildItem $web -Force | Measure-Object).Count) {
    cmd /c "rmdir `"$web`""
    Write-Host 'Removed empty medflow-web/'
} elseif (Test-Path $web) {
    Write-Host 'medflow-web/ still has files — move them to Frontend/ manually or close locking processes and re-run.'
}

if (-not (Test-Path (Join-Path $frontend 'package.json'))) {
    throw 'Frontend/package.json missing — restore from git or medflow-web backup.'
}

Write-Host 'Done. Use MedFlowPH/Frontend/ (see Frontend/README.md).'
