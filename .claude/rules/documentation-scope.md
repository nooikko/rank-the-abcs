---
paths:
  - "*"
---

# Documentation Scope

Each document has a defined purpose. Content that does not serve that purpose is
not written there — or anywhere.

## README

A README answers five questions, and nothing else:

1. What the project does
2. Why the project is useful
3. How to get started
4. Where to get help
5. Who maintains and contributes

That list is GitHub's, and it is the scope of the file. Standard repository
furniture — license, badges, citation, acknowledgments, a table of contents — is
part of a README and stays.

A README is not a log. The following do not belong in it, under any name:

- `Changelog`, `Recent Changes`, `What's New`, `Release Notes`
- `Decisions`, `Rationale`, `Implementation Notes`, `Architecture Notes`
- `Current Status`, `Progress`, `TODO`, `Roadmap`, `Known Issues`
- `Migration Notes`, `Upgrade History`

Renaming a banned section does not make it allowed. The test is what the content
**is**, not what the heading says.

## CHANGELOG.md

A changelog records what shipped: changes that reach production, written for
someone consuming the software, at the point work merges to main.

It is not a work log. Individual commits, refactors, internal cleanups, and
in-progress work do not appear in it.

If a project has no `CHANGELOG.md`, that is not a gap. Do not create one.

## KNOWN_BUGS.md

Bugs that are real, unfixed, and outside the scope of current work. Create the
file when there is a bug to record and it does not exist yet.

This file is a worklist, not a log. Entries leave it. A bug stays until it is
fixed; when it is fixed, **delete the entry**. Do not mark it resolved, do not
date it, do not move it to a "Fixed" section. The commit history already records
that the bug existed and that it was fixed. A second record of that is
maintenance with no reader.

Record a bug only when all three hold:

- It is a defect, not an idea. Improvements, refactors, and "would be nice"
  are not bugs.
- It is genuinely outside the scope of the current request. If fixing it is in
  scope, fix it — this file is not a place to defer work that should be done.
- It would otherwise be lost.

An entry is a symptom and a location. Nothing else:

```
- `src/auth/session.ts` — session cookie is not cleared on logout when a
  refresh token is active.
```

No analysis, no proposed fix, no priority, no owner, no date. Investigation
happens when a bug is picked up, not when it is written down. Anything beyond
symptom and location is what turns a worklist into a document nobody reads.

Filing in an external issue tracker is a different action with different
consequences. Ask first.

## Decision records

Default: do not write one.

A decision record exists for one reason — the decision is **binding on future
work**, and someone who does not know it will do meaningful damage. It is a
constraint, not a report.

Write one only when all three hold:

- It rules something out, or commits to an approach others must follow.
- A viable alternative was rejected, for a reason not obvious from the code.
- Not knowing it later causes real harm: rework, a reintroduced bug, a broken
  assumption.

Never write a decision record to report an outcome. "We chose X and it made Y
faster" is a result, not a decision.

One decision, one file. Records live in `docs/decisions/`, one file per
decision, named for the decision it makes. Never append a decision to a shared
document. A single growing decisions file is how this goes wrong, and it does
not stop growing once it starts.

## Documents that already break these rules

Do not delete someone's content because a rule says it does not belong. That is
destruction, and it is not the task you were given.

Do not add to the offending section, do not extend it, and do not route new
content into it. Say once, in the report, that it is there. Clean it up when
asked.

## Content that fits nowhere

An unfixed, out-of-scope bug goes in `KNOWN_BUGS.md`. Everything else: say it in
the conversation. Do not file it.

If it seems worth keeping and there is no home for it, say so in the report. Do
not invent a document.
