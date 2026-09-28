# Existing-project search — 2026-09-28

Searches included `Codex desktop plugin sort threads per project name Windows github`, `codex desktop extension sidebar sorting plugin Windows owl`, and GitHub repository queries `codex sort sidebar plugin` / `codex desktop sorting`.

No ready-made project matching all four sorting modes, per-project persistence, Windows, and the existing project's menu was found in these searches. This is a bounded search result, not proof that none exists.

| Project | Relevance | Gap |
| --- | --- | --- |
| [Explodex](https://github.com/dan-dr/explodex) | Renderer extension SDK and project-related plugins | [Windows is a feasibility note, not a support claim](https://github.com/dan-dr/explodex/blob/main/docs/windows-feasibility.md); not a verified four-mode sorter |
| [CodeDrobe Desktop](https://github.com/CodeDrobe/desktop) | Windows/macOS appearance customization with debugging-based loading | Theme manager, not per-project chat sorting |
| [Codex Usage Sidebar](https://github.com/JaceHwang/codex-usage-sidebar) | Windows companion UI example | Quota display, not chat sorting |
| [Codex sidebar project repair](https://github.com/tonyabracadabra/codex-sidebar-project-repair) | Project-state recovery | Recovery tool, not the requested menu feature |

This repository uses original implementation code; it does not bundle these projects or claim their compatibility. The host adapter was derived from read-only inspection of a locally installed build. Only small replacement anchors and a source fingerprint are published, not host binaries or full source.

## Official plugin API boundary

Checked OpenAI's [plugin architecture](https://developers.openai.com/plugins/concepts/plugins), [plugin UI guide](https://developers.openai.com/plugins/build/chatgpt-ui), and [plugin packaging guide](https://developers.openai.com/plugins/build/plugins) on 2026-09-28. The documented plugin capabilities are skills, MCP tools/servers, lifecycle hooks, and optional tool-associated UI. The UI guide describes components rendered with the conversation; the docs do not document a Codex desktop sidebar or project-menu registration API.

This means the current public plugin API cannot deliver this repository's requested native three-dot menu integration. This is a bounded conclusion from the published API, not a claim about undocumented or future interfaces. A direct launch of the installed Windows Store package first returned Access Denied; later, Windows package activation allowed a loopback-only debugging session and one in-memory patch in the normal window. That experiment does not provide a supported or persistent integration; see [the runtime report](DEFAULT_PROFILE_INJECTION.md). We did not alter package permissions or installation files. A supported sidebar extension point, or an upstream Codex implementation, is required for true production-client integration.
