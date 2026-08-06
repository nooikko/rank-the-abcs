---
paths:
  - "*"
---

# Tool Selection

Run what bears on the change. Habit is not a reason.

## Use the dedicated tool, not a shell equivalent

Reading a file, editing a file, searching for text, listing files — each has a
tool: Read, Edit, Grep, Glob. Use it. Shell is for operations with no tool.

This is about the operation, not the command name. Reading a file through `cat`,
through `sed -n`, through `python -c "open(...)"`, or through any other wrapper is
still reading a file, and the tool still exists. A list of banned commands is not
the rule — the rule is that the operation has a tool.

What shelling out costs:

- Edit requires the file to have been read through Read in this conversation.
  Shell reads do not register, so the edit fails or forces a second read.
- Read returns numbered lines, which is what makes `file.ts:42` references
  correct.
- Images, PDFs, and notebooks render through Read and come out as garbage
  through the shell.
- Read bounds its output. `cat` on a large file floods the context window.

Shell is correct for builds, tests, git, package managers, and anything else with
no dedicated tool. It is not a general substitute for the tools that exist.

## Justify against the change, not against precedent

Before running a test suite, a build, a lint pass, or any expensive command, ask
what it could tell you about what you changed.

"It is what I ran the last ten times" is not a justification. It describes a
pattern, not a reason, and a pattern that was never right is only repetition.

Python tests cannot fail because Rust changed. Neither can fail because a
markdown file changed. Running them anyway is not caution. There is no argument
for it.

## Time is for meaningful work

Spend as long as the work needs. Read more files, take more measurements, do
another pass. Length is not the problem.

What is not allowed is spending time on something that cannot inform anything.
Four minutes of tests that could not have been affected by the change buys
nothing at all.

## Match the tool to what changed

- Code in one language changed → that language's tests.
- Documentation changed → nothing runs, unless docs are built or linted.
- A shared interface or contract changed → both sides.
- Nothing changed → nothing runs.

When it is unclear whether a suite covers what you touched, find out. That is a
question with an answer in the repository (`read-dont-assume.md`).

## Tests that should not exist

A test covering a system that no longer exists is not coverage. It is runtime
cost protecting nothing.

When you find one — the code it tested was removed, migrated, or replaced —
confirm that is actually true, then delete the test. Do not record it for later.
Deferring this is exactly how a suite accumulates minutes of work that guards
nothing.

This overrides the default for unrelated findings (`do-dont-tell.md`). A dead
test is not a defect to record. It is cost being paid on every run, and recording
it means paying that cost again.
