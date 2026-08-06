---
paths:
  - "*"
---

# One Fact, One Place

A fact is written down once. Everything else points at it, or does without.

## A second copy is not redundancy

The same fact in two places is not safer. It is two things that can disagree, and
eventually they will: one gets updated, the other does not, and the reader is
left working out which one is current.

The second copy is not a backup. It is a future contradiction.

## Check before writing anything down

Does this already exist somewhere?

- If it does, do not repeat it. Point at it, or say nothing.
- If it belongs somewhere else, move it. Never copy it.
- If the existing copy is wrong, fix that copy. Do not write a correct version
  next to a wrong one.

## Derivable facts are not written down

If it can be read from the source, read it from the source. A written copy of
what the code, the file, or the history already says is a snapshot that starts
decaying the moment it is saved.

Counts, file lists, current state, and structure are all derivable
(`stop-counting.md`).

## Where this shows up

- One justification, in one location — not a comment and a plan and a decision
  record (`code-comments.md`).
- One decision, one file (`documentation-scope.md`).
- One memory per fact, edited when the fact changes — never a second memory
  saying the first is out of date (`memory.md`).
- One bug, one entry, deleted when it is fixed (`documentation-scope.md`).

The failure is the same every time. Things written twice drift apart, and things
never removed accumulate.
