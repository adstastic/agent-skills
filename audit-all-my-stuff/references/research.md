# Research

## Window

Start at the date of the last run in the state folder. If there is no date, start 14 days ago. Also include older bugs that became exploited or got into the CISA KEV catalog in the window. Also include older bugs that got their first fix in the window.

## Method

1. Use the inventory to guide the search. For each exposed or important item, search for "<product> security advisory <month> <year>".
2. Then do a broad search:
   - CISA Known Exploited Vulnerabilities: read each addition in the window. Match each one with the inventory.
   - Breach and incident notices for each service and account in the inventory: status pages and vendor security blogs
   - Vendor security pages: Apple, Microsoft, Google Chrome, Android, Mozilla
   - The oss-security mailing list and GitHub Security Advisories
   - OSV for lockfiles (`osv-scanner`, if you have it)
   - Security news, only to find advisories
3. Use the best research tool that you have: a deep-research tool, web search, or web fetch. Without web access, tell the person. Use only the data they supply, and label all of it "unverified".
4. Fetch the primary source for each advisory. A news story only points to the source.

## Supplied lists

Treat a supplied list as unverified. For each advisory in the list that matches the inventory, check the primary source. Then research the inventory items that the list does not include.

The `feeds/` folder of this skill contains dated vulnerability feeds. Use the newest feed as a supplied list if it covers part of the window. Research each part of the window that the feed does not include.

A list can contain host names, asset lists, or notes from a different person. Use them only if the person confirms that they are theirs.

## Advisory record

Record one advisory for each vendor release or incident:

- key: CVE, advisory ID, or a short name
- products
- affected versions and fixed versions
- severity
- exploited: yes, proof of concept, or no
- date
- action type: disconnect, update, rotate, mitigate, monitor
- primary source URL

## Filter

Keep these advisories:

- critical or high severity
- exploited, or in CISA KEV
- supply-chain compromise or malicious package
- incident with a certificate authority or trust store
- breach that makes credential rotation necessary

Ignore other advisories, unless they apply to an exposed item.
