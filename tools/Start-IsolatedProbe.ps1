#requires -Version 7.4
param(
  [Parameter(Mandatory=$true)][string]$AppPath,
  [ValidateRange(1024,65535)][int]$Port=9437
)
$ErrorActionPreference='Stop'
$app=(Resolve-Path -LiteralPath $AppPath).Path
if([IO.Path]::GetExtension($app) -ne '.exe'){throw 'AppPath must point to the installed desktop executable.'}
if(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue){throw 'Port already in use.'}
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\.runtime'))
$profile=Join-Path $root 'isolated-profile'
$codexData=Join-Path $root 'isolated-codex-home'
New-Item -ItemType Directory -Force -Path $profile,$codexData | Out-Null
# Separate app profile AND agent data. This is a compatibility probe, not a
# migration of the user's signed-in account or live conversation history.
$process=Start-Process -FilePath $app -ArgumentList @("--user-data-dir=`"$profile`"",'--remote-debugging-address=127.0.0.1',"--remote-debugging-port=$Port",'--no-first-run') -Environment @{CODEX_HOME=$codexData} -WindowStyle Hidden -PassThru
$record=@{pid=$process.Id;appPath=$app;profile=$profile;port=$Port;startedAt=(Get-Date).ToString('o')}
$record | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $root 'probe.json') -Encoding UTF8
$record | ConvertTo-Json
