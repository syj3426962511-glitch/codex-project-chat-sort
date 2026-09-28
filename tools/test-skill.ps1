param([Parameter(Mandatory=$true)][string]$NodePath)
$ErrorActionPreference='Stop'
$repo=Split-Path -Parent $PSScriptRoot
$skill=Join-Path $repo 'skills\codex-project-chat-sort'
$testRoot=Join-Path $repo ('.artifacts\skill-test-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
foreach($file in Get-ChildItem -LiteralPath (Join-Path $skill 'scripts') -Filter '*.ps1') {
  $tokens=$null;$errors=$null
  [Management.Automation.Language.Parser]::ParseFile($file.FullName,[ref]$tokens,[ref]$errors) | Out-Null
  if($errors.Count){throw ($errors | Out-String)}
}
$shortcut=Join-Path $testRoot 'Fixture.lnk'
$shell=New-Object -ComObject WScript.Shell
$link=$shell.CreateShortcut($shortcut)
$link.TargetPath=Join-Path $PSHOME 'powershell.exe'
$link.Save()
$original=(Get-FileHash -LiteralPath $shortcut -Algorithm SHA256).Hash
$install=Join-Path $testRoot 'installation'
& (Join-Path $skill 'scripts\Setup.ps1') -InstallDirectory $install -ShortcutPath $shortcut -NodePath $NodePath
& (Join-Path $skill 'scripts\Setup.ps1') -InstallDirectory $install -ShortcutPath $shortcut -NodePath $NodePath
if($shell.CreateShortcut($shortcut).TargetPath -ne (Join-Path $install 'Start-Sorting.cmd')){throw 'Shortcut target was not installed.'}
& (Join-Path $install 'scripts\Launch.ps1') -CheckOnly
& (Join-Path $install 'scripts\Restore.ps1') -InstallDirectory $install
if((Get-FileHash -LiteralPath $shortcut -Algorithm SHA256).Hash -ne $original){throw 'Original shortcut was not restored.'}
Write-Output 'PASS: PowerShell parsing, supported-package check, temporary shortcut installation, launcher preflight, and exact shortcut restoration. No app was launched or stopped.'
