$ErrorActionPreference = 'Stop'
function Get-CodexPackage {
  $packages = @(Get-AppxPackage -Name OpenAI.Codex)
  if ($packages.Count -ne 1) { throw 'Expected one registered OpenAI.Codex package for this user.' }
  $package = $packages[0]
  $manifest = Get-AppxPackageManifest -Package $package.PackageFullName
  $apps = @($manifest.Package.Applications.Application | Where-Object { $_.Executable -match '(^|[\\/])ChatGPT\.exe$' })
  if ($apps.Count -ne 1) { throw 'Could not identify a unique ChatGPT.exe application in the package manifest.' }
  $exe = Join-Path $package.InstallLocation $apps[0].Executable
  $asar = Join-Path (Split-Path -Parent $exe) 'resources\app.asar'
  if (-not (Test-Path -LiteralPath $asar -PathType Leaf)) { throw 'Installed app.asar was not found.' }
  [pscustomobject]@{Exe=$exe;Asar=$asar;Aumid=($package.PackageFamilyName + '!' + $apps[0].Id)}
}
function Test-SortRuntime([string]$NodePath,[string]$CliPath,[string]$AsarPath) {
  if (-not (Test-Path -LiteralPath $NodePath -PathType Leaf)) { throw 'Node executable was not found.' }
  $version = & $NodePath --version
  if ($LASTEXITCODE -ne 0 -or $version -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 22) { throw 'Node.js 22 or newer is required.' }
  $raw = (& $NodePath $CliPath doctor --asar $AsarPath | Out-String)
  if ($LASTEXITCODE -ne 0) { throw 'Renderer compatibility check failed. No app restart performed.' }
  $doctor = $raw | ConvertFrom-Json
  if ($doctor.compatibleSource -ne $true) { throw 'Renderer fingerprint does not match.' }
  $doctor
}
