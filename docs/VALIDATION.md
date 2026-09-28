# Validation — 2026-09-28

## Automated

`node --test test/*.test.mjs`: 17 tests passed, 0 failed at the final local validation checkpoint. Covers sorting fields/directions, natural numeric names, manual stability, preference isolation, corrupt settings, write failure, menu integration, resetting overrides, unknown metadata, stale manual dialogs, unsupported groups, ASAR bounds, payload syntax, fingerprint rejection, ambiguous-anchor rejection, and response interception/pass-through.

The exact installed renderer was read without modification, all five replacement anchors matched once, and `node --check` accepted the patched module. SHA-256 before transformation:

`41d8d711bb87cb6941bcca253b913b521d008d0ef077b1b4b3f75a82113b0579`

App metadata: `26.924.22138`; Windows package: `26.924.2738.0`; runtime metadata: `owl`.

## Browser fixture

Verified through the in-app browser using synthetic data:

- Project A name order became `01-准备`, `02-实验`, `10-汇总`; project B stayed unchanged.
- Reload preserved A's name-order setting.
- Creation-date descending produced `02-实验`, `01-准备`, `10-汇总`.
- Manual-order dialog moved `10-汇总` above `02-实验` and saved.
- Simulated update and reload retained manual order `01-准备`, `10-汇总`, `02-实验`.

Screenshot `preview-fixture.png` is explicitly a fixture, not a screenshot of a modified Codex sidebar. Keyboard activation was used for reliable browser interaction verification. Drag behavior and host-native keyboard navigation have not been verified end to end.

## Windows client runtime integration — 2026-09-28

The first attempt to launch the packaged app directly with `Start-Process` returned **access denied**. A later attempt used the Windows Application Activation Manager to start the packaged app with Chromium remote debugging bound only to `127.0.0.1`. The isolated test window accepted the renderer patch; the user visually confirmed the sort submenu there.

The same procedure was then applied to the normal/default-profile Codex window. The packaged app was identified by its executable path, launched through its registered application identity with loopback-only debugging arguments, and checked to ensure the debugging listener belonged to the expected default-profile process. The CLI selected the main `app://-/index.html` renderer (not an overlay or detached target) and ran `attach --reload`. It returned `renderer-patched` for app version `26.924.22138`; the foreground window was verified to be that process. The user had authorized restarting the normal window in the preceding conversation.

This is evidence of a successful one-session in-memory renderer response replacement in the normal window. The sort submenu itself was visually confirmed in the test window, but a separate screenshot/read-back of the menu in the normal window was not captured. Sort-selection behavior, persistence in the normal profile, restart recovery, and multi-window synchronization are not established by the `renderer-patched` response.

No WindowsApps files or permissions were modified. The extension does not install as a native plugin and is not automatically reloaded after the app exits. The complete, anonymized procedure and limitations are recorded in [DEFAULT_PROFILE_INJECTION.md](DEFAULT_PROFILE_INJECTION.md). Keep any debugging listener on loopback; it can control the app instance.

## Official integration feasibility — 2026-09-28

Reviewed the current OpenAI plugin documentation. It describes skills, MCP integrations, lifecycle hooks, and optional UI returned by tools; it does not document a supported API for adding controls to the Codex desktop project sidebar or its three-dot menu. Therefore this extension cannot be installed as an official plugin to achieve the requested native menu behavior. This is a conclusion bounded by the public documentation reviewed, not by access to internal APIs.

No production app files or WindowsApps permissions were changed. The normal app process was restarted with loopback debugging enabled for the one-time runtime test. Formal native integration remains blocked on a supported sidebar/project-menu extension API or an upstream client change. The GitHub repository remains an experimental community extension and must not be described as a native or persistent production integration.

The project must remain experimental until a supported host API is available and the full user-facing behavior is verified. Passing core tests, source syntax checks, or a renderer response replacement does not establish full desktop compatibility.
