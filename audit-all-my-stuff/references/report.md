# Report

## Status

Give each advisory one status. If it applies to more than one item, give one status for each item.

- **affected**: an installed copy or a running process is in the affected range.
- **not affected**: each installed copy and each running process has the fix, or is not in the affected range.
- **not present**: no item has an installed copy or a running process of the product.
- **unknown**: say what blocks the answer, for example "unknown: declined" or "unknown: not checked". Say how the person can find the answer.
- **dropped**: the primary source did not confirm the claim.

## Actions

- **Disconnect**: if no fix is available and the risk is high, isolate the item immediately.
- **Update**: install the fixed version.
- **Rotate**: replace a credential. Give its finding, the place where an attacker can read it, and the cause. Do not recommend rotation without a finding.
- **Mitigate**: an interim step until a fix exists.
- **Monitor**: look for a fix or for signs of attack.

## Format for level 1 or 2

1. **Do these today**: 3 to 5 steps, each with a click path and one reason in everyday words.
2. **Do this week**: the other steps.
3. **Checked and OK**: a short list of what is not affected.
4. **Ask a helper**: the risky steps.
5. **Not checked**: what you cannot examine, the risk that remains, and who can examine it.

## Format for level 3 or 4

1. **Do now**: the top 3 to 6 actions.
2. A table with the columns item, where, advisory, installed and running versions, fixed version, status, action, urgency, source.
3. **Rotate**: each credential, with its finding, place, and cause.
4. **Mitigate**: interim steps.
5. **Clean**: what is not affected.
6. **Unknown**: what you cannot examine, the risk that remains, and how the person can examine it.
