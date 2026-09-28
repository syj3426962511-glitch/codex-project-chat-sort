param([Parameter(Mandatory=$true)][string]$InstallDirectory)
$ErrorActionPreference='Stop'
$state=Get-Content -LiteralPath (Join-Path $InstallDirectory 'shortcut.json') -Raw | ConvertFrom-Json
$backup=Join-Path $InstallDirectory 'shortcut.original.lnk'
$backupHash=(Get-FileHash -LiteralPath $backup -Algorithm SHA256).Hash
if ($backupHash -ne $state.originalSha256) { throw 'Original shortcut backup hash mismatch.' }
$currentHash=(Get-FileHash -LiteralPath $state.shortcutPath -Algorithm SHA256).Hash
if ($currentHash -eq $backupHash) { Write-Output 'Original shortcut already restored.'; exit 0 }
if ($currentHash -ne $state.installedSha256) { throw 'Shortcut has changed since installation; inspect it before restoring.' }
Copy-Item -LiteralPath $backup -Destination $state.shortcutPath -Force
if ((Get-FileHash -LiteralPath $state.shortcutPath -Algorithm SHA256).Hash -ne $backupHash) { throw 'Restored shortcut hash mismatch.' }
Write-Output 'Original shortcut restored. Runtime files have been retained.'
