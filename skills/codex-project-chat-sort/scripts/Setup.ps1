param([string]$InstallDirectory,[string]$ShortcutPath,[string]$NodePath,[switch]$CheckOnly,[switch]$Restore)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'Common.ps1')
if(-not $InstallDirectory){
  $dataRoot=$env:CODEX_HOME
  if(-not $dataRoot){$dataRoot=Join-Path $env:USERPROFILE '.codex'}
  $InstallDirectory=Join-Path $dataRoot 'addons\codex-project-chat-sort'
}
if($Restore){
  if($CheckOnly){throw 'Choose CheckOnly or Restore, not both.'}
  & (Join-Path $PSScriptRoot 'Restore.ps1') -InstallDirectory $InstallDirectory
  exit 0
}
if(-not $NodePath){
  $candidates=@()
  $command=Get-Command node.exe -ErrorAction SilentlyContinue
  if($command){$candidates+= $command.Source}
  $candidates+=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
  if($env:ProgramFiles){$candidates+=Join-Path $env:ProgramFiles 'nodejs\node.exe'}
  foreach($candidate in ($candidates|Select-Object -Unique)){
    if(Test-Path -LiteralPath $candidate -PathType Leaf){
      $version=& $candidate --version
      if($LASTEXITCODE -eq 0 -and $version -match '^v(\d+)\.' -and [int]$Matches[1] -ge 22){$NodePath=$candidate;break}
    }
  }
  if(-not $NodePath){throw 'Node.js 22+ was not found. Install Node.js or run Setup.ps1 -NodePath with its absolute executable path.'}
}
if(-not $ShortcutPath){
  $desktop=[Environment]::GetFolderPath('Desktop')
  $links=@('ChatGPT.lnk','Codex.lnk' | ForEach-Object {Join-Path $desktop $_} | Where-Object {Test-Path -LiteralPath $_ -PathType Leaf})
  if($links.Count -ne 1){throw 'Could not select one desktop ChatGPT/Codex shortcut. Run Setup.ps1 -ShortcutPath with the intended .lnk path.'}
  $ShortcutPath=$links[0]
}
$package=Get-CodexPackage
$cli=Join-Path (Split-Path -Parent $PSScriptRoot) 'assets\runtime\bin\cli.mjs'
Test-SortRuntime $NodePath $cli $package.Asar | Out-Null
if($CheckOnly){
  [pscustomobject]@{installDirectory=$InstallDirectory;shortcutPath=$ShortcutPath;nodePath=$NodePath;compatibleSource=$true;changed=$false} | ConvertTo-Json
  exit 0
}
if(Test-Path -LiteralPath $InstallDirectory){
  $state=Get-Content -LiteralPath (Join-Path $InstallDirectory 'shortcut.json') -Raw | ConvertFrom-Json
  $shell=New-Object -ComObject WScript.Shell
  if($state.shortcutPath -eq $ShortcutPath -and (Get-FileHash -LiteralPath $ShortcutPath).Hash -eq $state.installedSha256 -and $shell.CreateShortcut($ShortcutPath).TargetPath -eq $state.target){
    Write-Output 'Already configured. Close Codex, then reopen through the desktop shortcut.'
    exit 0
  }
  throw 'Installation directory exists but the shortcut differs. Restore or inspect it before reinstalling.'
}
& (Join-Path $PSScriptRoot 'Install.ps1') -InstallDirectory $InstallDirectory -ShortcutPath $ShortcutPath -NodePath $NodePath
Write-Output 'Setup complete. Save your work, close Codex, then open it using the same desktop icon. To undo, double-click Uninstall.cmd in the skill folder.'
