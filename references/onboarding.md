# Onboarding

Builds a first-time user's `profile/master_resume.md` + `profile/config.md` through an
interview, then validates and test-renders. Triggered by the SKILL.md Step-0 gate (when
`profile/.onboarding-state.json` is missing or not `complete`) or by an explicit request
("set up my resume").

## Operating principles

- **Resumable.** Save incrementally **after every locked role and at the end of every phase** —
  and update `.onboarding-state.json` as you go. If interrupted, the Step-0 gate resumes from
  the last completed phase. File-existence is NOT the completion signal (a half-built
  `master_resume.md` exists mid-onboarding); the state file is.
- **Accuracy first.** Everything captured must be defensible in an interview. Push for concrete
  metrics; never invent. When a target role uses vocabulary the user only works *near*, capture
  the honest equivalent — don't let it become a claimed specialization.
- **Themes captured early, finalized late.** You cannot write good taglines/summaries before the
  user has supplied achievements, because summaries headline specific metrics. Capture theme
  *stubs* in Phase 2; finalize their taglines/summaries in Phase 5 from the user's own bullets.

## Intro message (show before Phase 0)

Show the **conceptual framing first**, then the logistics. The user needs to understand they are
building a *repository*, not a finished resume — otherwise they self-edit down to "just my final
resume" and starve every future tailored render.

> **What we're building.** This sets up your **master resume** — a single, comprehensive
> repository of *all* the variations of your experience: every bullet, in multiple phrasings,
> tagged by focus area and priority. It is **not** the resume you send out. Instead, each time you
> give the skill a job posting, it **selects and adapts the best pieces** from this master file —
> picking the right bullets, threading the posting's language, and trimming to fit — to generate a
> tailored, one-page (or full) resume for that specific role. The richer and more complete your
> master file, the better every future tailored resume will be. So we'll try to capture as much
> defensible material as possible.
>
> **Logistics.** You can stop any time and resume right where you left off — I save after every
> step. We'll build two files: your master resume (all your content) and a config (your
> personalization rules). At the end I'll do a test render so you get a real Word/PDF resume out
> of it.

Create `profile/` and seed `.onboarding-state.json`:
```json
{ "schema_version": 2, "status": "in-progress", "last_completed_phase": 0, "profile_shape": null }
```
**Idempotent scaffolding — do NOT clobber an existing profile.** Copy
`templates/config.template.md` → `profile/config.md` and
`templates/master_resume.template.md` → `profile/master_resume.md` **only if the target file does
not already exist.** If `profile/config.md` / `profile/master_resume.md` already exist (the user
is re-running onboarding to revise, or resuming an interrupted run), **load and edit them in
place** — never overwrite a populated file with a blank scaffold.

**Resuming / re-running (state schema v2).** Read any existing `.onboarding-state.json`:
- `status: in-progress` → resume from `last_completed_phase`.
- `status: complete` → the user is revising. Don't restart from Phase 0. If the profile predates
  these enhancements (e.g. no `## Keyword Bank` seed and no recorded web research), *offer* — don't
  force — the new Phase-2b/2c and Phase-4 passes, then re-lint. Leave everything else intact.
- Missing `schema_version` or `schema_version < 2` → treat as a pre-enhancement profile: bump it
  to `2` on next save and apply the "offer the new passes" behavior above.

## Phases

After completing each phase: write its outputs to the profile files, then bump
`last_completed_phase` in `.onboarding-state.json`.

### Phase 0 — Optional ingest (resumes + LinkedIn)
Ask whether the user has any existing career documents — and explicitly invite **more than one**:
*"the more I can pull from, the richer your master file. Share any of: your current resume, older
versions of it, and your LinkedIn profile."*
- **Resumes (PDF/MD/docx), one or several.** Parse each per `references/resume-ingest-contract.md`.
- **LinkedIn.** Offer the two intake paths from the contract: (1) **Save to PDF** of their
  profile (give the instructions and ask for the path), or (2) **copy-paste individual fields**
  (Headline, About, each Experience entry, optionally Skills/Education). Live scraping is not
  possible (login + ToS) — say so.
- **Merge + dedupe** all sources into a single seed per the contract's merge rules: recover
  bullets dropped from the latest version, and **surface near-duplicates and metric conflicts to
  the user** rather than auto-resolving. Flag recovered/secondary-source items for keep/discard.

Detect `profile_shape` (single-anchor / multi-role-balanced / single-role) from the merged seed
and record it in the state file. **Never modify any original file.** If the user has nothing to
ingest, proceed and detect shape during Phase 3.

### Phase 1 — Identity & contact
Collect name, contact line (`City, ST · phone · email` — no parentheticals), and links. Write
`config.md` identity fields + `output_basename` (offer the slug of their name as default) and
`master_resume.md` `### name` / `### contact` / `### links` / `### education`.

### Phase 2 — Target roles → theme stubs (declarative only)
Goal: end with 2–4 `### variant:` **stubs** in `master_resume.md` — each a theme **name**,
`Use when:`, and `Signal keywords:` — with the **Tagline/Summary lines left as TODO
placeholders**. Do NOT write taglines/summaries yet (those are finalized in Phase 5 from real
bullets). Drive the stubs with three inputs, in order:

**2a. Ask what they're targeting.** What 2–4 role families do they want? (Always the anchor.)

**2b. Accept sample job postings (signal, not content).** Invite the user to **paste 1–N example
postings** for roles they want ("paste text, or a few examples"). Use them — together with the
ingested resume/LinkedIn from Phase 0 — to **proactively suggest** candidate variant stubs
(focus areas with draft `Use when:` / `Signal keywords:`). The user confirms, edits, renames, or
drops each. (This makes Phase 2 *suggest*, not just *ask*.)
- **Seed the Keyword Bank.** Extract the postings' controlled vocabulary into the
  `## Keyword Bank` section of `master_resume.md` (the section already exists in the template) for
  reuse in later tailoring runs. **Guardrail:** Keyword-Bank seeds are *candidate vocabulary from
  postings*, not claimed skills. Any term that would also become a **Skill** is gated by the
  "do you genuinely do this?" check before it's written; drop anything already in
  `config.excluded_from_skills`.

**2c. Optional web research (opt-in, non-blocking).** Offer: *"Want me to research adjacent
titles and commonly-required skills for these roles?"* If yes, run `WebSearch`/`WebFetch` on each
role family to gather **adjacent job titles, role variations, and frequently-required skills**.
Use the results only to **enrich the suggested variant stubs** and to propose `adjacent_not_in`
candidates (titles the user works *near* but not *in*). See **Web research guardrails** below —
this never writes claimed content on its own, and a skip or junk result just continues the
interview. (The skills harvested here feed Phase 4.)

Write the confirmed stubs to `master_resume.md`.

#### Web research guardrails (referenced by Phase 2c and Phase 4)
Web research only **proposes** candidates — it never writes claimed content on its own. Apply all
of these:
- **Opt-in and non-blocking.** Offer it; the user may skip. If `WebSearch`/`WebFetch` returns
  empty, off-topic, or low-quality results, **skip silently and continue the interview** —
  research is signal, not a dependency.
- **Raw output is ephemeral.** Do **not** persist raw search/fetch results. Only the
  user-*confirmed* outputs (variant stubs, `adjacent_not_in` entries, accepted skills) are written
  to the profile, incrementally.
- **`genuine_domains` is high-trust — guard the intake.** A domain confirmed "genuine" threads
  **directly** into the role-header title (SKILL.md step 6). For any researched domain, ask
  explicitly: *"do you actually work **in** this, or only **near** it?"* — "near" → propose it for
  `config.adjacent_not_in` (with an honest equivalent), **never** `genuine_domains` or the
  tagline.
- **Researched skills need per-term confirmation.** Any skill that originated from web research
  (or from a pasted posting) — i.e. not already on the user's own resume/LinkedIn — requires
  **per-term** "do you genuinely do this?" confirmation before it enters a Skills category (see
  Phase 4 provenance gating). Nothing researched is written as a claimed specialization/skill/
  domain without that confirmation.

### Phase 3 — Experience & bullets
Confirm `profile_shape` (from Phase 0, or detect now). Then per role, run a
question→draft→lock loop:
1. Ask what they did and — critically — push for **concrete metrics** (counts, %, $, time,
   scale). A bullet without a number is a weaker bullet; try to attach one.
2. Draft the bullet, present it, let them edit, then lock it.
3. Tag each locked bullet's `variants` (which themes it serves); set per-theme `priority` if
   they have an opinion (else leave it — defaults to 2). Author a `full` version only if they
   want expanded detail (else omit — `--full` reuses `default`).
4. **Write after each locked role** (mid-phase save).

**Shape handling:**
- **single-anchor** — put the dominant employer in `### anchor_role_header`; other roles in
  `### other_experience`.
- **multi-role-balanced / single-role** — leave `anchor_role_header` blank; put all roles in
  `### other_experience`. Bullets still tag to themes, but don't assume one dominant employer.
  For new-grads, projects (from the ingest contract) become bullets/Extras.

### Phase 4 — Skills
**Propose, don't just ask.** Draft 4–5 categories with 5–8 terms each, drawn from: the ingested
resume/LinkedIn (Phase 0), the pasted sample postings (Phase 2b), and any web research (Phase 2c).
Present the draft for the user to edit/approve.

**Provenance gating (stops researched-but-not-practiced skills from leaking in):**
- Terms sourced from the user's **own resume/LinkedIn** may be **batch-approved** by category.
- Terms sourced from **postings or web research** require **per-term** "do you genuinely do this?"
  confirmation before being written to a category — no batch-approve shortcut.

Apply exclusions as you go: anything the user doesn't want surfaced goes into
`config.excluded_from_skills` (and stays out of the Skills section *and* the Keyword Bank), not
into a category. Set `### skills_order` per theme (lead each theme with its most relevant
category).

### Phase 5 — Finalize themes
Now that bullets + metrics exist, for each theme stub from Phase 2:
- **Tagline** — 3 phrases, middle-dot (`·`) separated, naming genuine domains/practices (NOT
  deliverable types). Build from the user's real specializations.
- **Summary** — one paragraph opening with a `config.summary_openers` title, threading the
  user's own **highest-priority bullets'** metrics.
Present each for edit, then write into the `### variant:` blocks (replacing the Phase-2 TODOs).
Carry the SKILL.md Voice and Style tagline/summary constraints or the copy regresses to keyword
soup.

### Phase 6 — Personalization rules → config.md
Fill the remaining `config.md` fields by interview:
- `specializations` — the honest list of what they practice.
- Excluded terms — three sub-fields: `excluded_from_skills`, `term_replacements` (jargon →
  honest), `claimed_languages` (singular framing).
- Title conventions — `genuine_domains`, `adjacent_not_in` (profession → honest equivalent), and
  the combined-title fields. Ask the combined-title question **carefully**: "Does ONE employer
  give you two legitimate titles for one role?" Most users answer no — leave it off.
- `always_include` / `conditional_include` — which experience entries never trim, which are
  conditional by mode/theme.
- `summary_openers` — safe opener titles (only titles genuinely held or honest descriptors).

### Phase 7 — Validate + render
1. Run `references/profile-lint.md`. Report any failures specifically and **offer to fix**, then
   re-lint until clean.
2. Run `npm install` in `renderer/` **up front** (so the test render isn't the first time deps
   are touched). Detect Chrome (per SKILL.md) and report the PDF path or fallback.
3. Do a **test render** of one theme to confirm the basename and that the toolchain works.
4. **Strongly encourage a careful manual review of `master_resume.md`.** This file is the source
   of every future tailored resume, so accuracy here pays off on every run. Ask the user to read
   it end to end and check, in particular: every metric and number is correct and defensible;
   titles, dates, and company names are right; each bullet is honest; nothing was mis-merged
   during ingest. Invite them to edit directly or have you make changes — then re-run
   `profile-lint`. Also skim `config.md` for the personalization rules. Mention that they can
   revise the master file any time; the tailoring flow re-lints on every run.
5. Tell the user how output works: **by default the skill produces a one-page resume** (best for
   recruiter screening / ATS); they can ask for **`--full` (full mode)** — say "full," "long
   version," or "two-page" — for an expanded 1.5–2 page version (referrals / direct-to-hiring-manager).
6. Set `.onboarding-state.json` `status: "complete"`.

## Completion
On `status: complete`, the Step-0 gate will route future invocations straight to the tailoring
workflow (after a profile-lint pass). The user can re-run onboarding any time to revise.
