---
paths:
  - "*"
---

# Prefer Worktrees

Work that changes files happens in a git worktree. Take it from creation to merge
to cleanup without being asked.

## Default to a worktree

Use `EnterWorktree` at the start of any task that will modify files. That tool is
gated — it fires only when the user or project instructions call for a worktree.
This rule is that instruction.

Worktrees are created under `.claude/worktrees/` on their own branch, based on
`origin/<default-branch>` unless `worktree.baseRef` is set to `head`.

Subagents that modify files in parallel get `isolation: worktree`, so their edits
cannot collide.

Skip the worktree only when:

- The project is not a git repository.
- The work changes nothing: questions, review, exploration.
- The session is already in a worktree.

## Set it up before starting

A worktree is a fresh checkout. It has no gitignored files and no installed
dependencies.

- Gitignored files the project needs in order to run — `.env`, local config — are
  copied in by `.worktreeinclude` in the project root, using gitignore syntax.
  Create or extend it when a needed file is missing.
- Install dependencies inside the worktree before running anything.

Do this at the start, not after something fails.

## Finish the cycle

Create, set up, work, commit, rebase, verify, merge, remove. One autonomous unit.

Do not stop to ask whether to merge. Do not leave a finished worktree on disk. Do
not hand back a branch for someone else to integrate.

## Merging

1. Commit the work in the worktree.
2. Fetch the target branch.
3. Rebase the worktree branch onto it.
4. Resolve conflicts **in the worktree**. Never resolve them on the target
   branch.
5. Verify: build and tests, in the worktree, after the rebase.
6. Review the diff against the target.
7. Merge. After the rebase this is a fast-forward.
8. Remove the worktree.

The target is the branch the worktree was created from, usually `main`.

Do not push. Merging locally ends the cycle. Publishing is a separate request.

Rebasing first is what keeps parallel agents out of each other's way. Conflict
resolution stays isolated, and the merge itself is a fast-forward with no window
to contend over.

## When other agents are working

Check before merging. `git worktree list` shows the other active worktrees under
`.claude/worktrees/`.

If the target branch moved while you were working, repeat steps 2 through 7 —
fetch, rebase, verify, merge — so you land on top of what they merged. If it
moved again, do it again.

Waiting is not asking. Never stop and ask permission to merge because other
agents are running. Serialize, then continue.

## Cleanup

Remove the worktree once the work is merged: `ExitWorktree` with
`action: "remove"`.

`ExitWorktree` is documented as a tool not to call proactively. This rule is the
standing instruction to call it — removing a merged worktree is the last step of
the cycle, not a separate decision to raise.

A worktree holding uncommitted files will refuse to be removed. That refusal
means work was left behind — find out what it is before discarding it.

The automatic sweep deliberately keeps worktrees containing untracked files. Do
not rely on it to clean up after you.
