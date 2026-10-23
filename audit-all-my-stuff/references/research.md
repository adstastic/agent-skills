# Research

## Window

Start at the date of the last run in the state folder, or 14 days ago if there is no date. Also include older bugs that, in the window, became exploited, got into the CISA KEV catalog, or got their first fix.

## Method

1. If you have a deep-research tool, use it. If you have no web access, tell the person. Then use only the data that they supply, and label all of it "unverified".
2. For each exposed or important item, search for "<product> security advisory <month> <year>".
3. Then do a broad search:
   - Each CISA KEV addition in the window, matched with the inventory
   - Breach and incident notices (status pages, vendor security blogs) for each service and account in the inventory
   - Vendor security pages: Apple, Microsoft, Google Chrome, Android, Mozilla
   - The oss-security mailing list and GitHub Security Advisories
   - OSV for lockfiles (`osv-scanner`, if you have it)
   - Security news, only to find advisories
4. Fetch the primary source for each advisory.

## Supplied lists

For each advisory in a supplied list that matches the inventory, compare it with the primary source. If the newest feed in `feeds/` covers part of the window, use it as a supplied list. Research each part of the window that no list or feed includes. Then research the inventory items that the list does not include.

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
