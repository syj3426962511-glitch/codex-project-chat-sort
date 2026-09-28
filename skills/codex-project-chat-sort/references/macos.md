# macOS experimental launcher

**Status: launcher implementation only; no Mac-specific Codex renderer has been validated.** The bundled renderer fingerprint was obtained from Windows. macOS injection is permitted only if its source matches that exact fingerprint; matching version labels alone are insufficient. An incompatible build stops before installation. Do not describe this package as verified Mac sorting support.

1. Install Node.js 22+ for the Mac's architecture. Extract the ZIP and double-click `Install-mac.command`. It searches `/Applications/Codex.app` and `~/Applications/Codex.app`. For another location, use `node scripts/mac.mjs install --app '/path/Codex.app'` from the skill directory. `check` instead of `install` performs read-only compatibility inspection.
2. If compatibility succeeds, setup creates `~/Desktop/Codex Sorting.command` and stores the runtime under `~/Library/Application Support/CodexProjectChatSort`. Existing files are never overwritten. It does not replace a Dock icon, Finder alias, or the signed application.
3. Save work and quit Codex completely, then double-click **Codex Sorting.command**. The launcher reads the executable name from the bundle's Info.plist, starts the same app with a loopback debugging endpoint, checks the listener PID/address, selects the main renderer, and performs one-shot injection. `state.json` records complete/failed; verify the menu visually afterwards. Other launch entries do not run injection.
4. `Uninstall-mac.command` removes only the unchanged generated desktop launcher. Runtime/config files remain for inspection. Use `--root` on install/launch/uninstall when overriding the installation directory.

Finder may require permission to open downloaded scripts. Follow the Mac's normal approval/signing policy; do not strip quarantine, disable Gatekeeper, or re-sign the official app as a workaround. From a terminal, `bash Install-mac.command` uses the same setup logic where local policy permits. The ZIP preserves executable permissions for `.command` files.

The launch mechanism uses Electron's documented [remote-debugging-port switch](https://www.electronjs.org/docs/latest/api/command-line-switches). Support for flags and the concrete renderer still requires live validation of the target Codex build. Tests of shell quoting, bundle-path validation, and launcher removal do not replace that test.
