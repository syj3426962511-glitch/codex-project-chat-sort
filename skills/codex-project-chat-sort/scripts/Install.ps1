param(
  [Parameter(Mandatory=$true)][string]$InstallDirectory,
  [Parameter(Mandatory=$true)][string]$ShortcutPath,
  [Parameter(Mandatory=$true)][string]$NodePath,
  [ValidateRange(1024,65535)][int]$Port=9438,
  [switch]$RestartExisting
)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'Common.ps1')
foreach($pathValue in @($InstallDirectory,$ShortcutPath,$NodePath)) {
  if (-not [IO.Path]::IsPathRooted($pathValue)) { throw 'Use absolute installation, shortcut, and Node paths.' }
}
$InstallDirectory=[IO.Path]::GetFullPath($InstallDirectory)
$ShortcutPath=[IO.Path]::GetFullPath($ShortcutPath)
$NodePath=(Resolve-Path -LiteralPath $NodePath).Path
if ([IO.Path]::GetExtension($ShortcutPath) -ne '.lnk' -or -not (Test-Path -LiteralPath $ShortcutPath -PathType Leaf)) { throw 'Select an existing .lnk shortcut.' }
if (Test-Path -LiteralPath $InstallDirectory) { throw 'Choose a new installation directory; existing files are never replaced.' }
$skillRoot=Split-Path -Parent $PSScriptRoot
$package=Get-CodexPackage
$cli=Join-Path $skillRoot 'assets\runtime\bin\cli.mjs'
Test-SortRuntime $NodePath $cli $package.Asar | Out-Null
New-Item -ItemType Directory -Path $InstallDirectory | Out-Null
Copy-Item -LiteralPath (Join-Path $skillRoot 'assets\runtime') -Destination (Join-Path $InstallDirectory 'runtime') -Recurse
Copy-Item -LiteralPath $PSScriptRoot -Destination (Join-Path $InstallDirectory 'scripts') -Recurse
$backup=Join-Path $InstallDirectory 'shortcut.original.lnk'
Copy-Item -LiteralPath $ShortcutPath -Destination $backup
$originalHash=(Get-FileHash -LiteralPath $ShortcutPath -Algorithm SHA256).Hash
if ((Get-FileHash -LiteralPath $backup -Algorithm SHA256).Hash -ne $originalHash) { throw 'Shortcut backup verification failed.' }
@{nodePath=$NodePath;port=$Port;restartExisting=[bool]$RestartExisting} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $InstallDirectory 'config.json') -Encoding UTF8
$cmdPath=Join-Path $InstallDirectory 'Start-Sorting.cmd'
@'
@echo off
powershell.exe -NoProfile -File "%~dp0scripts\Launch.ps1"
set "result=%ERRORLEVEL%"
if not "%result%"=="0" pause
exit /b %result%
'@ | Set-Content -LiteralPath $cmdPath -Encoding ASCII
$candidate=Join-Path $InstallDirectory 'shortcut.candidate.lnk'
try {
  $shell=New-Object -ComObject WScript.Shell
  $link=$shell.CreateShortcut($candidate)
  $link.TargetPath=$cmdPath
  $link.WorkingDirectory=$InstallDirectory
  $link.IconLocation=$package.Exe+',0'
  $link.Description='Codex project chat sorting launcher'
  $link.Save()
  $candidateHash=(Get-FileHash -LiteralPath $candidate -Algorithm SHA256).Hash
  # Persist recovery metadata before replacing the user's shortcut.
  @{shortcutPath=$ShortcutPath;originalSha256=$originalHash;installedSha256=$candidateHash;target=$cmdPath} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $InstallDirectory 'shortcut.json') -Encoding UTF8
  Copy-Item -LiteralPath $candidate -Destination $ShortcutPath -Force
  if ((Get-FileHash -LiteralPath $ShortcutPath -Algorithm SHA256).Hash -ne $candidateHash -or $shell.CreateShortcut($ShortcutPath).TargetPath -ne $cmdPath) { throw 'Installed shortcut verification failed.' }
  Write-Output "Installed shortcut: $ShortcutPath. The app has not been started."
} catch {
  Copy-Item -LiteralPath $backup -Destination $ShortcutPath -Force
  throw
} finally {
  Remove-Item -LiteralPath $candidate -ErrorAction SilentlyContinue
}
