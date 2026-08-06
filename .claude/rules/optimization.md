---
paths:
  - "*"
---

# Optimization

Faster means faster. Optimization makes the same work execute faster. Making the
system do less work is a different conversation.

## Output is the invariant

An optimization produces identical output. That is what separates it from
reducing scope.

Skipping work that could not have affected the result is optimization. A regex
that requires an `S` cannot match a string with no `S`, so a cheap string check
that skips it removes an expensive operation that was guaranteed to fail. Fewer
operations run, every input classifies the same. That is faster.

Deciding some records are not processed, or some cases not handled, changes the
result. That may be worth doing, but it is the user's call and it is never an
answer to "make this faster." Propose it separately, as what it is. Never
deliver it as an optimization.

## Take the free wins from the start

Where the faster option costs nothing, use it. In JavaScript, `Map` lookups beat
index lookups on a plain object — so use a `Map`. No threshold, no scale test, no
permission needed.

This is not premature optimization. It is declining to choose the slower
construct for no reason.

A small expected scale is not permission to relax. "Only about a million records"
does not license a plain object where a `Map` belongs, or the loose construct
over the efficient one. Those choices change nothing functionally, and they
decide how much has to change when the scale moves.

Discipline here shrinks the blast radius later. Code that stayed efficient in the
small needs a contained change when it grows. Code that got sloppy needs
rewriting.

The most common way to write something is not the fastest way to write it. Common
code is written at scales where the difference does not matter, by people not
trying to win back minutes. Reaching for the familiar shape — the plain for loop,
the plain object — is how code ends up slow by default. At 60 million records,
that default is the whole problem.

## Costly wins need a reason

Speed bought with complexity or correctness risk is a balance, not a free win.
Collapsing 158 regexes into fewer, longer ones runs less and breeds bugs.

These are worth it when the measurements say so and the scale justifies the cost.
State the reason. Do not apply them by reflex any more than you avoid them by
reflex.

## No placeholders

Never write an implementation you intend to replace later. "Simple now, optimize
later" is tech debt written on purpose, and later does not come.

Architecture is not construct choice. Sizing — synchronous or queued, one worker
or a pool — is judged against the workload you were told to expect, and expected
workloads move. A project that grew from one million records to sixty million has
earned a second look at its architecture. Revisiting it then is correct, not a
failure.

What is banned is building something you already know is wrong for the stated
workload and planning to fix it afterward. Size it for what you were told.
Revisit when what you were told changes.

## Measure

A claim that the system got faster is a claim about a specific workload. It needs
numbers.

Known-faster constructs do not. `Map` beating a plain object is a fact about the
language, not a hypothesis about this codebase — take those without ceremony.

The loop runs in a worktree, autonomously, without disturbing other agents
(`prefer-worktrees.md`):

1. Instrument. Wall time for the run, and timing for individual calls. A total
   alone does not say where the time went.
2. Record the baseline timings, and the baseline output.
3. Make the change.
4. Re-run with the same instrumentation, the same inputs, the same conditions.
5. Compare output to the baseline. It must be identical. Output that changed
   means this was not an optimization.
6. Record before and after.

Instrumentation added in order to take a measurement is removed before merging.
Adding timing that stays is a different task — "track how long this takes" is not
"make this faster" — and it gets asked for separately.

Let the measurements choose the costly work. Free wins need no profiling; they
cost nothing either way.

Never report an optimization without numbers. Never report numbers from a run
whose output changed.
