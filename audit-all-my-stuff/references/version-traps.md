# Version traps

Check each trap when you match a version to an advisory.

1. **Running versus installed.** A package manager can keep more than one version. A process keeps its old binary until it restarts. Find the running binary with `ps -A -o pid=,comm=`, then get its version. On Linux, get the path with `readlink /proc/<pid>/exe`. Do not print process arguments or environments, because they can contain secrets.
2. **Embedded browsers.** Electron and CEF apps contain their own Chromium. Read the framework version in the app bundle. Old Electron major versions get no fixes.
3. **Embedded runtimes.** Apps and tools can contain their own Node, Python, or Java. Look in the app and in the tool folder.
4. **Own trust stores.** Bun, Node, Python certifi, Java, uv, and some Rust tools use their own CA list. An OS fix for a CA problem does not fix them. If a known-bad TLS test host exists, test each client against it with `scripts/tls-probe.sh`. On macOS, git and curl that use the system libcurl can use Keychain trust when a CA bundle rejects a chain. Set `OPENSSL_X509_TEA_DISABLE=1` to stop this.
5. **Trust differs by OS version.** Two machines can give different results for the same certificate chain. The result can depend on revocation data that the OS downloads. Test each machine.
6. **Package manager lag.** The upstream project can release a fix before Homebrew, apt, or an app store has it. Compare the upstream fix with the version that the package manager offers.
7. **"Up to date" screens.** An update screen can show an old result. Refresh it. Then compare with the latest version from the vendor.
8. **Old processes.** Old sessions of agents, MCP servers, and dev servers keep old versions in memory. List them. Stop them after the update.
9. **Supply chain.** Search lockfiles, global installs, and package caches for bad package versions. Record the install dates. Do not run a suspect package, its CLI, or its interpreter to get its version. For example, a malicious `.pth` file runs each time Python starts, and `pip show` starts Python. Read the files in the package folder instead.
10. **End of support.** After its end-of-support date, a product gets no fixes. Treat it as affected by each new bug in its product family. Vendors also call this date end of life. Use the date when security fixes stop, not the end of sale.
11. **Firmware.** Routers, NAS devices, cameras, and TVs update separately from apps. Read the firmware version on the device or in its app.
12. **Vendor backports.** A Linux distribution or an appliance can fix a bug without a new upstream version. Use the security tracker of the vendor.
13. **CI runners.** Hosted CI images and runner tools have their own versions and trust stores. Read the image notes. Changes in a job do not give protection to what the runner does before step 1.
