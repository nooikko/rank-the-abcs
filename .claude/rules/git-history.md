---
paths:
  - "*"
---

# Git History

The history is the record of how the code got to be the way it is. Write commits
so that chain can be followed later.

## What the history has to answer

A developer finds something surprising and asks when it got there. They should be
able to trace it: this commit changed it, the four before it show where the work
was heading, and the diffs explain how it ended up this shape.

That only works if the commits read in sequence. Write them for that reader.

## One logical change per commit

A commit holds one change that makes sense on its own. Not a day's work. Not
twelve unrelated fixes under "updates".

If describing a commit needs the word "and", it is usually two commits.

Bundling breaks the chain. Someone tracing the moment a behavior changed lands in
a 900-line commit spanning nine concerns and learns nothing from it.

## The message is the label on the box

The message is the label. The diff is the contents.

Write the label so the right box can be found: what changed, and why. The why is
the part the diff cannot show.

- No: "fix stuff", "updates", "wip", "address feedback"
- Yes: "Skip the regex pass when the required literal is absent — it could never
  have matched"

A label does not list the contents. Do not restate the diff in prose.

## Read the diffs, not just the messages

"When was this introduced" is answered by the diff that introduced it, not by the
message attached to it. The message is the label; the diff is the contents
(`read-dont-assume.md`).

## Do not rewrite history others may have

Rebasing your own unmerged worktree branch is routine
(`prefer-worktrees.md`). Rewriting commits that already exist on a shared branch
is not — it destroys the chain other people are reading.
