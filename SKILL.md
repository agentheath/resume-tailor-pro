---
name: resume-tailor-pro
description: Distributable, self-onboarding resume tailoring engine. On first run it interviews you to build your own master resume and personalization rules; thereafter it tailors your resume to any job posting and renders a Word + Markdown + PDF. Use when the user wants to set up a resume profile from scratch ("set up my resume," "onboard me"), or — once set up — provides a job posting (URL or pasted text) and asks for a tailored resume, asks to "apply" or "customize my resume" for a role, wants help picking which version to use, or wants cover-letter material tied to a posting. All content lives in one per-user master file of tagged bullets; the skill selects the best combination for the posting, threads the posting's language honestly, and renders. Optimized for the single-anchor individual-contributor professional; degrades gracefully for other histories. (Note: this is the generalized, distributable fork of the personal resume-tailor skill — they are independent; install one or the other.)
---

# Resume Tailor Pro

## What this skill does

A two-part skill:

1. **Onboarding (first run).** Interviews the user to generate their own `profile/master_resume.md`
   (content) and `profile/config.md` (personalization rules). See `references/onboarding.md`.
2. **Tailoring (every run after).** Takes a job posting (URL or text) and produces a tailored
   resume in Word, Markdown, and PDF. All resume content lives in `profile/master_resume.md` —
   summaries, bullets, skills, shared content — each tagged by variant theme and priority. The
   engine reads the posting, picks a variant theme, selects the right bullets, threads the
   posting's language into the output, and renders.

The **engine** (this file) is universal prose. The **profile** (`profile/config.md` +
`profile/master_resume.md`) supplies the user-specific inputs the engine operates over. The
engine never hard-codes a name, title, or term list — those come from the profile.

**Two tailoring modes:**

- **Default (one-page).** Selects all priority-1 and priority-2 bullets for the chosen variant.
  Step 9 trims to one page if needed. Uses the "default" version of each bullet. Optimized for
  recruiter screening and ATS.
- **Full (--full).** Selects priority-1, -2, and -3 bullets, using each bullet's "full" version
  where one exists (falling back to "default" when it doesn't). Typically 1.5–2 pages. For
  referral submissions and direct-to-hiring-manager sends.

**How to trigger full mode:** the user says "full," "long version," "two-page," "don't trim,"
"include everything," or similar. If unclear, default to one-page.

## Step 0 — Onboarding gate + profile lint

**Run this first, on every invocation, before any tailoring work.**

1. Read `profile/.onboarding-state.json`.
   - **Missing, or `status` ≠ `"complete"`** → the profile isn't ready. Run or resume
     onboarding from `last_completed_phase` per `references/onboarding.md`. Do not attempt to
     tailor. (File-existence is NOT the signal — a half-built `master_resume.md` exists during
     onboarding; the state file is authoritative.)
   - **`status` == `"complete"`** → continue to step 2.
2. Run `references/profile-lint.md` over `profile/config.md` + `profile/master_resume.md`. If any
   hard check fails, **block**: report the specific failures and tell the user to re-run
   onboarding or hand-fix, then re-invoke. Do not render. If lint passes (warnings OK), proceed
   to the Workflow.

If the user explicitly asks to set up or redo their profile, jump straight to onboarding
regardless of state.

## Core Principle: Accuracy First, Then Mirror the Posting's Language

**Accuracy is the hard constraint. Keyword mirroring operates within it.**

Every keyword threaded into the resume must describe something the user genuinely does. A
keyword that describes a professional domain the user works *near* but not *in* must not appear
in the tagline or summary as if it describes their specialization. The closest honest descriptor
replaces it. The user's genuine specializations are listed in `config.md` `specializations`; the
professions they work adjacent-to (with honest equivalents) are in `adjacent_not_in`.

Within that constraint, use the posting's exact vocabulary wherever it honestly applies. ATS
systems match on exact terms; recruiters' eyes catch the words they just wrote.

Examples (the principle, not user-specific):
- posting says "knowledge quality" and the user does that work → use "knowledge quality," not a
  near-synonym.
- posting says "evaluation pipelines" → use "evaluation pipelines," not an abbreviation.
- posting uses a full phrase like "retrieval-augmented generation" → use the full phrase at least
  once, not just the acronym.
- posting's domain is a profession the user only works adjacent to (it's in `adjacent_not_in`) →
  rephrase to the honest equivalent rather than claiming the domain.

**Where to thread keywords:** tagline, summary, bold lead-ins on bullets, skills labels and
values. The facts stay; the phrasing adapts.

## ATS Optimization Principles

Modern ATS is a two-stage system: (1) a deterministic parser extracts structured fields, (2) ML /
recruiter search queries those fields. Both matter.

**The 6 fields the parser scores hardest — always ensure these are clean:**

- **Location:** `City, ST` in the header only — no parentheticals, no "remote preferred." Move
  remote preference to the summary (e.g. "remote preferred" + an explicit years-remote figure).
- **YOE:** State years of experience explicitly in the summary. Don't make the parser do
  arithmetic on date ranges.
- **Latest employer:** Spell exactly as the company refers to itself — no informal variants.
- **Latest title:** One title per role **unless** `config.md` enables combined titles for a
  specific employer (`combined_title_employer` + `combined_title_first_half`). When enabled for
  that employer, render `<first_half> / <tailored second half>` — both halves real titles for the
  same role — and tailor only the second half per posting (see step 6). Every other employer uses
  one title.
- **Email:** Standard format, no tricks.
- **Phone:** Standard format.

The renderer handles font, layout, section headings, bullet characters, and PDF output
automatically — no agent action required for those.

**Date format: always hyphens, not en/em-dashes:**
- Correct: "Nov 2021 - Present"
- Wrong: "Nov 2021 – Present" (en-dash can choke older parsers)
- Always "Present" for the current role. Abbreviated month + year throughout ("Nov 2021").

**Skills section:**
The Skills section is its own indexed surface recruiters search directly. Use the
controlled-vocabulary terms in `master_resume.md`'s Skills section. When keyword-threading from a
posting, add the posting's exact skill term only if it matches real experience and passes the
Content Constraints below.

**Skills section density cap:** Keep each skill value to **5–8 terms**, not 12+. A leaner skills
section enables a richer experience section. If skills density is crowding out experience bullets
on a default one-page render, trim skills values before trimming bullets.

**What to avoid in spec assembly:**
- "Open to remote" in the header contact line — move to summary.
- En-dashes in dates — use hyphens.

## Voice and Style

These rules apply to every render regardless of posting or variant.

- **All bullets must be uniform past tense.** Even for ongoing work, render as past tense
  ("Built and operated…"). Mixing tenses reads as sloppy.
- **Product/model naming:** name the product/model without version numbers; specific versions go
  stale fast.
- **Big absolute numbers need a time anchor.** Scope them to a period ("In a single quarter,
  processed 35,724…"). Without scope, large numbers read as career-totals and lose impact.
- **pp/percentage lifts need context.** Say what the lift was achieved on.
- **Title fidelity for non-anchor roles.** Render each prior role's title exactly as the user
  held it — never a combined form (combined titles apply only to the configured anchor employer,
  if any).
- **Tagline punctuation:** Middle dots (·) separate the tagline phrases. No commas, no slashes.
- **Tagline authenticity:** The tagline adapts the user's actual expertise toward the posting's
  emphasis — it does not wholesale adopt the posting's vocabulary. Acceptable adaptations move the
  emphasis of real work; they don't claim new specializations. Apply the accuracy-first
  constraint: if no honest adaptation fits a posting keyword, omit it rather than forcing it.
- **No deliverable-type specializations in the tagline.** The tagline names what the user
  *specializes in*, not individual document/output formats they have produced. Deliverable/format
  labels belong in the Skills section and in bullet/summary body text, where they read as
  keywords describing real work rather than as a claimed specialty. The tagline should name
  domains/practices the user genuinely specializes in (drawn from `config.specializations`). When
  a posting centers on a deliverable type, thread that deliverable into the summary and Skills
  instead of the tagline.
- **Summary opener:** Never lead with a title the user has not held. Use only the openers in
  `config.summary_openers`. Two acceptable patterns:
  1. A bare honest role descriptor (always safe).
  2. "`<role descriptor>` specializing in `<focus>`" — preferred for themed postings, where
     `<focus>` names a real specialization from `config.specializations`. If the posting's domain
     doesn't map to a real specialization, use pattern 1 and thread posting keywords into the
     summary body instead.

  The posting's actual title still drives the *tagline* and the *role header* per step 6 — but not
  the summary opener.

## Content Constraints

These rules apply to every render. Check them during step 6 (keyword threading) and step 10
(reviewer pass). The lists come from `config.md`; the handling rules below are engine behavior.

**Terms excluded from the Skills section** (`config.excluded_from_skills`). Never add these to
Skills regardless of what the posting asks for. They MAY appear inside bullet text describing
actual work, but not as standalone Skills entries. **Do not invent a new skill category to host
them.**

**Jargon substitutions** (`config.term_replacements`). When a posting uses a `from` term, thread
its honest `to` phrasing instead — never the `from` term.

**Claimed languages** (`config.claimed_languages`). Surface only these language(s) in Skills, using
a **singular** framing. Do not use plural framings like "languages" unless the user genuinely
claims several.

**If a posting hard-requires an excluded item as a stated requirement:** surface it in the final
report so the user can decide whether to address it in a cover letter or pass on the role. Never
silently add it back.

## Workflow

1. **Get the posting.** If the user gave a URL, fetch it. If they pasted text, use that. If
   neither, ask. If the fetched content is empty, contains a login prompt, or appears to be a
   JavaScript-rendered shell with no readable job text, stop and ask the user to paste the posting
   text directly.

2. **Extract keywords, theme weights, and output slug.** Read the posting and produce three
   internal outputs (not yet surfaced):

   **a) Keyword list (10–20 items).** The posting's exact nouns, noun phrases, and verb phrases
   describing the work. Prefer multi-word phrases. Include role-defining phrases, technical terms,
   outcome language, stack terms named in the posting (honor Content Constraints when threading
   into Skills), and soft-skill/culture signals.

   **b) Theme weights.** Rough percentage weights across the user's defined variant themes based
   on the posting's emphasis.

   **c) Output directory slug.** Derive from company + role title: lowercase, spaces and
   punctuation → hyphens, truncated to ~50 chars (e.g. `anthropic-developer-education-lead`). If
   `output/<slug>/` exists, append `-2`, `-3`, … and note the collision in the report. Create it
   with `mkdir -p output/<slug>/` before writing anything.

3. **Pick a variant theme.** Read the `Variant Definitions` section of `master_resume.md`. Each
   variant has `Use when:` and `Signal keywords:`. Match against the posting and choose the single
   closest. On ties, prefer the theme whose signal keywords overlap the posting most; if still
   tied, prefer the theme the user marked first in the file.

4. **Select bullets.** From the `Bullets` section, select all bullets whose `variants` list
   includes the chosen theme.
   - **Default mode:** all priority-1 and priority-2 bullets for the theme (a bullet with no
     stated priority for the theme defaults to 2). Step 9 handles overflow. Skip priority-3.
   - **Full mode:** priority-1, -2, and -3.
   - Use each bullet's "default" version in default mode; in full mode use "full" where present,
     else "default."
   - Order by priority (1 first), then by file order.
   - **Hybrid theme renders:** see Edge Cases — P1 bullets from both themes; P2 from the primary
     theme only.

5. **Consider extras.** Scan the `Extras` section. Each extra has `tags:`. For each: does a tag
   match the posting's signal phrases, and does it strengthen the resume relative to an
   already-selected bullet? Pick at most 3 swaps; each replaces exactly one selected bullet
   (prefer swapping a P2 before a P1). Extras are never additive — the page budget doesn't grow.
   Entries flagged `always_include` in config are not swap targets. If nothing clearly beats
   what's selected, swap nothing.

6. **Thread posting keywords.** The critical tailoring pass. Apply the accuracy-first constraint
   throughout — only thread keywords that honestly describe the user's work. Refer to Content
   Constraints for excluded terms / substitutions.

   **Role header (anchor role).** Apply the title classifier. First decide: is the posting's title
   in a domain the user genuinely works in (`config.genuine_domains`), a distinct profession they
   work adjacent to (`config.adjacent_not_in`), or a management/PM/SWE role?

   - **Within a genuine domain → thread directly,** preserving the posting's seniority (don't
     up- or down-level). If combined titles are enabled for the anchor employer, the threaded
     title becomes the second half: `<combined_title_first_half> / <posting title>`. Otherwise it
     replaces the anchor role's single title.
   - **Adjacent-but-distinct profession → use the honest equivalent** from
     `config.adjacent_not_in` (e.g. a "Developer Relations" posting → the configured equivalent),
     not the posting's title.
   - **Management / Product / Software Engineering role the user hasn't held** → produce the best
     honest resume and **surface a note** in the report that the posting requires experience the
     user doesn't have; let them decide whether to apply.
   - **Doesn't map cleanly** → default to the user's most general honest title (the first entry of
     `config.genuine_domains` or the default role descriptor).

   **Tagline.** Start from the chosen variant's base tagline. Adapt individual phrases toward the
   posting's emphasis, but only where the posting's vocabulary honestly describes the user's work.
   When in doubt, keep the variant's base phrase.

   **Summary.** Thread 3–5 posting keywords. Rephrase domain labels that are distinct professions
   toward the honest adjacent descriptor. Open with a `config.summary_openers` title only.

   **Bullet lead-ins (bold text).** Adjust the bold lead phrase on 2–4 bullets to echo the
   posting's verb or noun phrases.

   **Skills section.** Add posting terms only if accurate and not excluded by Content Constraints;
   apply `term_replacements`. Reorder to lead with the posting's most-emphasized terms, using the
   `skills_order` guidance in the master file for the base ordering. Keep each value to 5–8 terms.

   **General keyword threading rules:**
   - NEVER fabricate experience. Only rephrase real work.
   - Prefer the posting's multi-word phrases over abbreviations.
   - Don't force every keyword; 10–15 naturally threaded beats 20 awkwardly crammed.
   - The result should read like fluent prose, not keyword-stuffed SEO copy.

7. **Assemble the spec.** Build a JSON spec matching the Spec Schema, combining:
   - the keyword-adapted tagline, summary, and skills;
   - the selected + threaded bullets as the anchor experience section;
   - the non-anchor experience entries from the Shared section, subject to `config.always_include`
     and `config.conditional_include` (evaluate each conditional entry against the current
     mode + chosen theme);
   - education from the Shared section.

   Merge all roles — anchor first, then other experience in order — into a single `"experience"`
   array. Include `output_basename` from config if set. Write the spec to `output/<slug>/spec.json`.

8. **Render.** Run the renderer and **capture the basename from its stdout** — `render.js` prints
   `Wrote <dir>/<basename>.docx` (and `.md`/`.html`); it does NOT print a bare basename, so derive
   it by stripping the directory and the `.docx` extension:
   ```bash
   ABS="$(pwd)/output/<slug>"
   OUT="$(node renderer/render.js output/<slug>/spec.json output/<slug>/)"
   echo "$OUT"
   # Derive BASE from the "Wrote …/<BASE>.docx" line (config.output_basename, else a slug of the
   # name, else "resume"):
   BASE="$(printf '%s\n' "$OUT" | sed -n 's/^Wrote .*\/\([^/]*\)\.docx$/\1/p' | head -n1)"
   ```
   This writes `$ABS/$BASE.docx`, `$BASE.md`, and `$BASE.html`. The `.html` is the source for the
   PDF. `$ABS` (absolute output dir) and `$BASE` are reused by every command below — always use
   the absolute `$ABS/$BASE.*` form so cwd changes don't break paths.

   **Detect Chrome (default, preferred PDF path).** Chrome renders the HTML faithfully (flexbox
   header, flush-right dates, `nowrap` tagline). Detect it portably:
   ```bash
   detect_chrome() {
     if [ -n "$CHROME" ] && [ -x "$CHROME" ]; then echo "$CHROME"; return; fi
     for c in \
       "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
       "/Applications/Chromium.app/Contents/MacOS/Chromium" \
       "/usr/bin/google-chrome" "/usr/bin/google-chrome-stable" \
       "/usr/bin/chromium" "/usr/bin/chromium-browser" \
       "/opt/google/chrome/chrome" \
       "/c/Program Files/Google/Chrome/Application/chrome.exe" \
       "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"; do
       [ -x "$c" ] && { echo "$c"; return; }
     done
     for n in google-chrome google-chrome-stable chromium chromium-browser chrome; do
       command -v "$n" >/dev/null 2>&1 && { command -v "$n"; return; }
     done
   }
   CHROME_BIN="$(detect_chrome)"
   if [ -n "$CHROME_BIN" ]; then
     "$CHROME_BIN" --headless=new --disable-gpu --no-pdf-header-footer \
       --print-to-pdf="$ABS/$BASE.pdf" "file://$ABS/$BASE.html"
   else
     echo "Chrome/Chromium not found — using fallback (see below)."
   fi
   ```
   Set `CHROME` in the environment to override detection. `--no-pdf-header-footer` suppresses
   Chrome's default header/footer; `@page` size and margins are set in the renderer's CSS.

   **Optional visual check.** To eyeball layout before delivery, screenshot the HTML, Read the
   PNG, then delete it:
   ```bash
   "$CHROME_BIN" --headless=new --disable-gpu --hide-scrollbars \
     --force-device-scale-factor=2 --window-size=816,1056 \
     --screenshot="$ABS/_preview.png" "file://$ABS/$BASE.html"
   ```

   **Why Chrome, not office converters.** Some `.docx` converters silently drop tab stops and
   mangle borderless tables, which breaks same-line right-aligned dates. The `.docx` itself is
   still correct in Word/Google Docs — but the delivered **PDF is generated from the HTML via
   Chrome.** Expect the PDF and DOCX to look very close but not pixel-identical.

   **Fallbacks if no Chrome/Chromium** (try in order; each is lower-fidelity for this layout):
   ```bash
   # LibreOffice headless — honors tab stops and tables. Names the PDF after the input file.
   soffice --headless --convert-to pdf --outdir "$ABS" "$ABS/$BASE.docx"

   # docx2pdf — requires Microsoft Word installed.
   docx2pdf "$ABS/$BASE.docx" "$ABS/$BASE.pdf"
   ```
   If none are available, deliver the `.docx` + `.md` and note in the report that no PDF could be
   generated in this environment.

9. **Verify page fit.** "Re-render" here means re-run **both** `node renderer/render.js` (to
   regenerate the HTML) **and** the Chrome `--print-to-pdf` conversion, since the PDF comes from
   the HTML.
   - **Default mode:** check the PDF page count:
     ```bash
     python3 -c "
     import re
     data = open('$ABS/$BASE.pdf','rb').read()
     print(len(re.findall(rb'/Type\s*/Page[\s/]', data)))
     "
     ```
     If more than 1, work through the trim steps in order, re-rendering after each, stopping as
     soon as it fits. Apply at most 2 re-renders total; if still over, proceed and note overflow.
     1. Drop the last priority-2 bullet; re-render. Repeat per remaining P2 until fit or none left.
     2. Drop any `conditional_include` entry that the current mode/theme would only marginally
        include; re-render.
     3. Trim the longest priority-1 bullet by one sentence; re-render.
     **Never drop or trim an entry flagged `always_include` in config.**
   - **Full mode:** skip the one-page check. Verify no orphaned single line on the last page
     (fewer than 3 lines → trim one bullet slightly). The `always_include` rule still applies.

10. **Independent reviewer pass.** Before presenting anything, use the Agent tool
    (`subagent_type: "claude"`) to spawn a subagent whose sole job is to review the rendered
    resume. **Single correction round — do not loop.**

    Pass the reviewer:
    - the full text of `output/<slug>/<basename>.md`;
    - the full text of the job posting;
    - the user's actual specializations from `config.specializations`;
    - the excluded terms from `config.excluded_from_skills`.

    Ask the reviewer to answer and return a structured list — report only, do not rewrite:
    1. Does any phrase in the tagline, title, or summary claim a specialization or domain the
       candidate doesn't actually practice (per the provided specializations)? Quote verbatim.
    2. Does any skill value exceed 8 terms? List offending lines.
    3. Are any excluded skill terms present (per the provided excluded list)?
    4. Are all bullets in past tense?
    5. Do any bullets with large absolute numbers lack a time scope?
    6. Does the resume represent the candidate honestly, or stretch into territory they can't
       defend in an interview?
    7. Any other rule violations to address before delivery.

    After findings: apply corrections to `output/<slug>/spec.json`, re-render, re-export the PDF,
    then re-run the step 9 page-fit check (corrections can add length). If a finding is unfixable
    in this render (it's baked into the master file), note it in the report and proceed — don't
    block delivery. No issues → go to step 11.

11. **Report and present.** Show the user:
    ```
    Mode: <default (1-page) | full>
    Variant: <name> (matched on: <2-3 phrases from posting>)
    Bullets selected: <list of bullet IDs, with priority levels>
    Keywords threaded: <list of 8-12 posting phrases now in the resume>
    Extras swapped in: <list, or "none">
    Cuts: <any trimmed content from step 9, or "none">
    Slug collision: <note if prior render existed, or "none">
    Reviewer findings: <summary of what was flagged and corrected, or "none">
    Hard-requirement gaps: <excluded items or domain mismatches the posting requires, or "none">
    ```
    Then present `output/<slug>/<basename>.docx`, `<basename>.md`, and `<basename>.pdf` (in that
    order). For multiple postings processed serially: report each summary in sequence; present
    each posting's files separately.

    **Auto-open the PDF.** After presenting, open the finished PDF in the user's default PDF
    application, then print a one-line note (`Opened <basename>.pdf in your default PDF viewer.`)
    so it isn't surprising. **Guards:**
    - Only if a PDF was actually generated (skip on the no-Chrome-and-no-fallback path).
    - **Single posting only.** When the request had more than one posting (serial processing),
      open **none** and instead print the output paths — avoids a flurry of windows.

    Use the **absolute** path `$ABS/$BASE.pdf` (cwd after rendering is the skill root, not the
    output dir) and detect the OS — don't assume macOS. Reuse the same platform signals the Chrome
    block uses:
    ```bash
    PDF="$ABS/$BASE.pdf"
    [ -f "$PDF" ] || { echo "No PDF generated — skipping auto-open."; exit 0; }
    case "$(uname -s)" in
      Darwin)            open "$PDF" ;;
      Linux)
        if grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null; then           # WSL
          WPDF="$(wslpath -w "$PDF")"
          wslview "$PDF" 2>/dev/null || cmd.exe /c start "" "$WPDF"
        else                                                                    # native Linux
          xdg-open "$PDF" 2>/dev/null || gio open "$PDF"
        fi ;;
      MINGW*|MSYS*|CYGWIN*)                                                     # Git Bash / MSYS
        WPDF="$(cygpath -w "$PDF")"; start "" "$WPDF" 2>/dev/null || cygstart "$PDF" ;;
      *) echo "Unknown OS — open $PDF manually." ;;
    esac
    ```
    (In a PowerShell context rather than a POSIX shell, the equivalent is `Start-Process "$PDF"`.)

## Spec Schema

The renderer (`renderer/render.js`) takes a JSON spec at this schema. Referenced in step 7.

```json
{
  "name": "Jane Doe",
  "output_basename": "Jane_Doe_resume",
  "tagline": "Phrase One · Phrase Two · Phrase Three",
  "contact_line": "City, ST · 555.123.4567 · you@example.com",
  "links": [
    {"label": "LinkedIn", "url": "https://www.linkedin.com/in/..."},
    {"label": "Portfolio", "url": "https://..."}
  ],
  "summary": "string (one paragraph)",
  "experience": [
    {
      "title": "string (one title, or combined form for the configured anchor employer)",
      "company": "string",
      "location": "string",
      "dates": "Mon YYYY - Present",
      "bullets": ["string with **bold** spans allowed", "..."]
    }
  ],
  "skills": [
    {"label": "Category", "value": "5–8 terms, comma-separated"}
  ],
  "education": "**Degree** — Institution, City, ST"
}
```

`output_basename` is optional — when omitted the renderer slugifies `name`. `**bold**` spans in
bullets and skill values render as bold runs in Word and `**bold**` in Markdown. Skill label order
should follow the `skills_order` guidance in `master_resume.md` for the chosen variant.

## Files in This Skill

- `profile/config.md` — user-specific personalization inputs (gitignored; generated by
  onboarding). Schema in `references/config-schema.md`.
- `profile/master_resume.md` — all resume content: shared info, variant definitions, tagged
  bullets, extras, skills (gitignored; generated by onboarding). Schema in
  `references/master-resume-schema.md`.
- `profile/.onboarding-state.json` — completeness tracker the Step-0 gate reads.
- `references/onboarding.md` — the interview + profile-generation flow.
- `references/profile-lint.md` — validation rules run at Step 0 and end of onboarding.
- `references/resume-ingest-contract.md` — self-contained parse contract for an existing resume.
- `templates/` — blank scaffolds copied into `profile/` on first run.
- `renderer/render.js` — Node script that takes a JSON spec and writes `<basename>.docx`,
  `<basename>.md`, `<basename>.html`. The `.html` carries the print CSS and is the PDF source.
- `output/<slug>/` — per-render output (gitignored): spec.json + the rendered files.

## Edge Cases

- **Posting is vague or matches no variant well.** Pick the closest theme; tell the user the
  match was weak and offer to try a different variant manually.
- **Posting describes a role clearly outside the user's domain.** Surface that observation rather
  than producing a stretched resume.
- **Posting is in an adjacent-but-distinct profession** (one in `config.adjacent_not_in`). Lead
  with what the user genuinely brings, use the honest-equivalent title, and note the domain gap in
  the report so they can address it in a cover letter.
- **Posting emphasizes management/EM/PM/SWE the user hasn't done.** Produce the best honest resume
  and surface a note that the candidate is IC-strong without that experience.
- **Posting spans two themes.** Pick the primary theme for summary/tagline. Pull P1 bullets from
  both themes and P2 from the primary only; treat the combined P1 set as one pool and apply the
  step 9 trim order if it overflows. Note the hybrid approach in the report.
- **Multiple postings at once.** Process serially; each gets its own slug directory; report each
  summary in sequence; present each posting's files separately.
- **User asks to see all variants without picking one.** Use default mode. Render each variant
  using its priority-1 bullets only (to keep each manageable); apply the step 9 page-fit check per
  variant. Present each.
- **Non-anchor profile shape (multi-role / new-grad).** `anchor_role_header` may be blank; assemble
  from `other_experience` and don't assume a dominant employer. The title classifier still applies
  to the most relevant/most recent role. v1 is optimized for single-anchor — degrade gracefully,
  don't crash.

## Renderer Dependencies (One-Time Setup)

Onboarding Phase 7 runs these up front; otherwise run once when setting up a new environment (only
re-run if `node renderer/render.js` fails with a module-not-found error):

```bash
cd renderer && npm install
```

**PDF conversion.** The default path uses headless Chrome/Chromium, detected portably in step 8
(set the `CHROME` env var to override). If none is present, install Chrome, or rely on the step-8
fallbacks (LibreOffice is the best non-Chrome fallback because it also honors tab stops and
tables). If no converter exists at all, the skill still delivers the `.docx` + `.md` and notes the
missing PDF in the report.
