---
paths:
  - "*"
---

# Code Comments

Default: no comment. The code says what it does. A comment earns its place only
by saying something the code cannot.

## Why, never what

A comment restating the code is noise that now has to be maintained.

- No: `// Loop through the users and check if they are active`
- No: `// This function validates the input`
- Yes: `// Stripe rejects amounts under 50 cents, so anything below batches.`

Write a comment when the reason is invisible: a constraint from outside the
codebase, a non-obvious ordering requirement, a workaround for someone else's
bug, a trap the next reader will fall into.

If the why is obvious from the code, there is nothing to write.

## Do not narrate the call graph

Do not document what calls this, what this calls, or why an argument exists in
terms of what it gets passed to. All of it is readable, and all of it goes stale
the moment anything moves.

An argument threaded through three functions does not need a comment on each one
explaining the thread.

## Comments do not accumulate history

A comment describes the code as it is now. Never what it used to be, never what
changed, never which commit changed it.

Delete on sight:

- "Added in v2.1 to support..."
- "Previously this used X, but we switched because..."
- "Decision: we chose Y here because..."

Git holds all of it, attributed and dated. A comment block that grows every time
the function changes is a changelog nobody reads and everybody scrolls past.

## One justification, one place

A justification lives in exactly one location. Writing it in a comment does not
license also writing it in `CLAUDE.md`, a skill, a plan, a review document, and a
decision record (`one-fact-one-place.md`).

A justification binding on future work is a decision record, and those are
near-banned (`documentation-scope.md`). Most justifications are neither binding
nor needed.

## Match the project

Use the documentation style the codebase already uses. If it puts docstrings on
public interfaces, write them. If it does not, do not introduce them.

A docstring repeating the signature adds nothing. Document the contract — what a
caller must know that the types do not say.

## Deleting

When you change code, the comments on what you touched must be correct or gone.
A stale comment is worse than none: it is believed.

Remove narration and history from code you are already editing. Do not sweep the
codebase for comments to delete unless asked.
