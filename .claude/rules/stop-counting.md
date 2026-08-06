---
paths:
  - "*"
---

# Stop Counting

Do not write down how many of something there are.

## Counts of what exists go stale on write

"We run six oracles" becomes wrong the moment a seventh is added, and it does not
announce that it is wrong. It creates an obligation to update a document every
time the thing it describes changes, and that obligation gets missed.

The source is the truth. If the exact number matters, it can be counted by
looking. A written count is a copy that decays.

Write "the oracles", not "the six oracles". "The checks", not "all twelve
checks". The set has a name — use the name.

This applies everywhere it appears: decision records, work tracking, bug reports,
comments, commit messages, and prose in a response.

## Counts that are measurements do belong

A number is content when the number is the fact.

- "The bug produced 5,000 bad rows; after the fix, 3,000." The quantity is the
  finding.
- "Runtime went from 60 minutes to 31." The measurement is the point.
- Error rates, coverage, throughput, compliance — watched because the value
  itself is the thing being watched.

The test: is the number an observation, or an inventory of things that could be
counted right now by looking? Observations are data. Inventories are a stale
mirror of something that already exists.
