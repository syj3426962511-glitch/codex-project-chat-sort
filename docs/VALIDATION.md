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

## Concrete blocker

Attempted to start the installed Windows desktop executable with isolated app profile, isolated agent data, and loopback debugging. `Start-Process` returned **access denied**. The probe process did not start. No production client was stopped, restarted, patched, or debug-enabled.

No attempt was made to change WindowsApps permissions or bypass package protection. The alpha can be inspected and tested offline, but its host loading path, menu appearance, restart persistence, and compatibility with the current live client remain unverified.

## Official integration feasibility — 2026-09-28

Reviewed the current OpenAI plugin documentation. It describes skills, MCP integrations, lifecycle hooks, and optional UI returned by tools; it does not document a supported API for adding controls to the Codex desktop project sidebar or its three-dot menu. Therefore this extension cannot be installed as an official plugin to achieve the requested native menu behavior. This is a conclusion bounded by the public documentation reviewed, not by access to internal APIs.

No production app files, WindowsApps permissions, or active Codex processes were changed. Formal native integration remains blocked on a supported sidebar/project-menu extension API or an upstream client change. The GitHub repository remains an experimental community extension and must not be described as production-integrated.

The project must remain experimental until a real supported host is exercised. Passing core tests or source syntax checks does not establish full desktop compatibility.
