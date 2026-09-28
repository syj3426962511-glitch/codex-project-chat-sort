# Normal Windows Codex Window: Runtime Injection Report

Date: 2026-09-28  
Status: one-session experiment; not an official plugin installation  
Client build observed: `26.924.22138`  
Windows package observed: `26.924.2738.0`

## Why this report exists

The sorting menu was already visible in a separate test window, while the user's usual Codex window did not show it. This report records how the same version-gated renderer adapter was attached to the normal/default-profile window, what was verified, and what remains unverified. It contains no user profile paths, process IDs, target IDs, chat titles, or conversation contents.

## Process used

1. **Identify the packaged client without changing it.** The installed package and executable were inspected read-only to distinguish the normal Windows package from the separate test instance. The package files and WindowsApps permissions were left untouched.

2. **Start a debugging-enabled instance through Windows package activation.** Directly calling `Start-Process` on the packaged executable had returned `Access Denied`. The successful attempt used the Windows Application Activation Manager with the app's registered application identity. The launch arguments were limited to:

   ```text
   --remote-debugging-address=127.0.0.1
   --remote-debugging-port=9438
   --no-first-run
   ```

   No separate `--user-data-dir` was supplied, so the normal/default profile was used. The usual window had to be restarted for Chromium to open the debugging endpoint at launch; adding the flags after an already-running renderer had started was not sufficient. Save or finish any in-progress work before restarting an app window.

3. **Confirm the endpoint belongs to the intended window.** The listener was checked to be loopback-only and owned by the installed `ChatGPT.exe` process launched with the default profile. This distinguishes the usual window from the separate test process. The debugging endpoint can control that app instance, so it must not bind to a LAN or public interface.

4. **Select the main renderer explicitly.** The CLI listed the available pages:

   ```powershell
   node bin/cli.mjs list --port 9438
   ```

   The target was the main `app://-/index.html` page, not a transient overlay, sign-in page, or detached window. The patch was then attached and the page reloaded:

   ```powershell
   node bin/cli.mjs attach --port 9438 --target <main-page-id> --reload
   ```

   The CLI reported `renderer-patched` and app version `26.924.22138`. The operating-system foreground window was checked against the same process after attachment.

5. **Keep the verification claim bounded.** In the separate test window, the user visually confirmed the submenu with: Recent update, Date created, Name, Manual, Manual adjustment, and Restore app default sorting. In the normal/default-profile window, the renderer response replacement and foreground-process identity were verified. A separate screenshot/read-back of that menu in the normal window was not captured, and no full interaction or persistence test was run there.

## What this establishes

- The current installed Windows Codex build could be started through package activation with a loopback-only debugging endpoint.
- The version-pinned adapter matched that renderer and replaced its known script response in memory in the normal/default-profile window.
- The main renderer was selected explicitly, the client returned `renderer-patched`, and the expected app process was foregrounded.
- The same menu design had already been visibly confirmed in the companion test window.

## What it does not establish

- This is not a supported plugin install, a native extension point, or an upstream Codex feature.
- `renderer-patched` confirms response interception; by itself it does not prove that every menu interaction, sort result, preference write, or restart works.
- The normal window's menu was not separately screen-captured after injection.
- Reopening Codex will not automatically apply the patch. Restart persistence, multi-window synchronization, and sorting of unloaded/paginated history remain unverified or unsupported.
- The flow is tied to a specific client build and renderer fingerprint. A changed fingerprint must fail closed until the adapter is reviewed and validated again.

## Reversal and security boundary

The patch exists only in the running renderer response. Exiting/restarting the client removes it. The extension did not modify WindowsApps files or permissions, and this run did not inspect or upload conversation content. The CDP listener is a control interface: bind it only to `127.0.0.1`, do not expose or forward the port, and close the app when the experiment is finished. Reloading the main page can interrupt work in that page, so only do this while it is safe to reload.

## Upstream request

The experiment supports the requested workflow but also shows why a runtime patch is an unsuitable permanent solution. A documented extension point or native per-project sorting support is needed for a reliable feature. The upstream feature request and this report are linked from the repository README.
