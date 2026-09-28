---
name: codex-project-chat-sort
description: Install, launch, diagnose, or restore the experimental per-project chat sorting menu in supported Windows Codex Desktop builds, including optional desktop-shortcut startup injection.
---

# Codex project chat sorting

Provide Recent update, Date created, natural Name, and Manual sorting in each supported project's menu. Preferences are scoped by account, source, host, and project ID. This skill includes the original MIT runtime in `assets/runtime`; Node.js 22+ and Windows PowerShell 5.1 are prerequisites. Loading a skill alone does not change the native menu.

## Workflow

For a user who simply wants sorting enabled, prefer `scripts/Setup.ps1` without arguments. It discovers Node, the desktop ChatGPT/Codex shortcut, and the registered app, checks compatibility, and configures startup without closing the running app. Instruct the user to save work, close Codex, and reopen through that desktop icon. Do not ask them to supply paths that discovery can resolve. `-CheckOnly` previews the detected setup without changes. Only request a specific path if discovery is missing or ambiguous. A user can alternatively double-click `Install.cmd`; `Uninstall.cmd` restores the default installation's shortcut. Advanced custom installations use the explicit commands below.

1. Establish the requested mode: inspect, install a startup shortcut, launch/inject now, or restore. Respect the user's chosen shortcut and output directory. Installing this skill is not permission to restart active work. Do not invoke the launcher from inside the very client it would close unless that restart is explicitly authorized and the user is ready for interruption.
2. Run the bundled CLI's read-only `doctor` against the actual installed `resources/app.asar`. Discover the registered `OpenAI.Codex` Windows package with Windows PowerShell 5.1; distinguish its `ChatGPT.exe` from `codex.exe` and the `.codex` data directory. Require `compatibleSource: true`; never disable the fingerprint check or change WindowsApps permissions to make an unsupported build work.
3. For shortcut setup, use `scripts/Install.ps1` with absolute `-InstallDirectory`, `-ShortcutPath`, and `-NodePath`. It copies the runtime to a durable user-owned directory, backs up the exact shortcut bytes, and stores only local configuration there. It does not launch the app. `-RestartExisting` is opt-in: select it only when restarting a running normal window is within the user's request. See [Windows workflow](references/windows.md) for commands.
4. For launch, use the installed `Start-Sorting.cmd`. The launcher checks the current package fingerprint before any restart, validates the loopback listener's process, selects the main `app://-/index.html` renderer, and requires successful `--reload --once` attachment. A normal app already running without debugging needs a restart; a separate test profile must not be substituted for the user's usual window.
5. Verify shortcut target and backup hashes separately from injection. Check `state.json` for `complete` and `renderer-patched`, then verify the project menu and sorting in the intended window. For restart persistence, actually close and reopen through that shortcut and verify again. Do not equate source compatibility, a successful response patch, or a test-window screenshot with full normal-window behavior.
6. Restore the shortcut with `scripts/Restore.ps1 -InstallDirectory ...`. Reopening the app through the restored entry removes runtime injection. Use the menu's reset action to clear a project's sorting override; do not delete conversation data.

## Supported scope

The adapter is pinned to renderer 26.924.22138 / Windows package 26.924.2738.0. It sorts already-loaded chats in supported unpinned local/remote project menus. Pinned projects, ChatGPT cloud project menus, unloaded history, and multi-window synchronization are not supported. Manual ordering uses the addon's dialog. Other launch entries do not inherit the selected shortcut's behavior. A page reload after one-shot attachment can remove the patch until reinjection.

Only bind CDP to `127.0.0.1`; it controls the app instance. No app binary, auth token, conversation database, or personal runtime data belongs in an uploaded skill. Publishing or messaging an upstream issue requires user authorization; this skill itself grants none.
