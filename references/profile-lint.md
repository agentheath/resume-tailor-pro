# profile-lint

A cheap consistency pass over `profile/config.md` + `profile/master_resume.md`. Run it:

- at **SKILL.md Step 0**, on every tailoring run (after the gate confirms onboarding is
  `complete`), and
- at the **end of onboarding** (Phase 7), before the test render.

The engine maintains these invariants automatically only if the profile is internally
consistent; this catches the cases where a hand-edit or an incomplete onboarding left it broken,
so the tailoring flow never renders garbage.

## Checks

Run all checks, collect every failure (don't stop at the first), then report.

1. **schema_version** — `config.md` frontmatter `schema_version` and `master_resume.md`'s
   `<!-- schema_version: N -->` both equal the engine's expected version (currently `1`).
   Mismatch ⇒ fail with a migration note.

2. **name match** — `config.md` `name` equals `master_resume.md` `### name`.

3. **every theme has a priority-1 bullet** — for each `### variant:` defined, at least one
   bullet lists that theme in `variants` with priority `1`. (A theme with no P1 bullet renders
   an empty experience section for postings that match it.)

4. **every bullet's `variants` references a defined theme** — each theme named in any bullet's
   `variants:` (and each key in its `priority:` map) must correspond to a defined
   `### variant:`. Catches bullets tagged to a renamed/deleted theme.

5. **skills_order is complete** — `### skills_order` lists, for each theme, every `###
   <Category>` defined under `## Skills` (no missing or unknown categories).

6. **no excluded term in Skills** — no term in `config.md` `excluded_from_skills` appears as a
   value in any `## Skills` category or in the `## Keyword Bank`. (Excluded terms may still
   appear in bullet text — only Skills/Keyword Bank are checked.)

7. **summary openers are sane** — `config.md` `summary_openers` is non-empty, and each variant
   `Summary:` opens with one of them (or a `<focus>`-filled form of one). Warn (don't hard-fail)
   if a summary opens with a title not derivable from `summary_openers`.

8. **config references resolve** — companies named in `always_include` / `conditional_include`
   exist in `master_resume.md` (`anchor_role_header` or `other_experience`). Adjacent/genuine
   domain lists are free-form (no cross-check).

## Reporting and behavior

- **In onboarding (Phase 7):** report each failure specifically (which theme, which bullet,
  which term) and **offer to fix** it interactively, then re-lint.
- **In tailoring (Step 0):** if any **hard** check (1–6, 8) fails, **block** the run — print the
  specific failures and tell the user to re-run onboarding or hand-fix, then re-invoke. Do NOT
  proceed to render. Check 7 is a warning and does not block.

Each reported failure names the exact location and the fix, e.g.:
- `Theme "analytics" has no priority-1 bullet — promote a bullet to priority {analytics: 1} or
  remove the theme.`
- `Bullet "predictive_finding" references undefined theme "devrel" — fix its variants/priority
  or define the theme.`
- `Excluded term "Python" appears in Skills category "Data & Analytics" — remove it (it may stay
  in bullet text).`
