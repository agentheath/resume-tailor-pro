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

> Setting up your resume profile takes ~45–90 minutes. You can stop any time and resume right
> where you left off — I save after every step. We'll build two files: your master resume (all
> your content) and a config (your personalization rules). At the end I'll do a test render so
> you get a real Word/PDF resume out of it.

Create `profile/` and seed `.onboarding-state.json`:
```json
{ "schema_version": 1, "status": "in-progress", "last_completed_phase": 0, "profile_shape": null }
```
Copy `templates/config.template.md` → `profile/config.md` and
`templates/master_resume.template.md` → `profile/master_resume.md` as the working scaffolds.

## Phases

After completing each phase: write its outputs to the profile files, then bump
`last_completed_phase` in `.onboarding-state.json`.

### Phase 0 — Optional resume ingest
Ask whether the user has an existing resume. If yes (PDF/MD/docx), parse it per
`references/resume-ingest-contract.md` into a seed object and detect `profile_shape`
(single-anchor / multi-role-balanced / single-role). Record `profile_shape` in the state file.
**Never modify the original.** If no resume, proceed and detect shape during Phase 3.

### Phase 1 — Identity & contact
Collect name, contact line (`City, ST · phone · email` — no parentheticals), and links. Write
`config.md` identity fields + `output_basename` (offer the slug of their name as default) and
`master_resume.md` `### name` / `### contact` / `### links` / `### education`.

### Phase 2 — Target roles → theme stubs (declarative only)
Ask what 2–4 role families they're targeting. For each, capture a theme **name**, `Use when:`,
and `Signal keywords:`. Write these as `### variant:` stubs in `master_resume.md` **with the
Tagline/Summary lines left as TODO placeholders.** Do NOT write taglines/summaries yet.

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
Build 4–5 categories with 5–8 terms each. Apply the user's exclusions as you go (anything they
don't want surfaced goes into `config.excluded_from_skills`, not into a Skills category). Set
`### skills_order` per theme (lead each theme with its most relevant category).

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
4. Present `master_resume.md` + `config.md` for final review.
5. Set `.onboarding-state.json` `status: "complete"`.

## Completion
On `status: complete`, the Step-0 gate will route future invocations straight to the tailoring
workflow (after a profile-lint pass). The user can re-run onboarding any time to revise.
