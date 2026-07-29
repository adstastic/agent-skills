# Tend

Systems bloat by default now — AI removed the human-effort friction that used to resist growth. Tending is continuous structural pressure, not a tech-debt sprint. Measure yield, not throughput: what survives and stays coherent, not what got produced. A system that cannot safely forget will be constrained by what it remembers.

## Steps

1. **Hunt mass, not lines.** Count what must be understood to change safely: concepts, invariants, interfaces, dependencies, modes, flags, special cases. For each, ask not "can we delete this?" but "does this concept pay rent?" Compaction questions whether the closet should exist; refactoring only reorganizes it — prefer compaction. Targets: collapsed layers, eliminated special cases, smaller interfaces, patterns flattened to an `if`, fewer abstractions doing more work. Cut accidental complexity only; essential domain difficulty is not bloat, and minimum semantic complexity — not minimum characters — is the goal.
   Complete when every concept in the target has a rent justification or a compaction move against it.

2. **Interrogate before deleting.** Run the scar-tissue interrogation (`BUILD.md` step 2) on anything about to be removed, capturing recovered constraints as evaluations first — deleting a lesson you never lifted re-buys the incident that taught it.
   Complete when everything deleted either has its behavior covered by an evaluation or is recorded as intentionally dropped.

3. **Make deletion boring.** Deletion is a first-class event with measurable ROI: smaller prompts, smaller state space, zero bugs in code that no longer exists. If a deletion feels dangerous, the fear is a technical signal, not a stop sign to obey blindly — either knowledge lives only in the code (run the deletion test; relocate to spec/evals first) or coupling is hidden (a taproot; fix the boundary first). Then delete.

4. **Re-run the grain.** When requirements shift, a service accretes responsibilities, or a team changes, re-test components against the five grain tests (`DESIGN.md` step 2). Regrain accordingly: split at seams, merge fragments whose orchestration dominates their meaning, move behavior under its real owner.

5. **Modernize legacy by extraction, not big-bang.** Define first — contract, invariants, operational envelope, data — from behavior, scar tissue, production evidence, and the humans who remember (`GRILL.md`): you cannot regenerate what you have not defined. Then replace incrementally behind stable boundaries, minimizing the code you keep. Age is not stability; visibility is — fresh code behind a stable contract with strong evals is safer than old code nobody watches.

6. **Track the canaries.** Each of these means mass is compounding; schedule its compaction now, not "later":
   - No one person can hold a component (the n=1 canary).
   - Deletion terror anywhere.
   - Duplicate logic with no canonical home.
   - Tests that verify implementations instead of invariants.
   - "Temporary" code that has survived because it works.

## Scaffolding and cathedrals

Not everything is scaffolding. Cathedrals — money, auth, audit, safety-critical paths, hard-won institutional knowledge — earn careful preservation and formal rigor. Know which you are tending; most software is scaffolding that thinks it's a cathedral.
