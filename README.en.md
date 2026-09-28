# Codex Project Chat Sort

**Experimental source-only alpha; not an official Codex plugin.** A one-time in-memory renderer injection was exercised in the normal Windows Codex default-profile window and returned `renderer-patched`. The sorting menu was visually confirmed in a separate test window; the menu has not been separately captured in the normal window, and persistence across restart is unverified.

Adds a per-project **Sort chats by** menu: last updated, date created, natural name order, and manual order. Preferences are scoped by account, source, host, and project ID. Includes an accessible manual-order dialog, a pure sorting engine, a synthetic browser fixture, and a fingerprint-gated CDP response adapter.

No third-party runtime dependencies. Node.js 22+ required.

```sh
node --test test/*.test.mjs
node tools/preview.mjs
```

Open `http://127.0.0.1:9438` for the **synthetic fixture**, not a live Codex integration.

## Verification boundaries

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

To revert, stop the CLI and reload the test client. Use the addon menu's reset action to clear a project's override. There is no auto-start installer.

See [validation](docs/VALIDATION.md), the [normal-window injection report](docs/DEFAULT_PROFILE_INJECTION.md), [research](docs/RESEARCH.md), and the [Chinese README](README.md). MIT for original project code only; proprietary host binaries are not distributed. Not affiliated with or endorsed by OpenAI.
