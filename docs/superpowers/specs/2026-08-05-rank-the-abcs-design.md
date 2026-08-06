# Rank the ABCs — Design

## Premise

Q is in a weird place in the alphabet. This site crowdsources a better one.

Visitors are shown two letters and asked which should come first. Votes
accumulate into a pairwise preference table, which is fitted into a single
ordering: a new, community-sourced alphabet.

## The datum

**Every vote is a relative claim between exactly two letters.** Never
positional.

"Should Q come before E" does not mean "should Q move to the slot E currently
occupies." It means *wherever Q ends up, E is somewhere after it* — at any
distance. The current alphabet is not a baseline being edited; it is only what
we happen to have now. Positions are an output of the model, never an input to
a question.

There are C(26,2) = 325 unordered letter pairs.

## Phrasings as instrumentation

The same comparison is asked in several ways, and **which way is recorded**.
This is not variety for its own sake — logically identical prompts produce
measurably different answers, and recording the phrasing is what lets those
distortions be estimated and removed.

Three templates, each rendered with either letter in the first slot, giving six
question cells per pair (1,950 total):

| Template        | Prompt                                | Maps to                            |
| --------------- | ------------------------------------- | ---------------------------------- |
| `WHICH_FIRST`   | "Which comes first, {a} or {b}?"      | chosen letter wins                 |
| `SHOULD_BEFORE` | "Should {a} come before {b}?"         | yes → `a` wins; no → `b` wins      |
| `SHOULD_AFTER`  | "Should {a} come after {b}?"          | yes → `b` wins; no → `a` wins      |

Three distortions become measurable:

- **Position bias** — the first-named letter is picked more often than content
  alone would explain.
- **Acquiescence bias** — yes/no prompts skew toward "yes".
- **Negation drag** — `SHOULD_AFTER` requires mentally inverting the
  relationship, so its answers are noisier than `SHOULD_BEFORE`.

Note that `SHOULD_BEFORE(a,b)` and `SHOULD_AFTER(b,a)` are logically identical.
Serving both to the same person, spaced apart, is deliberate: disagreement
between them measures whether the framing is driving the answer.

## Identity

Anonymous session, cookie-held, no accounts and no login. A stable per-person
id is required — consistency across framings is unmeasurable without one — but
a login wall in front of a joke about the letter Q would kill it.

Deduplication is one vote per `(session, pair, template, first-shown letter)`.
A person may therefore see the same pair up to six times, in different frames,
spaced apart.

Rate limiting by IP is the only other integrity measure. It will not stop a
determined attacker. It will stop everyone else, which is the correct amount of
effort for this.

### The cookie

```
rtabc_sid=<opaque random id>
Max-Age=15552000        // six months
Path=/; HttpOnly; Secure; SameSite=Lax
```

Set on **first vote**, never on page load, so someone who only reads the
rankings is never tagged.

### No consent banner

ePrivacy Article 5(3) is technology-neutral: it governs storing or accessing
information on a user's device, which covers cookies, `localStorage`, and
device fingerprinting alike. Fingerprinting is therefore not a way around the
rules, and is **explicitly ruled out** — it carries the same obligations while
being invisible and unclearable by the user.

The cookie above relies on the strictly-necessary exemption: it is required to
deliver the service the visitor explicitly requested. A poll in which one
person can vote on the same question without limit is not that service. This
needs a privacy notice, which is a page, not a pop-up.

The exemption argument rests on the site's posture as much as the mechanism,
and all of the following are load-bearing rather than incidental:

- First party only. No third-party scripts, no ad tech, no data sold or shared.
- The id is opaque and random, linked to nothing identifying.
- It does exactly one job. It is never used to profile, target, or personalise.
- Vercel Analytics is cookieless by design and does not change this analysis.

The part that stretches the exemption furthest is measuring one person's
consistency across framings, which shades from delivering the service toward
research on users. The defence is that it calibrates the instrument rather than
profiling the person — correcting for question-order bias is necessary to
produce the alphabet, and the alphabet is the service. The measurement never
identifies anyone and never leaves the system.

### Forget me

A visible control that deletes the session and **nulls the `sessionId` on that
session's votes**, rather than deleting the votes.

The votes were legitimately cast and belong to the crowd result; severing the
link is genuine anonymisation and leaves the alphabet intact, while the
per-person consistency data for that individual is destroyed. This is what the
strictly-necessary argument leans on hardest, so it must actually work.

## Question selection

**Coverage-driven. The ranking model is not consulted.**

The selector cannot see letter scores, uncertainty, or the current ordering, so
it structurally cannot steer toward dramatic results. This is a hard
requirement, not a preference: a selector that hunts for questions likely to
upend the alphabet is a churn machine, and the alphabet would never settle.

Two-stage weighted draw:

1. Pick a pair with probability proportional to `1 / (votes_on_pair + 1)`.
   Thinly-voted pairs come up far more often; well-voted pairs still come up
   sometimes.
2. Within that pair, pick the phrasing cell with the fewest votes, choosing
   randomly among ties.

Pair coverage drives the draw because pair coverage is what the ranking engine
needs; phrasing balance then follows without competing for the same scarce
votes.

Cells the session has already answered are excluded from the draw.

Randomisation is load-bearing in two places. It stops concurrent visitors from
all being handed the same lowest-count question and over-filling one cell while
its neighbours sit empty. It also prevents the marching sequence — A–B, A–C,
A–D — that a strict minimum-first rule produces, because those cells fill in
lockstep and reading them in order is boring.

**Why this is also the better statistical choice.** Bradley-Terry does not need
any pair voted deeply; it needs the comparison graph *connected*. Raising the
floor everywhere connects that graph fastest. A model-aware selector would pour
votes into contested pairs and leave others at zero, fragmenting the graph and
making the fit worse.

## Ranking engine

Bayesian Bradley-Terry with bias covariates — in effect a small logistic
regression.

Each letter carries a latent score, where **a higher score means earlier in the
alphabet**. For a single vote, with `f` the first-shown letter and `s` the
second, "wins" means "was voted to come first":

```
P(f wins) = logistic( β_f − β_s + γ + δ·isYesNo + ε·isAfterFraming )
```

- `β` — one score per letter, with one fixed at zero for identifiability.
- `γ` — position bias.
- `δ` — acquiescence bias.
- `ε` — negation drag.

Fitted by MAP estimation with a `Normal(0, σ²)` prior on `β`. Sort letters by
posterior mean, descending; that ordering is the alphabet. The **gap** between
two scores is the positional information — a small gap means "just before", a
large gap means "many letters before".

Contradictions need no special handling. A near-even split leaves two scores
sitting on top of each other, which correctly reads as "genuinely contested,
and adjacent". A cycle — E before D, D before Q, Q before E — produces a tight
cluster of three scores, which is a truer description than any single order
forced onto them.

**The prior is the volatility dial**, and it is an honest one. A conservative
`σ` means early votes cannot produce a confident-looking wrong alphabet: the
site reports wide uncertainty and tightens as evidence arrives. This is a
statement about evidence, not a smoothing filter laid over the top. It also
keeps unanimous pairs finite, where unregularised maximum likelihood would push
their scores infinitely apart.

`σ = 1.0` is the starting value — tight enough that a handful of votes cannot
fling a letter across the alphabet, loose enough that a few hundred can move it
decisively. It is a single named constant, tuned against simulated votes during
implementation rather than guessed at here.

Uncertainty comes from the Laplace approximation — inverse Hessian at the mode
— giving a standard error per letter, and therefore error bars on positions.

Roughly thirty parameters over at most 325 aggregated observations. It fits in
milliseconds, so it recomputes on demand behind a cache rather than on a
schedule.

### Connectivity

Bradley-Terry requires a connected comparison graph. Early on it will not be
connected. Letters in no component with the rest are reported as **unplaced**
rather than assigned a fabricated position. The site shows a partial alphabet
and says so.

## Feedback

The vote screen reveals results only after a vote is cast — every visitor
contributes before they consume. On submit, the reveal shows how many people
agreed with that choice.

**Per-vote feedback tells the truth, including when the truth is boring.** Most
votes will not change the order, and "you agreed with the crowd; the estimate
got tighter" is an acceptable message. Reporting movement that did not happen
would make the site a participation trophy, and this is meant to outlive its
launch week.

Progress is expressed as *how settled the alphabet is* — remaining uncertainty —
rather than as a raw vote count, which reads as sad at realistic volumes and
gives no collective goal. A session's own contribution to that reduction is
computable and worth showing.

## Surfaces

**Vote page** (`/`) — the loop. One question, its answers, the reveal, the next
question. Carries the progress indicator.

**Rankings page** (`/rankings`) — the current alphabet with its error bars, the
scoreboard beneath it, and a methodology block reporting the measured bias
coefficients. Publicly readable without voting.

**Privacy page** (`/privacy`) — what the cookie is, what it does, that nothing
is sold or shared, and the forget-me control. Required, since the
strictly-necessary exemption removes the banner but not the notice.

Visual design is deliberately not specified here. It is a separate pass.

## Theme

White, black, and orange. Orange is the only chromatic colour, held at two
lightnesses so one value does not have to be both safe body text and a bright
marker. Full detail lives in `.claude/rules/styling-and-theme.md`; the tokens
are already in `src/app/globals.css` for both grounds.

Dark mode is a real user-togglable mode, not a defined-but-unused set of
values. That needs `next-themes` — the class-based `.dark` variant is already
wired — with a thin `"use client"` provider in the root layout and
`suppressHydrationWarning` on `<html>` to survive the pre-paint theme write.
The toggle respects the OS preference by default and remembers an explicit
choice.

The theme preference is stored in `localStorage`, not a cookie. It never
reaches the server, is not an identifier, and does not change the consent
analysis above.

## Data model

Votes are the single source of truth. Vote counts used by the selector are
derived by aggregation rather than kept in counter columns, so there is no
second copy to drift. At the expected scale this is free; a materialised cache
can be added later without changing the vote table.

```prisma
enum Template {
  WHICH_FIRST
  SHOULD_BEFORE
  SHOULD_AFTER
}

model Session {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  votes     Vote[]
}

model Vote {
  id         String   @id @default(cuid())
  // Nullable so "forget me" can sever the link without destroying the vote.
  // Postgres treats NULLs as distinct in a unique index, so detached votes do
  // not collide with each other.
  session    Session? @relation(fields: [sessionId], references: [id])
  sessionId  String?
  pairKey    String   // canonical "A:B", lexicographic
  firstShown String   // letter occupying the first slot in the prompt
  template   Template
  answer     String   // raw response, before interpretation
  winner     String   // letter voted to come first
  createdAt  DateTime @default(now())

  @@unique([sessionId, pairKey, template, firstShown])
  @@index([pairKey])
}
```

`answer` stores the raw response and `winner` its interpretation. Both are
kept: `winner` is what the model consumes, `answer` is what lets a
misinterpretation be found and corrected later without the original response
being lost.

Database is Prisma Postgres, already provisioned; credentials are in `.env`.

## Error handling

- **Duplicate vote** — the unique constraint rejects it; treat as idempotent
  and serve the next question.
- **Disconnected graph** — report unplaced letters explicitly, never fabricate
  a position.
- **No votes yet** — the rankings page shows an explicit empty state, not the
  current alphabet dressed up as a result.
- **Session cookie absent** — created on first vote, not on page load, so
  readers of the rankings page are not tagged.
- **Detached votes** — votes with a null `sessionId` still count toward the
  alphabet and the global bias terms, and are simply absent from any
  per-person consistency measure.

## Testing

The ranking engine is a pure function from a vote table to scores, so it is
testable against synthetic data with known ground truth:

- A planted ordering plus simulated votes is recovered.
- A planted position bias is recovered by `γ`, and the letter scores come back
  undistorted.
- A vote cycle produces a tight cluster and does not diverge.
- A unanimous pair yields finite scores, confirming the prior binds.
- A disconnected graph is flagged rather than silently mis-ranked.

The selector is tested statistically: low-count cells are drawn more often, no
cell starves, and concurrent draws scatter.

Forget-me is tested end to end: the session row is gone, its votes survive with
a null `sessionId`, the alphabet is unchanged by the operation, and the cookie
is cleared.

## Non-goals

- Accounts, login, or any persistent identity beyond the anonymous session.
- Ranking history over time. Worth having eventually — "these four letters have
  been at war for two years" is a good long-term artifact — but it is not
  needed to launch, and adding it later requires no change to the tables above.
- Sharing cards, social integration.
- Visual design.
