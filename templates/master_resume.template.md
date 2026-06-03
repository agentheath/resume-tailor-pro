# Master Resume

This single file contains all resume CONTENT. The engine (SKILL.md) selects and assembles
from it based on the job posting. Personalization RULES live in `config.md`, not here.

Onboarding generates this file. You can hand-edit it any time; the tailoring flow runs
`profile-lint` on every run and will tell you if something is inconsistent.

See `references/master-resume-schema.md` for full field documentation.

<!-- schema_version: 1 -->

---

## Shared

### name
<!-- Your full name. Must match config.md `name`. -->

### contact
<!-- "City, ST | 555.123.4567 | you@example.com" -->

### links
<!--
- LinkedIn: https://www.linkedin.com/in/...
- Portfolio: https://...
-->

### education
<!-- **B.A. Field** — Institution, City, ST -->

### anchor_role_header
<!--
Single-anchor users (one dominant current employer): put that role's header here.
**<Title>** — <Company>
*<Location> - <Start> - Present*
<one-line role scope sentence>

If combined-title is enabled in config for this employer, the title is
"<combined_title_first_half> / <tailored second half>" — the engine swaps the second half
per posting. Otherwise use a single title and the engine tailors that one title.

Multi-role-balanced / single-role (new-grad) users: you may leave this blank and put all
roles under `other_experience` instead. The engine degrades gracefully (no assumed anchor).
-->

### other_experience
<!--
Non-anchor roles, most recent first. For each:

**<Company> — <Title>**
*<Location> · <Start> - <End>*
- <bullet describing the role/impact>

Inclusion notes (which entries are always-include or conditional) live in config.md, NOT here.
-->

---

## Variant Definitions

Each variant (theme) has: a name, signal keywords for matching, a tagline, and a summary.
The engine picks the variant whose signal keywords best match a posting. Themes are generated
during onboarding from your target role families, and their taglines/summaries are finalized
LATE — built from your own highest-priority bullets so they headline real metrics.

<!--
### variant: <name>

**Use when:** <when this theme fits a posting>

**Signal keywords:** <comma-separated keywords that signal this theme>

**Tagline:** <Phrase One · Phrase Two · Phrase Three>
  (middle-dot · separators only; no commas/slashes. Names domains/practices you genuinely
   specialize in — NOT deliverable types. See SKILL.md Voice and Style.)

**Summary:** <one paragraph leading with a real opener title from config.summary_openers,
  threading your own highest-impact metrics from the Bullets below.>
-->

---

## Bullets

Each bullet has:
- **id**: unique identifier
- **variants**: which themes it belongs to
- **priority**: per theme, 1 = must-include, 2 = include if space, 3 = full-mode only.
  OPTIONAL — a missing priority defaults to 2.
- **version**: `default` (tighter, one-page). `full` is OPTIONAL — if absent, `--full`
  mode reuses `default`.

Bullets are flat and standalone — write each as a complete, self-contained bullet. (Unlike
some hand-tuned master files, there is no "add-on sentence / fragment" mechanism here.)

<!--
### bullet: <id>
variants: [theme_a, theme_b]
priority: {theme_a: 1, theme_b: 2}

**default:**
- **<Bold lead-in>** — <concrete, metric-bearing accomplishment in past tense>.

**full:**            <!-- optional; omit to reuse default -->
- **<Bold lead-in>** — <expanded version with extra detail>.
-->

---

## Extras (swap-in candidates)

Not in any variant by default. The engine may swap one in (max 3) if it strongly matches a
posting keyword the selected bullets don't cover. Each swap replaces exactly one selected
bullet — never additive.

<!--
### extra: <id>
tags: [tag_a, tag_b]

- **<Bold lead-in>** — <accomplishment>.
-->

---

## Skills

Build 4–5 categories, each with a comma-separated value list (5–8 terms each). Excluded terms
(from config.md `excluded_from_skills`) must NOT appear here.

### skills_order
<!--
Per theme, the order to present skill categories (lead with the most relevant):
- <theme>: Category A → Category B → Category C → ...
-->

<!--
### <Category Name>
term, term, term, term, term
-->

---

## Keyword Bank (LinkedIn / ATS Skills fields only) — OPTIONAL

NOT for the resume body. Use for LinkedIn Skills, ATS Skills sections, internal mobility
profiles. The resume body's Skills section stays tight; this bank holds the fuller
controlled-vocabulary list including synonyms employers search on. Excluded terms stay out
of here too.
