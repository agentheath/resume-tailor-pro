# resume-ingest contract

A self-contained contract for parsing a user's **existing** resume (PDF / Markdown / docx) into
seed material for onboarding Phase 0. This is bundled so the skill is distributable with **no
plugin dependency**. If the `career-intake` skill happens to be installed, onboarding may
delegate the richer interview to it — but this contract alone is sufficient.

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

## Shape detection (informs onboarding)

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
