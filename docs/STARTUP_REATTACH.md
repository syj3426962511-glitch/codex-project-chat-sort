# Reapply the experimental sort menu at launch

The renderer patch is in memory. To load it again after an app restart, route a user-owned shortcut through a launcher that starts the installed Codex app with a loopback-only debugging endpoint, identifies the main page, and calls `attach --reload --once`. This is an external launch workflow, not an official plugin or a modification of `app.asar`.

The launcher should:

1. Back up the original shortcut and offer a way to restore it. Restrict shortcut changes to the user's chosen entry point.
2. Run `doctor --asar PATH` against the installed package and require `compatibleSource: true` **before** closing any existing app window. An update that changes the renderer fingerprint must stop the launcher until the adapter is reviewed.
3. If the default-profile app is already running without a debugging endpoint, save work and restart it through the Windows Application Activation Manager. Use `--remote-debugging-address=127.0.0.1` and a dedicated port. Do not use a separate test `--user-data-dir` when the normal profile is intended.
4. Check that the loopback listener belongs to the expected installed app process. Use `list --port PORT` to select the exact `app://-/index.html` page ID, then run `attach --port PORT --target PAGE_ID --reload --once`.
5. Require a `renderer-patched` result and verify the menu visually. If attachment fails, report failure; a launcher should not describe a started but unpatched app as a success.

In an isolated test of the supported Windows build, `attach --reload --once` returned `renderer-patched` and exited successfully. The normal user's desktop shortcut was then pointed to a local launcher and read back, with its original shortcut preserved. That normal-window restart through the new shortcut has **not** yet been observed, so this is a validated launch configuration rather than a claim of verified restart persistence. Other launch paths still start the unmodified app without this workflow.

The debugging endpoint is a control interface. Keep it on loopback, never expose or forward it, and avoid reloading a page with unfinished work. The app package and user conversation database are left untouched.
