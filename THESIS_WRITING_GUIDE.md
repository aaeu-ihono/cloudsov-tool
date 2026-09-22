# Thesis Writing Guide

Rules derived from what actually worked in Chapter 2, and from what got rejected.
Every item below has evidence behind it — a passage that landed, or one that didn't.

---

## 1. This is an engineering thesis, not a law thesis

The reader is an engineer or a manager. They need to know **what happens to them**,
not what a court held.

| Rejected | Accepted |
|---|---|
| "gave the individuals concerned no actionable rights before United States courts" | "a European whose data ended up there had no practical way to challenge it" |
| "faces orders it can neither fully obey nor safely refuse" | "Whichever it obeys, it breaks the other" |
| "the exposure does not originate in the contract" | "a contract cannot stop a government from ordering the provider to hand data over" |

**Test:** if a sentence describes what a court *held*, rewrite it as what that means
for someone operating a system.

## 2. Never write from memory

Research the primary source first, then write only what it supports. This is
non-negotiable — an unsourced claim that turns out wrong is an academic-integrity
failure, and recalled detail is dangerous precisely because it reads as confident.

- One citation **per claim**, at the point the claim is made. A narrative of four
  facts needs four citations, not one at the end of the paragraph.
- Cite the source for *that* fact. A Court of Appeals holding cites that court's
  decision, not a later Supreme Court entry that mentions it.
- Where something cannot be verified, leave a `\todo`, avoid it competely
- No assumptions. 
- Flag explicitly which details still need the author's own verification.
- **This applies to the project's own code too.** Describing what the CloudSov tool
  does from memory produced "holds the evidence and computes the scores" — wrong on
  both counts. The JSON files hold the evidence; the tool reads it, applies the
  scoring rules, and lets the assumptions be varied and re-run. Read the source
  before describing the system.

**Evidence:** an unsourced Microsoft Ireland narrative written from memory contained
several real errors — procedural history omitted, "refused" for "moved to quash",
wrong statutory section cited, two distinct decisions merged into one bibliography
entry. Separately, searching found the Commission had referred *four* member states
to the CJEU over NIS2; the figure dominating search results was "23", from a
two-year-old infringement wave.

## 3. Define plainly first, cite second

Lead with the idea in ordinary words. Bring in the authority afterwards, as
confirmation.

> A **regulation** becomes law in every member state on the day it takes effect. No
> national parliament has to act… A **directive** does not become law by itself…
>
> *This division is set out in Article 288 of the Treaty…*

The rejected version opened with the treaty quotation, so "general application" and
"directly applicable" landed on a reader who had no idea what they meant yet.

## 4. Explain why a rule exists, not only what it says

> The Regulation restricts sending personal data outside the Union. The reason is
> straightforward: rights that apply inside Europe would count for little if data
> could simply be moved to a country where they do not apply.

One sentence, and an arbitrary-seeming restriction becomes obvious.

## 5. Explain the mechanism, drop the term

Don't name a thing and leave the reader to look it up. Say what it does.

> The order counts only if the two countries have a treaty covering requests of that
> kind. Such treaties exist, and they work by sending the request from one government
> to the other, which then obtains the data through its own courts.

"Mutual legal assistance treaty" never appears. The reader understands it anyway.

## 6. No section or article numbers in the prose

`§ 103(a)(1)`, `§ 2713`, `Article 45` — these help nobody reading the argument. Put
the pinpoint in the bibliography entry's `note` field, where someone who wants it can
find it. Naming the instrument is enough: "the Stored Communications Act", "Chapter V
of the Regulation".

## 7. Lists for anything enumerable

If there are three of something, use a list and bold the term being defined. Three
transfer routes crammed into one sentence with four terms of art is where the reader
gives up.

## 8. Structure follows the argument, not the other way round

- Define the general before the specific. Regulations-vs-directives comes *before*
  GDPR and NIS2, because it explains how each of them reaches anyone.
- Don't announce structure the prose already has. `\paragraph{}` headings were cut
  from §2.2.2 — they interrupted a narrative that was building.
- Say a thing once. The same point made twice, three paragraphs apart, reads as
  padding.

## 9. End every section with what it means for the thesis

Not a summary — a consequence.

> It has to be judged on where it is incorporated, who owns it, and who can reach its
> systems — which is what the sovereignty instrument in §3.4 sets out to measure.

## 10. Never promise what the chapter doesn't deliver

If the introduction says the section covers China, a China subsection has to exist.
Either write it or narrow the promise.

## 11. Tables earn their place by revealing a pattern

Table 2.2 lists five European instruments. Its value is not the list — it's that only
one of them is a directive, which shows the Union deliberately legislating by
regulation to avoid fragmentation. A table that only restates the prose is furniture.

## 12. Political neutrality on jurisdictions

Write about **statutes**, not states. Name the Cybersecurity Law, the Data Security
Law, the CLOUD Act. Avoid "regime" and any characterisation of how a country is
governed — the argument only needs what the law requires of a provider, and staying
symmetrical across jurisdictions is harder to read a position into.

## 13. Open a chapter with a situation, not a table of contents

A chapter opening has one job: make the reader want to continue. Listing the sections
does the opposite — the headings already tell them what is coming.

Put a concrete actor in a concrete situation and walk them into the problem.

| Rejected | Accepted |
|---|---|
| "Chapter 2 established what sovereignty means… This chapter describes how those questions were turned into something measurable. We begin in section 3.1…" | "Suppose an enterprise decides to move its systems to a European provider. It draws up a shortlist. Every provider on that list describes itself as sovereign…" |

Three things make the accepted version work:

- **Show the failed alternatives first.** Two wrong approaches, dismissed in a sentence
  each, justify the entire design without a word of methodological vocabulary:
  *"Speed says nothing about who can reach the data."* *"A certificate shows that a
  process was followed, not that a foreign government can be kept out."*
- **Phrase criteria as questions a real person would ask.** "Will it still be trading
  when the contract matures?" not "financial viability assessment".
- **Let the next chapter arrive as a consequence**, not an item. *"And if no provider
  passes all four? Then the question changes."*

**Academic positioning does not belong in an opening.** A paragraph placing the work
against prior research was cut from this intro — it was the driest thing in it. That
material belongs in Related Work.

**Reasoning about method is still abstract even in simple words.** "Two obvious
approaches fail", "refuses to merge them until the end" — plain vocabulary, but the
reader is holding concepts rather than watching something happen. Show the method
working instead of describing its logic.

## 14. Do not over-explain, and never justify an absence at length

A paragraph defending a structural choice reads as insecurity. One sentence, or none.

When Study 5 was moved out of the methodology chapter, the first attempt was four
sentences explaining why. The accepted version was one: *"The fifth is a study of a
different kind and is set out in Chapter 5, together with its findings."* The reader
did not need the defence, and the phrase "a study of a different kind" carried the
distinction on its own.

---

## Mechanical standards

- **British English** throughout (the draft is already consistent — 94 British
  spellings against 2 American strays).
- **Acronyms via `\ac{}`**, never typed literally. An undeclared acronym renders as
  `XXX!` in the PDF and is silent in the build log — check periodically.
- **Figures are vector**: TikZ or pgfplots, generated from the project JSON where the
  figure plots data. Screenshots only for documenting the tool's interface.
- **Every figure and table referenced** in the text at least once, by `\cref`.
- **Build after every change.** Report errors, undefined citations, undefined
  cross-references, and overfull boxes. Overfull boxes inside `\todo` notes don't
  count — they disappear with the note.
- **Citation style is `IEEEtran`** — numeric, and unlike `plain` and `apalike` it
  actually prints the `url` fields, which matters because most sources are web
  documents.
- **A corrupt `main.aux` or `main.out`** produces "Text line contains an invalid
  character" or "File ended while scanning use of \citation". It means a build was
  interrupted. Fix with `latexmk -C` then rebuild.



