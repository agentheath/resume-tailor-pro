---
# config.md — personalization rules for resume-tailor-pro
# This file holds the USER-SPECIFIC INPUTS the engine's procedures operate over.
# The procedures themselves (title classifier, excluded-term handling, etc.) live
# in SKILL.md. See references/config-schema.md for the full field documentation.
#
# Onboarding generates this file. You can hand-edit it any time; re-run profile-lint
# after edits (the tailoring flow runs it automatically on every run).

schema_version: 1

# ---- Identity ----
name: ""                      # "Jane Doe"
output_basename: ""           # optional; e.g. "Jane_Doe_resume". Blank -> slug of name.
contact_line: ""              # "City, ST · 555.123.4567 · you@example.com"  (no parentheticals)
links:
  - label: "LinkedIn"
    url: ""
  # - label: "Portfolio"
  #   url: ""

# ---- Specializations ----
# The honest list of what you ACTUALLY practice. Feeds the accuracy-first constraint
# and the reviewer pass. Keep these defensible in an interview.
specializations: []
  # - "data engineering"
  # - "analytics"

# ---- Excluded terms (three distinct sub-fields — do not flatten) ----
# Terms banned from the Skills section + Keyword Bank, but ALLOWED inside bullet text
# where they describe real work. The engine never invents a new Skills category to host them.
excluded_from_skills: []
  # - "Python"
  # - "React"

# Jargon -> honest-phrasing substitutions. When a posting uses the left term, the engine
# threads the right term instead (never the left).
term_replacements: []
  # - from: "vector match optimization"
  #   to:   "retrieval accuracy tuning"

# The one (or few) programming language(s) you surface in Skills. Use a SINGULAR framing;
# the engine will not pluralize into "languages". Leave [] if you surface none.
claimed_languages: []
  # - "SQL"

# ---- Title conventions (inputs to the title classifier in SKILL.md) ----
# Most users leave combined-title OFF: one title per role. Turn it on ONLY if a single
# employer genuinely gave you two legitimate titles for ONE role (e.g. a slash title).
combined_title_employer: ""        # "" = off. Else the exact employer name this applies to.
combined_title_first_half: ""      # the fixed first half, e.g. "Information Solutions Engineer"

# Domains you TRULY work in. A posting title within one of these threads directly
# (preserving the posting's seniority).
genuine_domains: []
  # - "documentation"
  # - "knowledge systems"

# Professions you work ADJACENT to but not in — with the honest equivalent the engine
# substitutes when a posting uses the adjacent title.
adjacent_not_in: []
  # - profession: "Developer Relations"
  #   honest_equivalent: "Documentation Engineer"

# ---- Experience inclusion rules ----
# Experience entries (by company name) that are NEVER trimmed for space.
always_include: []
  # - "Acme Museum"

# Per-mode / per-theme include rules for borderline entries. mode: default | full | both.
# themes: list of theme names, or "all".
conditional_include: []
  # - company: "Acme Consulting LLC"
  #   include_when:
  #     - { mode: "default", themes: ["analytics", "devex"], rule: "INCLUDE" }
  #     - { mode: "default", themes: ["evals", "knowledge_systems"], rule: "OMIT" }
  #     - { mode: "full", themes: "all", rule: "INCLUDE" }

# ---- Summary openers ----
# Safe opener title(s) you may lead the summary with — only titles you have genuinely held
# or honest role descriptors. Never a title you have not held.
summary_openers: []
  # - "Documentation engineer"
  # - "Documentation engineer specializing in <focus>"
---

# Notes

Free-form notes about your personalization rules (optional). Anything the engine should
keep in mind that doesn't fit a field above. Onboarding may record context here.
