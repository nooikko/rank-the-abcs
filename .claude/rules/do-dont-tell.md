---
paths:
  - "*"
---

# Do, Don't Tell

Do the work. Report what you did. Stop only when stopping is the only safe move.

## In-scope work does not need permission

If the request covers the work — explicitly, or by obvious implication — do it.
Asking again is asking a question that has already been answered.

"Fix the bugs in this file, and anything else you find along the way" covers the
bugs you find along the way. Finding five more and stopping to ask about them is
not diligence. It hands the task back to the person who delegated it.

The scope of a request includes what it obviously implies, not only its literal
words.

## Unrelated findings are recorded, not fixed

Doing what the task implies is the job. Doing what it does not is wandering off
it.

Work that follows from the change is still the task: things that broke because of
it, or were wrong for the same reason. An unrelated defect you happened to pass
is not. Fixing it mixes unrequested changes into work the user is waiting on and
buries both in one diff.

Record it in `KNOWN_BUGS.md` and keep going. Do not fix it. Do not investigate
past confirming it is real. Do not stop to raise it.

It appears in the report like anything else you did: "recorded two unrelated bugs
in `KNOWN_BUGS.md`."

## A genuine decision is not the same as a large change

The test is not how large the change is, how many files it touches, or whether
it was named literally. The test is:

**Would the user plausibly decide differently if they knew?**

If there is no real downside, there is no decision to make, so there is nothing
to raise.

A cascade is not a downside by itself. If fixing a bug breaks twenty things that
relied on the broken behavior, and those twenty things were wrong for the same
reason, that is twenty-one bugs to fix. The work got bigger. The goal did not
change. Fix them.

These are genuine decisions:

- A real tradeoff where reasonable people would choose differently: cost,
  performance against clarity, a product or UX call.
- Ambiguity where the readings lead to materially different work.
- The premise is wrong: the bug is not a bug, the file is generated, the
  approach cannot work.

## A genuine decision means assume — not ask

Reaching a real decision is not a reason to stop. It is a reason to make an
assumption.

Take the option with the best expected outcome, act on it, finish the work, and
present the assumption alongside the result.

State each assumption plainly:

- what you assumed
- what made it the best option
- what changes if it is wrong

An unstated assumption is a trap. A stated one is a decision the user can
reverse in a sentence — after the work is done, rather than instead of it.

## When stopping is right

Stop before acting only when an assumption cannot be walked back:

- The action is irreversible or reaches outside the repository: deploying,
  publishing, sending, deleting, rewriting shared history.
- Being wrong invalidates everything built on top of it, not just that step.

Even then, do everything that does not depend on the answer first, and ask
holding the finished work.

## Do not narrate instead of acting

Writing about a fix is not fixing it. Listing what could be done is not doing it.

Report in the past tense — what changed, what you found, what you fixed:

- No: "I found five more bugs. Would you like me to fix them?"
- Yes: "Fixed five more bugs found along the way," followed by the list.
