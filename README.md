# Resume Tailor Pro

A self-onboarding Claude Code skill that tailors **your** resume to any job posting and renders
it to Word, Markdown, and PDF.

## Quick start

Invoke the skill and paste a job posting:

```
/resume-tailor-pro <paste a job-posting URL, or the job-posting text>
```

- **First run** kicks off a guided **onboarding** flow that builds your *master resume* — a single
  repository of all your experience, tagged by focus area. It can ingest your existing resume(s)
  and LinkedIn profile, then fills the gaps by interview.
- **Every run after**, give it a posting and it produces a tailored resume.

## What it does

- **Tailors to the posting.** Picks the best-matching focus area (variant), selects the strongest
  bullets, and threads the posting's exact language into the tagline, summary, bullets, and skills
  for ATS + recruiter match.
- **Outputs multiple formats.** `.docx`, `.md`, and `.pdf` (the PDF auto-opens in your default
  viewer). Defaults to a clean **one-page** resume; ask for **full mode** ("full" / "two-page")
  for an expanded 1.5–2 page version.
- **Stays honest.** An accuracy-first engine only threads keywords that genuinely describe your
  work; for roles adjacent to your real domain it produces the best honest resume and *flags the
  gaps* rather than fabricating experience. An independent reviewer pass checks every render.

## Your data

Everything personal lives in `profile/` (git-ignored, never committed):

- `profile/master_resume.md` — all your content (variants, bullets, skills). **Review this
  carefully** — it's the source of every tailored resume; edit it any time.
- `profile/config.md` — your personalization rules (excluded terms, title conventions,
  always-include roles, etc.).

Rendered resumes land in `output/<company-role-slug>/`.

## Setup

The renderer needs Node dependencies (installed automatically during onboarding):

```
cd renderer && npm install
```

PDF rendering uses headless Chrome/Chromium when available (auto-detected; set `CHROME` to
override), falling back to LibreOffice or docx2pdf. Without any converter you still get `.docx`
and `.md`.

## Re-onboarding

Say "set up my resume" any time to revise your profile; existing content is loaded and edited in
place, never overwritten.
