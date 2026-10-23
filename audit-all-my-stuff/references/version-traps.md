# Version traps

Use each trap when you match a version to an advisory.

1. **Running versus installed.** A package manager can keep more than one version. A process keeps its old binary until it restarts. Find the running binary with `ps -A -o pid=,comm=`, then get its version. On Linux, get the path with `readlink /proc/<pid>/exe`. Do not print process arguments or environments.
2. **Embedded browsers.** Electron and CEF apps contain their own Chromium. Read the framework version in the app bundle. An Electron major version past its end of support gets no fixes.
3. **Embedded runtimes.** Apps and tools can contain their own Node, Python, or Java. Look in the app and in the tool folder.
4. **Own trust stores.** Bun, Node, Python certifi, Java, uv, and some Rust tools use their own CA list. An OS fix for a CA problem does not fix them. If a known-bad TLS test host exists, do a test of each client against it with `scripts/tls-probe.sh`. On macOS, git and curl that use the system libcurl can use Keychain trust when a CA bundle rejects a chain. When you do a test of a CA bundle on macOS, set `OPENSSL_X509_TEA_DISABLE=1` to stop this.
5. **Trust differs by OS version.** Two machines can give different results for the same certificate chain. The result can depend on revocation data that the OS downloads. Do the test on each machine.
6. **Package manager lag and "up to date" screens.** Homebrew, apt, an app store, or an update screen can show an older version than the vendor release. Refresh an update screen. Then compare the version that the package manager or the update screen shows with the latest version from the vendor.
7. **Old processes.** Sessions of agents, MCP servers, and dev servers that started before an update keep the earlier version in memory. List them. After the update, stop them.
8. **Supply chain.** Search lockfiles, global installs, and package caches for bad package versions. Record the install dates. Do not run a package that you think is bad, its CLI, or its interpreter to get its version. Read the files in the package folder. For example, `pip show` starts Python, and a malicious `.pth` file runs each time Python starts.
9. **End of support.** Treat a product past its end-of-support date as affected by each new bug in its product family. Use the date when security fixes stop, not the end of sale. Vendors also call this date end of life.
10. **Firmware.** Read the firmware version of each router, NAS device, camera, and TV on the device or in its app.
11. **Vendor backports.** A Linux distribution or an appliance can fix a bug without a new upstream version. Use the security tracker of the vendor.
12. **CI runners.** Hosted CI images and runner tools have their own versions and trust stores. Read the image notes. Changes in a job do not give protection to what the runner does before the first step of the job.
