param([switch]$CheckOnly)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'Common.ps1')
$installRoot=Split-Path -Parent $PSScriptRoot
$config=Get-Content -LiteralPath (Join-Path $installRoot 'config.json') -Raw | ConvertFrom-Json
$Port=[int]$config.port
if($Port -lt 1024 -or $Port -gt 65535){throw 'Invalid configured port.'}
$package=Get-CodexPackage
$appPath=$package.Exe
$aumid=$package.Aumid
$repo=Join-Path $installRoot 'runtime'
$statusPath=Join-Path $installRoot 'state.json'
$nodePath=$config.nodePath
$doctor=Test-SortRuntime $nodePath (Join-Path $repo 'bin\cli.mjs') $package.Asar
if($CheckOnly){$doctor | ConvertTo-Json; exit 0}
function Save-State([string]$State,[string]$Message,[int]$ProcessId=0,[string]$Injection='') {
  [ordered]@{time=(Get-Date).ToString('o');state=$State;message=$Message;processId=$ProcessId;port=$Port;injection=$Injection}|ConvertTo-Json -Depth 3|Set-Content -LiteralPath $statusPath -Encoding utf8
}
$source=@"
using System;using System.Runtime.InteropServices;
[ComImport,Guid("2e941141-7f97-4756-ba1d-9decde894a3d"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]public interface IAppActivationManager{[PreserveSig]int ActivateApplication([MarshalAs(UnmanagedType.LPWStr)]string appUserModelId,[MarshalAs(UnmanagedType.LPWStr)]string arguments,uint options,out uint processId);}
public static class CommonCodexActivator{public static uint Start(string id,string args){var t=Type.GetTypeFromCLSID(new Guid("45BA127D-10A8-46EA-8AB7-56EA9078943C"));var m=(IAppActivationManager)Activator.CreateInstance(t);uint p;int h=m.ActivateApplication(id,args,0,out p);Marshal.ThrowExceptionForHR(h);return p;}}
"@
try {
  Add-Type -TypeDefinition $source
  $existing=Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue|Where-Object {$_.LocalAddress -eq '127.0.0.1'}|Select-Object -First 1
  if(-not $existing) {
    $all=@(Get-CimInstance Win32_Process)
    $roots=@($all|Where-Object {$_.Name -eq 'ChatGPT.exe' -and $_.ExecutablePath -eq $appPath -and $_.CommandLine -notmatch '--type=|user-data-dir' })
    if($roots.Count -gt 1){throw "Common profile root is ambiguous: $($roots.Count)."}
    if($roots.Count -eq 1) {
      if(-not $config.restartExisting){throw 'Close the running normal Codex window and launch again, or explicitly enable restartExisting during installation.'}
      $root=$roots[0]
      $ids=[System.Collections.Generic.HashSet[int]]::new()
      [void]$ids.Add([int]$root.ProcessId)
      do {
        $added=$false
        foreach($p in @(Get-CimInstance Win32_Process|Where-Object {$_.Name -eq 'ChatGPT.exe' -and $_.ExecutablePath -eq $appPath})) {
          if($ids.Contains([int]$p.ParentProcessId)-and -not $ids.Contains([int]$p.ProcessId)){[void]$ids.Add([int]$p.ProcessId);$added=$true}
        }
      } while($added)
      Save-State 'restarting' 'Stopping only the common-profile Codex UI.'
      try{[void](Get-Process -Id $root.ProcessId -ErrorAction Stop).CloseMainWindow()}catch{}
      Start-Sleep -Seconds 2
      foreach($id in @($ids)) {
        $p=Get-CimInstance Win32_Process -Filter "ProcessId=$id" -ErrorAction SilentlyContinue
        if($p -and $p.Name -eq 'ChatGPT.exe' -and $p.ExecutablePath -eq $appPath -and $p.CommandLine -notmatch 'user-data-dir'){Stop-Process -Id $id -Force}
      }
      $until=(Get-Date).AddSeconds(5)
      do {
        $left=@(Get-CimInstance Win32_Process|Where-Object {$_.Name -eq 'ChatGPT.exe' -and $_.ExecutablePath -eq $appPath -and $_.CommandLine -notmatch 'user-data-dir'})
        if($left.Count){Start-Sleep -Milliseconds 200}
      } while($left.Count -and (Get-Date)-lt $until)
      if($left.Count){throw 'The common-profile UI did not exit.'}
    }
    Save-State 'launching' 'Starting Codex with loopback debugging in its default profile.'
    $started=[CommonCodexActivator]::Start($aumid,"--remote-debugging-address=127.0.0.1 --remote-debugging-port=$Port --no-first-run")
    $until=(Get-Date).AddSeconds(20)
    do {
      $listener=Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue|Where-Object {$_.LocalAddress -eq '127.0.0.1'}|Select-Object -First 1
      if(-not $listener){Start-Sleep -Milliseconds 300}
    } while(-not $listener -and (Get-Date)-lt $until)
    if(-not $listener){throw "Codex activation PID $started did not open loopback CDP port $Port."}
  } else {$listener=$existing}
  $owner=[int]$listener.OwningProcess
  $ownerProc=Get-CimInstance Win32_Process -Filter "ProcessId=$owner" -ErrorAction Stop
  if($ownerProc.Name -ne 'ChatGPT.exe' -or $ownerProc.ExecutablePath -ne $appPath -or $ownerProc.CommandLine -match 'user-data-dir'){throw 'Port is not owned by the default-profile Codex process.'}
  if(Test-Path -LiteralPath $statusPath) {
    try {
      $saved=Get-Content -LiteralPath $statusPath -Raw | ConvertFrom-Json
      if($saved.state -eq 'complete' -and [int]$saved.processId -eq $owner -and $saved.injection -match 'renderer-patched') {
        [void](New-Object -ComObject WScript.Shell).AppActivate($owner)
        Write-Output 'Sorting was already attached to this process.'
        exit 0
      }
    } catch {}
  }
  Save-State 'injecting' 'Attaching the sorting extension to the default-profile main renderer.' $owner
  if(-not (Test-Path -LiteralPath $nodePath)){throw "Node executable missing: $nodePath"}
  $node=$nodePath
  $cli=Join-Path $repo 'bin\cli.mjs'
  $target=@()
  $targetUntil=(Get-Date).AddSeconds(20)
  do {
    $listRaw=(& $node $cli list --port $Port 2>&1|Out-String)
    $targets=@($listRaw|ConvertFrom-Json)
    $target=@($targets|Where-Object {$_.url -eq 'app://-/index.html'}|Select-Object -First 1)
    if($target.Count -ne 1){Start-Sleep -Milliseconds 400}
  } while($target.Count -ne 1 -and (Get-Date)-lt $targetUntil)
  if($target.Count -ne 1){throw 'Could not identify the default-profile main renderer after waiting.'}
  $attachRaw=(& $node $cli attach --port $Port --target $target[0].id --reload --once 2>&1|Out-String)
  if($LASTEXITCODE -ne 0 -or $attachRaw -notmatch 'renderer-patched'){throw "Renderer response was not patched: $attachRaw"}
  $proc=Get-Process -Id $owner -ErrorAction SilentlyContinue
  if($proc -and $proc.MainWindowHandle -ne [IntPtr]::Zero) {
    Add-Type @"
using System;using System.Runtime.InteropServices;public static class CommonCodexFocus{[DllImport("user32.dll")]public static extern bool ShowWindowAsync(IntPtr hWnd,int nCmdShow);[DllImport("user32.dll")]public static extern bool SetForegroundWindow(IntPtr hWnd);}
"@
    [void][CommonCodexFocus]::ShowWindowAsync($proc.MainWindowHandle,9)
    [void][CommonCodexFocus]::SetForegroundWindow($proc.MainWindowHandle)
  }
  Save-State 'complete' 'Sorting extension injected into the default-profile Codex main renderer.' $owner $attachRaw
} catch {
  Save-State 'failed' $_.Exception.Message
  if(-not @(Get-CimInstance Win32_Process|Where-Object {$_.Name -eq 'ChatGPT.exe' -and $_.ExecutablePath -eq $appPath -and $_.CommandLine -notmatch 'user-data-dir'}).Count) {
    try{[void][CommonCodexActivator]::Start($aumid,'--no-first-run')}catch{}
  }
  Write-Error $_.Exception.Message -ErrorAction Continue
  exit 1
}
