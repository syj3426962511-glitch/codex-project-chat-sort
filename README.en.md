# Codex Project Chat Sort

[中文](README.md) · [For Codex developers](docs/FOR_CODEX_DEVELOPERS.md) · [Downloads](https://github.com/syj3426962511-glitch/codex-project-chat-sort/releases)

**2026-09-30 specification update:** [Sidebar sorting V2](docs/SIDEBAR_SORTING_SPEC.en.md) now covers Pinned, Projects, Recents, custom sections, and project chats with independent scopes, persistence, reset behavior, and acceptance criteria. **These additional scopes are proposed, not implemented in the current downloads.**

An MIT community prototype for **project menu → Sort chats by → Recently updated / Date created / Name / Manual**, with preferences saved separately for each project. English and Chinese menu/dialog labels follow the document language, falling back to the browser language; other locales use English. Native localized UI has not yet been visually verified.

The **`codex-project-chat-sort-en.zip`** release contains the portable skill, installers, this English overview, and the developer brief. Open its `codex-project-chat-sort` folder to find the installers.

**Extract the ZIP and double-click `Install.cmd` to bind your desktop ChatGPT shortcut to the sorting launcher.** Setup backs up the original shortcut before replacing its target and does not close the running client. After successful setup, exit Codex and reopen it through that same desktop icon; use the icon for subsequent launches as well.

**Quick start:** Download **`codex-project-chat-sort.zip`** from [Releases](https://github.com/syj3426962511-glitch/codex-project-chat-sort/releases), extract it, and double-click **`Install.cmd`**. Setup discovers Node, the registered client, and a unique desktop ChatGPT/Codex shortcut. After success, save work, close Codex, and reopen through that same desktop icon. Double-click **`Uninstall.cmd`** to restore. A supported build and Node.js 22+ are still required; installing the skill alone does not execute setup.

**Experimental version-pinned alpha; not an official Codex plugin.** A one-time in-memory renderer injection was exercised in the normal Windows Codex default-profile window and returned `renderer-patched`. The sorting menu was visually confirmed in a separate test window; the menu has not been separately captured in the normal window, and persistence across restart is unverified.

## macOS launcher preview

Use `Install-mac.command` / `Uninstall-mac.command`. After successful source compatibility checks, setup creates a separate desktop `Codex Sorting.command`; the original Dock icon is unchanged. **No Mac-specific renderer profile or live Mac integration has been validated yet.** A mismatched Mac renderer is rejected before installation. This release provides the launcher code, not verified Mac sorting support. See [macOS workflow](skills/codex-project-chat-sort/references/macos.md).

Adds a per-project **Sort chats by** menu: last updated, date created, natural name order, and manual order. Preferences are scoped by account, source, host, and project ID. Includes an accessible manual-order dialog, a pure sorting engine, a synthetic browser fixture, and a fingerprint-gated CDP response adapter.

No third-party runtime dependencies. Node.js 22+ required.

```sh
node --test test/*.test.mjs
node tools/preview.mjs
```

Open `http://127.0.0.1:9438` for the **synthetic fixture**, not a live Codex integration.

## Installable skill

[`skills/codex-project-chat-sort`](skills/codex-project-chat-sort/SKILL.md) is a self-contained skill with the MIT sorting runtime and Windows install, launch, and restore scripts. Copy that complete folder into `$CODEX_HOME/skills/` (or `~/.codex/skills/`), reload skill discovery, and invoke `$codex-project-chat-sort`. The `.skill` release asset is a ZIP containing the same folder.

Installing the skill does not itself inject a native menu. It guides a fingerprint-gated setup for the user's chosen shortcut, using Node.js 22+ and Windows PowerShell 5.1. No client binaries, Node executable, or personal machine configuration is included. Temporary shortcut installation, launcher preflight, and byte-exact restoration were tested; the normal window's complete restart loop remains unverified. Refresh bundled sources with `node tools/build-skill.mjs`, run tests, and package with `python tools/package-skill.py`.

## Validation status

- Unit tests and the synthetic browser interaction checks pass.
- The installed renderer matching app version 26.924.22138 was inspected; its modified source parses successfully.
- A direct packaged-app launch first returned **access denied**; Windows package activation later allowed a loopback-debug session.
- A one-time renderer injection in the normal/default-profile window returned `renderer-patched`. The menu was visually confirmed only in the separate test window; the normal window has not had a separate visual or interaction verification.
- This alpha sorts only already-loaded chats. It does not fetch paginated history.
- Local/remote unpinned project menus are adapted; pinned projects and ChatGPT cloud project menus are not.
- Manual reordering uses the addon dialog, not the host's built-in drag handler.
- Host restart persistence and multi-window behavior remain unverified.

## Experimental integration

```sh
node bin/cli.mjs doctor --asar "PATH/TO/resources/app.asar"
node bin/cli.mjs list --port 9437
node bin/cli.mjs attach --port 9437 --target PAGE_ID
node bin/cli.mjs attach --port 9437 --target PAGE_ID --reload --once
```

This requires a test instance or an intentionally restarted default-profile instance that was launched with loopback debugging. Debug endpoints must remain on loopback: they allow control of that instance. The CLI does not launch or terminate a client. After attaching, reload the page manually, or use the explicit `--reload` switch. `--once` closes the CDP connection after the first successful patch and is useful for an external launcher. Do not reload ongoing work. The default-profile procedure is documented [here](docs/DEFAULT_PROFILE_INJECTION.md); the restart-time launcher pattern is documented [here](docs/STARTUP_REATTACH.md).

The adapter checks the exact renderer SHA-256 and unique patch anchors before replacing one in-memory script response. A mismatch leaves the original script intact. No ASAR, installation file, auth token, or conversation database is modified. No telemetry or chat uploads.

To revert a configured Windows shortcut, run `Uninstall.cmd`; on macOS run `Uninstall-mac.command` to remove the unchanged generated launcher. To remove a runtime patch, stop the CLI and reload or reopen through the original app entry. Use the addon menu's reset action to clear a project's override. Installing the skill itself does not automatically run these installers.

See [validation](docs/VALIDATION.md), the [normal-window injection report](docs/DEFAULT_PROFILE_INJECTION.md), [research](docs/RESEARCH.md), and the [Chinese README](README.md). MIT for original project code only; proprietary host binaries are not distributed. Not affiliated with or endorsed by OpenAI.
