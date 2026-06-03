# resume-ingest contract

A self-contained contract for parsing a user's **existing** career documents — one or more
resumes (PDF / Markdown / docx) **and/or a LinkedIn profile** — into seed material for
onboarding Phase 0. This is bundled so the skill is distributable with **no plugin dependency**.
If the `career-intake` skill happens to be installed, onboarding may delegate the richer
interview to it — but this contract alone is sufficient.

**Multiple sources are normal.** A user may hand over their current resume, one or two older
versions, and a LinkedIn export. Parse each into its own seed object, then **merge + dedupe**
them into a single seed per the merge rules below — older versions and LinkedIn often carry
strong bullets the latest resume dropped, and recovering those is a primary goal.

## Hard rules

- **Never modify the user's original file.** Read it; if it's a PDF, convert a *copy* to
  Markdown for parsing. The source file is untouched.
- **Extract, don't invent.** Pull only what the document actually says. Gaps become questions
  for the interview — never fabricated content.
- **Flag uncertainty.** Where the parse is ambiguous (a date range, an unlabeled section), mark
  it and confirm with the user rather than guessing.

## Input handling by format

- **PDF** → convert to Markdown first. Prefer a text extractor (`pdftotext -layout file.pdf -`,
  or a Python lib such as `pdfplumber`/`pymupdf`) writing to a temp `.md`. If the PDF is scanned
  / image-only and yields no text, tell the user and ask them to paste the content or provide a
  text version.
- **Markdown / plain text** → parse directly.
- **docx** → extract text (`pandoc file.docx -t markdown`, or `python-docx`) to a temp `.md`,
  then parse. If no converter is available, ask the user to export to PDF or paste the text.
- **LinkedIn profile** → live scraping is **out** (login + ToS block it). Offer the user two
  intake paths and accept whichever they prefer:
  1. **Profile PDF.** Instruct them: *"On your LinkedIn profile page, click the **More** button
     (in the intro panel below your headshot) → **Save to PDF**, then give me the path to the
     downloaded file."* Parse the PDF exactly like a resume PDF (convert a copy to Markdown;
     never modify the original).
  2. **Copy-paste individual fields.** For users who'd rather not export, prompt for these
     fields by name so they know exactly what to paste: **Headline**, **About**, each
     **Experience** entry (`title · company · location · dates · description`), and optionally
     **Skills** and **Education**. Map each pasted block to the seed buckets below (Headline →
     a candidate tagline/summary signal; About → summary signal; Experience → `roles`; Skills →
     `skills`; Education → `education`).

  Either path yields a seed object that is **merged + deduped against the resume seed(s)** by the
  merge rules below.

## Round-0 extraction (what to pull)

Produce a structured seed object with these buckets. Leave a bucket empty rather than padding it.

1. **identity** — name, location, phone, email, and any links (LinkedIn, portfolio, GitHub).
2. **roles** — for each employment entry: `company`, `title(s)`, `location`, `start`, `end`
   (or "Present"), and the raw bullet/sentence list as written. Preserve original wording;
   normalization happens later in the interview.
3. **projects** — standalone projects (common on new-grad resumes): `name`, `summary`, any
   `tech/skills` mentioned, and link if present.
4. **skills** — every skill/tool/technology listed, grouped if the source groups them. Keep the
   raw terms; the engine's excluded-term rules are applied later, not here.
5. **education** — degree(s), institution, location, graduation year/range, honors.
6. **extras** — awards, publications, talks, certifications, volunteer work — anything that
   doesn't fit above but may seed an Extra.

## Merging multiple sources (resumes + LinkedIn)

When more than one source is provided, parse each into its own seed object, then merge into one.
The goal is to **recover** strong material dropped across versions while not duplicating it.

**Bullet dedupe — within `roles` (matched per company/role) and across `extras`/`projects`:**

1. **Normalize** each bullet for comparison only (never alter the stored text):
   casefold → strip Markdown/bold (`**`) → strip punctuation → collapse whitespace.
2. **Match:**
   - **Exact-normalized match** → the same bullet; **auto-dedupe** (keep one).
   - **High token-overlap** (near-duplicate — clearly the same accomplishment, reworded) →
     do **NOT** auto-merge. **Surface both to the user** ("these look like the same bullet —
     keep which, or both?"), because paraphrase recovery is the whole point and silently
     collapsing loses a phrasing the user may prefer.
3. **"Richer" wins only when unambiguous:** if one normalized bullet is a **superset** of the
   other (same content, more detail), keep the superset and drop the subset automatically.
   When neither is a superset (they merely diverge), treat as a near-duplicate → surface to user.
4. **Metric conflict (factual risk):** if two versions state the **same accomplishment with
   different numbers** (e.g. "cut latency 30%" vs "cut latency 45%"), **never silently pick**.
   Surface both figures and ask the user which is correct before keeping either.
5. **Never silently drop a unique bullet.** Anything that doesn't match an existing bullet is
   kept and presented as recovered material for the user to keep or discard.

**Other buckets:** union `skills` (dedupe identical terms, casefold-compare), `education`,
`identity` (prefer the most complete/most recent value; if identity fields *conflict* — e.g.
two phone numbers — ask). Present the merged set, flagging which items were **recovered from an
older/secondary source**, so the user can decide.

While parsing, classify the resume's **profile shape** and pass it to onboarding Phase 3:

- **single-anchor** — one clearly dominant current/most-recent employer with the bulk of the
  bullets.
- **multi-role-balanced** — several roles of comparable weight, no single dominant employer.
- **single-role (new-grad)** — one role or mostly projects + education.

If detection is ambiguous, default to asking the user one question ("Which of these best
describes your history?") rather than committing silently.

## Handoff to the interview

The seed object is **draft input**, not final content. Onboarding Phase 3 walks each extracted
role through the question→draft→lock loop to add metrics and tighten wording; Phase 4 maps the
raw skills into categories (applying excluded-term rules); Phase 5 finalizes themes. Nothing
from this contract is written to `master_resume.md` until the user has reviewed and locked it.
