# Per-project chat sorting: community prototype for Codex developers

## Expanded sidebar proposal — 2026-09-30

The requested design now includes sorting in the three-dot menus for **Pinned, Projects, Recents, custom sections, and individual projects**. Each header sorts its direct items: Projects sorts folders, whereas an individual project sorts its chats. Choices persist independently and scoped reset does not modify other containers or child projects. Existing native Chat sort order entries must be checked for their actual shared/global scope before extending them.

The [V2 specification](SIDEBAR_SORTING_SPEC.en.md) defines mixed pinned items, project metadata availability, Recents date buckets, manual order, pagination, migration, and 15 acceptance scenarios. The [Chinese version](SIDEBAR_SORTING_SPEC.zh-CN.md) includes the proposed JSON schema. **This is a documentation-only expansion. The current adapter still does not implement the additional header scopes.**

## User problem and proposed behavior

With many research or engineering chats inside several projects, a shared sidebar ordering rule makes it difficult to keep each project organized. The requested native workflow is **project menu → Sort chats by → Recently updated / Date created / Name / Manual**, persisted independently for each project. For example, one project can keep numbered experiments in natural name order while another shows recent activity.

This MIT community prototype explores that workflow. It includes an English/Chinese menu and manual-order dialog, independent project preferences, startup helpers, a portable skill, and a synthetic fixture. It is not an official plugin or a proposal to ship runtime injection as the permanent implementation.

## Implementation map

- `src/core.mjs`: sorting, direction, deterministic ties, missing timestamps, and manual-order reconciliation.
- `src/addon.mjs`: menu state and settings scoped by account, source, host, and project ID.
- `src/arrange.mjs` and `src/i18n.mjs`: manual-order UI and localized labels; document language is preferred, browser language is the fallback. The host's private locale state is not assumed.
- `src/renderer-adapter.js` and `profiles/`: a single fingerprint-pinned host adapter. Unknown sources are rejected.
- `skills/codex-project-chat-sort/`: portable runtime and reversible Windows shortcut setup; unverified macOS launcher preview.

## Evidence and limits

The Windows renderer fingerprint for build 26.924.22138 / package 26.924.2738.0 was matched. One normal/default-profile runtime injection returned `renderer-patched`; a separate test window's menu was visually confirmed. The shortcut install/preflight/restore flow was tested on temporary shortcuts. The full normal-window restart interaction and the latest localized menu have not been visually validated in the native client.

CI runs on Windows, macOS, and Linux. Those tests cover library behavior and platform helper logic; macOS CI does not install or test the proprietary Codex app. No Mac-specific renderer profile or live Mac integration is validated. The Mac launcher stops on a mismatched renderer.

Only loaded chats in supported unpinned local/remote projects are sorted. Pinned projects, cloud project menus, paginated history, and multi-window synchronization are outside the current adapter. Runtime injection must be reapplied after restart and can be lost on page reload. The project neither modifies signed app bundles nor distributes client binaries or user data.

## Request to maintainers

Please consider native per-project sorting, or a documented project-menu/sidebar extension API with stable project identity, timestamps, preference persistence, and a supported manual-order contract. Native ownership would make pagination, pinning, synchronization, and upgrades reliable. The sorting logic and interaction design are available for review under MIT; feedback on the appropriate extension boundary is welcome.

- [Source and English overview](../README.en.md)
- [Downloads](https://github.com/syj3426962511-glitch/codex-project-chat-sort/releases)
- [Existing feature request](https://github.com/openai/codex/issues/48910)
