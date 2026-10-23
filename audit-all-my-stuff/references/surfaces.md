# Surfaces

For each item, record the owner, model, version, who maintains it, exposure (internet, home network, VPN, or none), automatic updates, and end-of-support date.

| Group | Examples | Where to look (level 1 or 2) | Where to look (level 3 or 4) |
|---|---|---|---|
| Computers | Mac, Windows, Linux, Chromebook | Mac: Apple menu, About This Mac. Windows: Settings, System, About. | `scripts/inventory-macos.sh`, `scripts/inventory-linux.sh`. Windows: `winget list`, `Get-ComputerInfo`. |
| Remote access on computers | Screen Sharing, Remote Desktop, SSH, TeamViewer, AnyDesk | Mac: System Settings, General, Sharing. Windows: Settings, System, Remote Desktop. | Listening ports (`lsof -nP -iTCP -sTCP:LISTEN`, `ss -tlnp`). Sharing services. |
| Phones, tablets, watches | iPhone, iPad, Android, Apple Watch | iPhone and iPad: Settings, General, Software Update. Android: Settings, About phone. | The same. Paired devices: `xcrun devicectl list devices`, `adb devices`. |
| Browsers and apps | Chrome, Firefox, Safari, extensions, Electron apps, office suites, chat apps | Browser menu, About. | `scripts/inventory-macos.sh` (app versions and the Electron version in each app). |
| Router, modem, Wi-Fi, firewall | ISP router, mesh Wi-Fi, firewall appliance | The sticker on the box, or the app from the internet company. | Admin interface: firmware version, remote admin, UPnP, port forwards, IPv6 firewall, DNS. With approval, a scan of the public IP from a different network. |
| NAS and home servers | Synology, QNAP, Unraid, Raspberry Pi, old PC, VMs, containers | Its app. | OS and app versions, `docker ps`, remote-access features (QuickConnect, myQNAPcloud, tunnels, port forwards). |
| Self-hosted services | Plex, Jellyfin, Nextcloud, Home Assistant, Pi-hole, Vaultwarden, n8n, nginx, Caddy, Traefik, VPN servers | Ask if someone installed "a media server" or "home automation". | Exposure and authentication of each service. Reverse-proxy and tunnel configuration. |
| Smart home and IoT | Cameras, doorbells, locks, speakers, TVs, streaming boxes, consoles, printers, 3D printers, hubs | The app for each device, or the settings menu on the TV. | Firmware version, cloud account, default password. |
| Websites and domains | Registrar, DNS, hosting, CDN, CMS, plugins | Ask if they have a website or a domain, and who made it. | Registrar lock and 2FA, DNS records, hosting (VPS, Cloudflare, Vercel, Netlify), CMS and plugins, runtime (PHP, Node, Next.js), admin URLs. |
| Code and CI | Repositories, CI workflows, package tokens, deploy keys | Usually none. | Lockfiles (`osv-scanner scan -r <dir>`), CI secrets and where each secret is available, collaborators and apps with write access, package tokens. |
| Accounts and identity | Email, password manager, Apple, Google, Microsoft, bank, social, cloud | Type of 2FA on the important accounts. | Important accounts, reused passwords, type of 2FA, API keys, tokens, OAuth apps, and recovery options. |
| AI tools and agents | Coding agents, chat apps, MCP servers, plugins, skills, agent consoles | Which AI apps they use. | MCP server list, plugins, where API keys are stored, consoles that keep keys. |
| Devices of other persons | Family, roommates, a work laptop | Ask who else uses the home network. | The same. Rule 6 applies. |
| Forgotten things | Old computers that are on, old phones, test servers, cloud instances, old domains, VPN nodes not seen for months | Ask the person. | VPN node lists (`tailscale status`), cloud consoles with approval, DNS records that point to old hosts. |
