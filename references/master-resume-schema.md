# master_resume.md schema

`profile/master_resume.md` holds all resume **content**. The engine selects and assembles from
it per posting. Personalization **rules** live in `config.md`, not here.

The file carries `<!-- schema_version: 1 -->` near the top; profile-lint checks it.

## Sections

### `## Shared`
Identity and always-present content.

- **`### name`** — full name; must match `config.md` `name`.
- **`### contact`** — `City, ST | phone | email`.
- **`### links`** — LinkedIn / Portfolio / etc.
- **`### education`** — `**Degree** — Institution, City, ST`.
- **`### anchor_role_header`** — for **single-anchor** users (one dominant current employer):
  the role header block. Title, company, location/dates line, and a one-line scope sentence.
  If `config.combined_title_employer` names this employer, the title is the combined
  `<first_half> / <tailored second half>` form and the engine swaps the second half per posting;
  otherwise it is a single title the engine tailors. **May be blank** for multi-role-balanced or
  single-role (new-grad) shapes — the engine then assembles purely from `other_experience` and
  does not assume an anchor.
- **`### other_experience`** — non-anchor roles, most recent first, each a header block + bullets.
  Inclusion rules (always / conditional) are NOT written here — they live in `config.md`.

### `## Variant Definitions`
One `### variant: <name>` block per theme, each with:
- **`Use when:`** — when the theme fits a posting.
- **`Signal keywords:`** — comma-separated matching keywords.
- **`Tagline:`** — middle-dot (`·`) separated phrases; no commas/slashes. Names genuine
  domains/practices, **not deliverable types**. (See SKILL.md Voice and Style.)
- **`Summary:`** — one paragraph, leading with a real opener from `config.summary_openers`,
  threading the user's own highest-impact metrics.

Themes are **captured early** (as stubs) in onboarding but **finalized late**, after bullets
exist, so summaries headline real numbers rather than placeholders.

### `## Bullets`
One `### bullet: <id>` block per accomplishment:
- **`variants:`** — `[theme_a, theme_b]`; every theme named must be defined in Variant
  Definitions (profile-lint enforces this).
- **`priority:`** — `{theme_a: 1, theme_b: 2}`. **Optional**; a missing per-theme priority
  defaults to **2**.
- **`**default:**`** — the one-page version (required).
- **`**full:**`** — expanded version. **Optional**; when absent, `--full` mode reuses `default`.

**Bullets are flat and standalone.** Each is a complete bullet. There is intentionally **no
"add-on sentence / fragment" mechanism** (a deliberate simplification vs. some hand-tuned master
files) — if you want extra detail in full mode, write it into that bullet's `full` version.

### `## Extras (swap-in candidates)`
`### extra: <id>` blocks, each with `tags:` and one bullet. Not selected by default; the engine
may swap at most 3 in when they beat a selected bullet on posting relevance. Always a 1-for-1
swap — never additive.

### `## Skills`
- **`### skills_order`** — per theme, the category presentation order (lead with the most
  relevant). profile-lint checks every category is listed.
- One `### <Category Name>` block per category (4–5 total), each a comma-separated value list of
  5–8 terms. No term from `config.excluded_from_skills` may appear here (profile-lint enforces).

### `## Keyword Bank` (optional)
For LinkedIn / ATS Skills fields only — not the resume body. Fuller controlled-vocabulary list
with synonyms. Excluded terms stay out of here too.

## Profile shapes
The schema supports three shapes; onboarding detects which and fills accordingly:
- **single-anchor** — one dominant current employer in `anchor_role_header`, others in
  `other_experience`. (The shape the engine is most optimized for.)
- **multi-role-balanced** — no single dominant employer; `anchor_role_header` may be blank,
  roles balanced across `other_experience`.
- **single-role (new-grad)** — one role / mostly projects + education; `anchor_role_header`
  blank. The engine degrades gracefully and does not assume an anchor employer.
