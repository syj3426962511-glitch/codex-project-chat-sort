# Windows setup and verification

## Simplest setup

Extract the skill folder and double-click `Install.cmd`. No arguments are needed when one desktop ChatGPT/Codex shortcut and Node.js 22+ can be found. Setup uses `CODEX_HOME/addons/codex-project-chat-sort`, or `~/.codex/addons/codex-project-chat-sort` if CODEX_HOME is unset. After it reports success, save work, close Codex, and reopen using the same desktop icon. Use `Uninstall.cmd` to restore the shortcut. Repeated setup recognizes an unchanged existing installation. It does not forcibly restart the app or download missing dependencies. For custom installation directories, restore with `Restore.ps1 -InstallDirectory ...`.

`Setup.ps1 -CheckOnly` verifies automatic discovery and compatibility without changing any shortcut. Missing or ambiguous prerequisites produce an actionable error rather than choosing an unrelated shortcut.

Run the PowerShell scripts with `powershell.exe -NoProfile -File ...` (Windows PowerShell 5.1). PowerShell 7 may fail to load the Appx module. Node.js 22+ must already be installed; pass the actual executable path rather than relying on Explorer's PATH. No Node or Codex binaries are redistributed.

The skill folder is self-contained. Example placeholders below must be replaced with the user's actual paths:

```powershell
powershell.exe -NoProfile -File "SKILL/scripts/Install.ps1" -InstallDirectory "USER_DIR/CodexSort" -ShortcutPath "DESKTOP/ChatGPT.lnk" -NodePath "NODE/node.exe"
```

The installer requires an existing `.lnk` and a new, empty installation directory. The optional `-RestartExisting` makes future shortcut launches restart a normal running Codex window that lacks a debugging endpoint. Without it the launcher reports the need to close that window; it does not force close it. Installing the shortcut does not start or restart the client.

The installer resolves the registered OpenAI.Codex package and its application ID from the manifest, checks the renderer fingerprint, then writes `config.json`, the runtime, scripts, and `Start-Sorting.cmd` to the chosen directory. It saves `shortcut.original.lnk` and its SHA-256 in `shortcut.json`, and verifies the replacement shortcut target. Keep this directory after installation; moving it breaks the shortcut.

Launch through the chosen shortcut. The helper uses Windows Application Activation Manager, since directly executing the protected WindowsApps executable may fail. It polls the local debugging endpoint, verifies its owner is the expected default-profile app, and attaches only to the main page. `state.json` records the result. Port 9438 is the default; use `-Port` at installation to choose another free port. Existing listeners with another owner are rejected.

Verify a project's menu, name/date ordering, independent choices in two projects, manual adjustment, and reopening from the same shortcut. Source fingerprints and `renderer-patched` are intermediate evidence; they do not establish all those behaviors. The one-shot CLI has passed an isolated-window injection test; the original normal-window shortcut's full restart loop had not been visually verified at publication.

Restore with:

```powershell
powershell.exe -NoProfile -File "INSTALL_DIR/scripts/Restore.ps1" -InstallDirectory "INSTALL_DIR"
```

Restore checks both the original backup and the current shortcut hashes, so it will not overwrite an unrelated shortcut edit silently. Runtime files are retained for inspection; removing them later is a separate cleanup action. If an application update changes the fingerprint, injection stops before restart. Review a new adapter instead of skipping the check.
