# Report

## Status

Give each advisory one status. If it applies to more than one item, give one status for each item.

- **affected**: an installed copy or a running process is in the affected range.
- **not affected**: each installed copy and each running process has the fix, or is not in the range.
- **not present**: no item has an installed copy or a running process of the product.
- **unknown**: say what blocks the answer and how the person can find it.
- **dropped**: the primary source did not confirm the claim.

## Actions

- **Disconnect**: isolate the item immediately. Use this when no fix is available and the risk is high.
- **Update**: install the fixed version.
- **Rotate**: replace a credential. For each credential, give the finding, the place where an attacker can read it, and the cause. Do not recommend rotation without a finding.
- **Mitigate**: an interim step until a fix exists.
- **Monitor**: look for a fix or for signs of attack.

## Format for level 1 or 2

1. **Do these today**: 3 to 5 steps, each with a click path and one reason in everyday words.
2. **Do this week**: the other steps.
3. **Checked and OK**: a short list of what you checked that is not affected.
4. **Ask a helper**: risky steps, for example router firmware.
5. **Not checked**: what you cannot examine, the risk that remains, and who can examine it.

## Format for level 3 or 4

1. **Do now**: the top 3 to 6 actions.
2. A table: item, where, advisory, installed and running versions, fixed version, status, action, urgency, source.
3. **Rotate**: the credential, the host, and the finding.
4. **Mitigate**: interim steps.
5. **Clean**: what you checked that is not affected.
6. **Unknown**: what you cannot examine, and how the person can examine it.

## After changes

Do the same check again. Record the new result in the state folder.
