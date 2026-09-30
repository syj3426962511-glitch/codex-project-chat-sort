# Independent sorting across the sidebar — V2 specification

Updated 2026-09-30. **Proposed product behavior and implementation requirements, not a list of shipped features.** [中文完整规格](SIDEBAR_SORTING_SPEC.zh-CN.md)

## 1. Scope and observed evidence

Expand the earlier project-chat proposal to five scopes: **Pinned, Projects, Recents, custom sections, and chats inside an individual project**. Each scope gets sorting in its own three-dot menu and separately persisted preferences.

The supplied screenshots show existing Organize sidebar and Chat sort order entries in the Projects and Recents header menus. Their submenus were not expanded, so the screenshots do not establish available options or whether those settings are shared. Pinned is a requested scope, not a menu inspected in these screenshots. Private project titles and screenshots are not included in the public documentation.

Before implementing, inspect the actual scope of each current native action. Extend an existing action when its scope matches. If an existing action changes shared/global preferences, preserve and identify that meaning and add an explicitly scoped action. Never create identically named entries with different effects.

## 2. Menu and scope matrix

| Header/context | Suggested action | Direct items being sorted | Must not change |
| --- | --- | --- | --- |
| Pinned | Sort pinned items by | Pinned chats, projects, and other supported direct entries | Pin membership or chats inside a project |
| Projects | Sort projects by | Project folders themselves | Each project's chat order |
| Recents | Sort recent chats by | Chats eligible under the native Recents view | Membership, archive state, ownership, or another scope |
| Custom section | Sort this section by | Direct projects/chats in that section | Section membership or nested project chat order |
| Individual project | Sort chats by | Chats inside that project | Another project's order or the folder's sidebar position |

Use Recently updated / Date created / Name / Manual, ascending/descending for automatic modes, Adjust manual order, and Restore this scope's default sorting. Disable options whose required metadata cannot be obtained reliably, with an explanation. Empty scopes may retain preferences for future entries.

Example: project folders use Name, project A's chats use Date created, project B's chats use Recently updated, Pinned uses Manual, and Recents uses Recently updated. All five choices coexist.

## 3. Scope-specific semantics

### Pinned and custom sections

Preserve native membership and hierarchy. Sort a mixed flat list as a mixed list; where the host defines fixed blocks, sort within permitted blocks without crossing boundaries or inventing grouping. Project entries use project metadata, chats use chat metadata. Pin time is not creation time; any future pin-time mode needs a separate label.

Entering Manual snapshots the current effective order. New entries append. Unpinning does not delete content; re-pinning may restore a retained historical position, otherwise append. Section preferences use stable IDs so renaming/moving a section preserves them. Moving a project into another section changes its position according to the destination scope but does not change its internal chat preference.

### Projects

Name means project name. Date created must use a reliable project creation timestamp, never filesystem timestamps, earliest chat time, or first observation by the addon.

Recently updated uses a host-provided project activity timestamp with a documented meaning. Aggregating the maximum chat update is allowed only when the complete eligible chat metadata is available. A maximum from one loaded page is not a project-wide activity value. If neither source is available, disable the option; do not silently switch fields or sorting modes.

### Recents

Retain the native inclusion/filter rules for pinned chats, project chats, archived chats, and sources. Reordering must not insert or duplicate entries.

Today/Yesterday/Older buckets may remain in update mode only if their date basis matches the ordering field. Creation-date mode must regroup on creation time if buckets remain. Name and Manual should use a flat list within Recents so date buckets do not contradict the selected order. If the adapter cannot safely change grouping, label the limitation as sorting within each group, not the entire region.

### Individual projects

Continue using stable project identities. Pinning a project or moving it between sections must not change its internal chat preference. Remote/cloud project types need explicit data/menu adaptation before being marked supported.

## 4. Independent preferences, defaults, and recovery

Keep **direct container item order** separate from **nested project chat order**. Container sorting does not cascade into child projects or write to native global defaults.

A scope override wins within that scope; otherwise retain the host's original behavior, including priority/manual rules and fixed boundaries. Native shared-chat defaults affect only views that actually inherit them and have no override. Do not assume that Pinned, Projects, and custom sections inherit a global chat setting.

Restore this scope's default clears only that override and resumes the native behavior for that scope. It does not reset other scopes, move/delete content, or erase account configuration.

The proposed V2 schema uses `schemaVersion`, `scope`, `sort`, and `revision`. `scope` contains account, product surface, stable view scope, scope kind, stable scope ID, source, and host identity. Kinds are `pinned-items`, `project-list`, `recent-chats`, `section-items`, and `project-chats`. `sort` stores mode, direction, manual IDs, and a sorting locale. See the [Chinese schema example](SIDEBAR_SORTING_SPEC.zh-CN.md) for its JSON shape.

Built-in scopes use fixed IDs; custom sections/projects use native stable IDs, not names or positions. Mixed-host scopes use their stable view identity rather than the currently focused host. Manual item identity must combine source, host, entity type, and native ID to avoid collisions.

Use host preference storage. Label settings as local-only if synchronization is unavailable. On write failure, roll back the displayed change and show the error. Preserve corrupt data for recovery. Use revisions or the host conflict mechanism for concurrent writes; a stale manual editor must not silently overwrite newer state.

Migrate V1 project-chat preferences one-to-one into V2 `project-chats` without changing modes or manual IDs. New scopes start with no override. Preserve the old configuration, validate before atomic commit, make migration idempotent, and retain the old version on failure. This is a future migration requirement, not a migration performed by this documentation update.

## 5. Shared behavior

| Case | Required behavior |
| --- | --- |
| Defaults | Dates descending, names ascending; timestamps normalized to Unix milliseconds |
| Missing dates | Missing entries always last; disable a mode when its metadata is entirely unavailable; indicate partial metadata |
| Names and ties | Locale-aware natural ordering, numeric 2 before 10; composite stable IDs break ties |
| Manual | Snapshot effective order; updates/renames do not move items; new items append; drag and keyboard movement |
| Stale editing | Recheck scope, membership, and revision before save; require refresh on conflict |
| Archive/restore | Native visibility rules apply; retained manual positions can support restoration; remove permanently deleted references |
| Temporary filters | Never overwrite full manual order with a filtered subset; disable manual save if reconciliation is unavailable |
| Pagination | Full sorting needs server-ordered pagination or complete metadata; otherwise explicitly say loaded items only |
| Restart | Validate preference persistence and injection reload independently |
| New activity | Changes only update-dependent views; manual/name/creation order remains stable |
| Accessibility | Radio state, scope explanation, keyboard navigation/Enter/Escape/focus return; equivalent English/Chinese labels |
| Unsupported versions | Preserve native menus/order and report the unsupported scope; never bypass fingerprint checks |

## 6. Implementation status and sequence

| Capability | Status at this specification update |
| --- | --- |
| Loaded chats in supported unpinned local/remote projects | Existing experimental adapter; bounded native evidence |
| Pinned header and direct item order | Proposed, not implemented |
| Projects header and folder order | Proposed, not implemented |
| Independent Recents and bucket behavior | Proposed, not implemented |
| Custom section sorting | Proposed, not implemented |
| Chats inside pinned projects; cloud project menus | Future adapters, not currently supported |
| V2 migration, complete pagination, concurrent window handling | Requirements only |
| macOS native menu | Launcher preview, no validated Mac renderer |

Suggested sequence: verify current native menu/data contracts; implement scope keys and lossless migration; add Projects and Recents; add Pinned and custom sections; address pagination/grouping/concurrency; verify every scope on Windows; separately adapt macOS. Maintain support status per scope, not a single global success flag.

## 7. Acceptance criteria — pending, not test results

| ID | Scenario | Required outcome |
| --- | --- | --- |
| S01 | Five menu contexts | Clear scopes, no duplicates or accidental global writes |
| S02 | Folder names + project A dates + project B manual | Independent simultaneous ordering |
| S03 | Mixed pinned projects/chats | Only permitted direct entries move; membership/hierarchy unchanged |
| S04 | Missing project creation/activity metadata | Disable unsupported mode; never fabricate or substitute |
| S05 | Recents name/manual | Buckets do not contradict ordering; native filters remain |
| S06 | Rename/move sections or move entries | Scope settings survive; child chat preferences unchanged |
| S07 | Global changes and scoped reset | Overrides remain; reset clears only the selected scope |
| S08 | Same names/IDs across accounts, sources, hosts | No configuration or manual-position collision |
| S09 | Pagination, unloaded entries, temporary filters | Honest loaded-only boundary; retain unseen manual IDs |
| S10 | Create/rename/update/pin/archive/restore | Mode-specific stability, no content deletion/duplication |
| S11 | Write errors, corruption, concurrent edits | Recoverable state and visible errors; no false success |
| S12 | Migration, repeat migration, migration failure | Existing project settings retained; rollback works |
| S13 | Reopen and multiple windows | Separate evidence for preferences, injection, and synchronization |
| S14 | English/Chinese, keyboard, empty scope | Equivalent labels and accessible actions |
| S15 | Unsupported build/platform | Native functionality remains; unverified injection rejected |

Existing evidence: [Validation](VALIDATION.md). Maintainer context: [Developer brief](FOR_CODEX_DEVELOPERS.md). This update changes documentation only, not live ordering, preferences, launchers, or app packages.
