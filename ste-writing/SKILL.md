---
name: ste-writing
description: Write in ASD-STE100 Simplified Technical English. Use when writing or rewriting any prose — documentation, READMEs, commit bodies, release notes, emails, reports, UI text, error messages, instructions, summaries — and whenever the user mentions STE, ASD-STE100, Simplified Technical English, plain language, controlled language, or asks to simplify text, make it clearer, cut ambiguity, or make writing easy for non-native readers or for translation. Includes a linter that checks the mechanically verifiable rules.
---

# STE Writing

## Overview

Apply the rules of ASD-STE100 Simplified Technical English (Issue 9, 2025) to all writing, not only technical documentation. The goal: readers understand each sentence the first time they read it.

Core principle: **one word has one meaning, one sentence has one idea, and the doer of the action is the subject of the sentence.**

## When not to use

- Quoted text, product names, UI labels, titles, placards: keep them verbatim. Never "correct" a quotation.
- Legal text that must keep exact wording.
- Poetry, fiction, or marketing copy where the user asked for a specific voice.
- If STE conflicts with a tone the user requested, tell the user and let them decide.

## Step 1: Classify the text

STE has two modes. Classify each passage before you write it.

| Mode | What it is | Sentence limit | Verb form |
|---|---|---|---|
| **Procedural** | Tells the reader to do something: instructions, how-tos, action items, asks in emails | 20 words | Imperative ("Remove the cover.") |
| **Descriptive** | Gives information: explanations, reports, summaries, README prose | 25 words | Simple present/past/future |

In general writing: requests and action items are procedural. Everything else is descriptive. Do not mix modes in one list or paragraph.

## Step 2: Word rules

- **One word, one meaning, one part of speech.** Pick one term for each thing and use it everywhere. Never rotate synonyms for variety ("the actuator" stays "the actuator" — not "the unit", then "the control device").
- **Use the simple approved word.** See the substitution table below. The full curated list is in `references/word-substitutions.md`. For a word that is in neither table, use the meaning the dictionary gives at [asd-ste100.org](https://www.asd-ste100.org). Do not guess.
- **Domain terms are allowed.** Names of real things (technical nouns: "Redis", "landing gear", "pull request") are fine, and domain actions (technical verbs: "merge", "rebase", "solder") are allowed when no approved word says it. Keep them well-known and consistent. No slang or jargon only insiders know.
- **Never substitute inside a technical noun** (a fixed domain name): "main branch", "backup file", "base image" stay as they are (rule 1.6).
- **Do not use a noun as a verb or a verb as a noun.** "Oil the surface" → "Apply oil to the surface." "Give the hole a ream" → "Ream the hole."
- **No phrasal verbs.** "put out" → "extinguish", "give off" → "release", "turn off" → "stop" / "set to OFF", "carry out" → "do".
- **No Latin abbreviations** (GR-6 recommendation). "e.g." → "for example", "i.e." → "that is", "etc." → delete it or name the rest.
- **Gender-neutral.** No "he" or "she". Use "you" for the reader, "we" for the writing organization, or repeat the noun.
- **American English spelling** unless the project style says differently.

## Step 3: Verb rules

Use only these verb forms:

- Infinitive, imperative, simple present, simple past, simple future
- Past participle **only as an adjective** ("the removed parts", "the report is completed")

Banned constructions:

- Perfect tenses: ~~"has completed"~~ → "completed"
- Progressive tenses and "-ing" verb forms: ~~"is running"~~ → "runs"; ~~"before starting"~~ → "before you start". "-ing" is allowed only as a technical noun or heading ("Troubleshooting", "operating system") — never as a gerund phrase: ~~"Running the tests takes five minutes"~~ → "The tests take five minutes."
- Complex passives: ~~"is to be installed"~~, ~~"can be adjusted"~~ → "install", "you can adjust"
- "could" for possibility → "can"; "should"/"shall" → "must"; "may" → "can"; "have to" → rewrite as a command
- In instructions, do not put "must" before the command ("Disconnect the hose", not "You must disconnect the hose"). Reserve "must" for descriptive obligation and safety conditions (rule 5.3).

**Active voice always.** Passive is permitted only in descriptive text when the agent is unknown ("During transmission, the data was corrupted."). To fix a passive: make the agent the subject, use the imperative, or use "you"/"we".

**Express actions with verbs, not nouns.** "gives an indication of" → "shows"; "before the removal of" → "before you remove".

## Step 4: Sentence and paragraph rules

- **Length:** ≤20 words per procedural sentence, ≤25 per descriptive sentence (notes: 25). Split long sentences; do not truncate meaning.
- **No noun cluster longer than three words.** Unpack with prepositions or verbs: ~~"the housing attachment bolts"~~ → "the bolts that attach the housing". If an official name is longer, write it in full the first time, then define and use a shorter form or abbreviation. Or hyphenate directly related words into units (each hyphenated group counts as one word; never more than three groups). Never shorten or re-hyphenate an approved official name.
- **One instruction per sentence**, unless actions happen at the same time ("Hold the panel and install the fastener.").
- **Condition first, comma, then command:** "If the test fails, stop the run." Never "Stop the run if the test fails."
- **Do not omit words.** No contractions ("do not", not "don't"). Keep articles, subjects, and verbs: ~~"If installed, remove the shims"~~ → "If shims are installed, remove them." But no article in general statements ("Solvents cause damage to paint") or before a noun with an identifier ("Tag circuit breaker 36L7").
- **Use "that"** after verbs like make sure, show, recommend (GR-1): "Make sure that the valve is open."
- **Vertical lists** for long series and complex sentences (short series stay inline). Colon at the end of the lead-in. Items start with an uppercase letter, take no comma or semicolon at line ends, and must each read correctly from the lead-in. Period after full-sentence items and after the last item. Do not mix instructions and descriptions in one list. In safety lists, repeat "DO NOT" for each item.
- **Connect related sentences** with: and, but, then, thus, as a result, at the same time.
- **Paragraphs:** one topic each, topic sentence first, maximum six sentences. Give information gradually — one new idea per sentence, and repeat key words to link sentences (do not swap in synonyms).
- **Be concrete.** ~~"No leaks are permitted"~~ → "Make sure that there are no leaks." ~~"Different temperatures change the cure time"~~ → "When the temperature increases, the cure time decreases."

## Step 5: Punctuation

- **No semicolons.** Write two sentences.
- **Hyphens** join words that act as one unit: "high-pressure chamber", "up-to-date information".
- **Word counting:** hyphenated groups, numbers, numbers with units, abbreviations, identifiers ("36L7"), quoted text, titles and headings, and proper nouns each count as one word. A parenthetical counts as one word of its sentence, but its content is a separate sentence with its own limit. In a vertical list, the lead-in (before the colon) and each item count as separate sentences.
- **Parentheses** for references, identifiers, abbreviations, short explanations, and alternatives.

## Warnings and callouts

For anything the reader must not get wrong (data loss, security, breaking changes), use the safety-instruction pattern:

1. A label that shows the level of risk (WARNING = harm to people, CAUTION = damage or loss; if both risks, WARNING; in general docs "Important" can play the caution role — never "Note")
2. A clear command or condition first
3. The risk or consequence

> **CAUTION:** Do not operate this script on the production database. It deletes rows permanently.

Notes give information only — never instructions, requirements, or limits. If a note contains an instruction, it is a step; if it prevents damage, it is a caution.

## Quick substitution table (most frequent errors)

| Avoid | Use | Avoid | Use |
|---|---|---|---|
| acceptable | permitted | main | primary |
| avoid | prevent, do not | may | can |
| both | the two | need (v) | necessary |
| carry out, perform | do | now | at this time |
| commence, initiate | start | over/above (limit) | more than |
| ensure | make sure | people | persons, personnel |
| fit (v) | install | perform | do |
| follow (obey) | obey | prior to | before |
| further, additional | more | repeat | do … again |
| greatly, highly, extremely | very, very much | required | necessary |
| should, shall | must | significant | important |
| have to | rewrite as a command | rotate | turn |
| however, therefore | but, thus | since (cause) | because |
| insert | put | test (v) | do a test of |
| leverage, utilize, employ | use | under/below (limit) | less than |
| ensure, verify, check (v) | make sure, examine | via | through |
| cover (v, a topic) | include, have | over (position) | above, on, along |
| run (v) | operate | enter | go into, record |

Full list: `references/word-substitutions.md`. Approved verb list and forms: `references/approved-verbs.md`.

## Check your work with the linter

This skill bundles a linter for the rules that a regex can prove. Run it on
each prose file you write or change:

```bash
./ste-writing/scripts/ste-lint.py FILE...
```

It needs Python 3 and nothing else. It exits 1 if it finds something, and 0 if
the file is clean. Each finding gives `path:line  [category] message`.

The linter reads its word list from `references/` at run time, so an edit to
those tables changes what it finds.

Treat the output as advice, not as a verdict. The linter reads dictionary
entries, but it cannot read context. A finding inside a quotation, a name, a
technical noun, or a deliberate non-STE example is a false positive. Keep the
text as it is.

For the same checks as automatic hooks in Claude Code, Codex, or Pi, install
the plugin at [github.com/adstastic/ste-writing](https://github.com/adstastic/ste-writing).

## Workflow

1. Classify each passage: procedural or descriptive.
2. Rewrite each sentence: agent as subject, action as a verb, imperative for instructions, condition first.
3. Replace unapproved words. If a replacement changes the meaning, do not force it — write a different sentence construction that keeps the meaning (rule 9.1).
4. Split sentences over the limit. Convert series and multi-step sentences to vertical lists.
5. Run the linter, then run the checklist for the rules it cannot check.

## Checklist

- [ ] Every procedural sentence ≤20 words; descriptive ≤25
- [ ] Active voice (passive only when the agent is unknown, in description)
- [ ] Only simple tenses; no "-ing" verb forms; past participle only as adjective
- [ ] One term per thing, used consistently; no synonym rotation
- [ ] No semicolons, contractions, phrasal verbs, or Latin abbreviations
- [ ] Conditions before commands; "that" after make sure/show/recommend
- [ ] Paragraphs: one topic, topic sentence first, ≤6 sentences
- [ ] Every "it/they/this" has exactly one possible referent — if not, repeat the noun (GR-3, GR-4)
- [ ] No noun cluster longer than three words
- [ ] Quoted text, names, and labels unchanged

## Common mistakes

- **Truncating to hit word counts.** Split and rewrite; never drop information.
- **Word-for-word substitution that changes meaning.** "Lift the seat so that it clears the track locks" → "Lift the seat until it is away from the track locks" (not "cleans the track locks").
- **Imperatives in descriptive text.** Descriptions state facts; only procedures command.
- **Fear of repetition.** STE requires repetition: same wording for the same meaning, everywhere.
- **Rewriting quoted text or error messages.** They count as one word and stay verbatim.
- **Abstract statements.** Give the action, the value, or the condition — not a generality.
- **Translating empty intensifiers.** If the verb already carries the meaning, delete the intensifier: "We recommend the upgrade", not "We recommend it very much".

## Example

Before (41 words, passive, banned words):
> Prior to commencing the deployment, it is essential that all outstanding configuration changes which were made by the operator have been thoroughly verified; failure to do so could potentially result in the service becoming inoperable.

After (procedural, 10 + 12 words):
> Before you start the deployment, examine all the configuration changes. If you do not do this check, the service can become unserviceable.
