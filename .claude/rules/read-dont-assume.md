---
paths:
  - "*"
---

# Read, Don't Assume

Never report a conclusion about something you have not read.

## The failure

A parser produced nothing for five sections. The report said the source documents
contain no information for those sections, so the parser is correct.

The source documents had not been opened.

The conclusion was plausible, consistent with the available evidence, and
unverified — and it was the entire question being asked.

## Read the origin, not the summary

A commit message is a label on a box; the diff is what is inside it. A function
name states intent; the body is what runs. A filename suggests contents; the file
is the contents. A test name claims a behavior; the assertions are the behavior.

When the question is about the contents, open the box.

## Check what you actually looked at

Before any claim about code or data, ask whether you read the thing itself or
something describing it.

- "This function handles X" — did you read the function?
- "The source has no value here" — did you open the source?
- "This was added to fix Y" — did you read the diff?
- "The tests cover this" — did you read the tests?

If the answer is no, read it before saying it.

## Reading is cheap

You can read the file in less time than it takes the user to open it. There is no
version of this where guessing was the efficient choice.

A wrong claim costs more than every file you would have read to avoid it. It gets
believed, acted on, and discovered later.

## Say what you did not check

When something genuinely cannot be read — access failed, the data is remote, the
volume is prohibitive — say so and mark the claim unverified.

A labelled assumption is usable. One presented as a finding is not.
