# config.md schema

`profile/config.md` holds the **user-specific inputs** the engine's prose procedures consume.
It is YAML frontmatter (between `---` fences) plus an optional free-form `# Notes` section.

The procedures themselves — the title classifier, excluded-term handling, always/conditional
include logic, the reviewer pass — live in `SKILL.md`. This file only supplies the data they
read. **Do not move procedures into this file.**

## Fields

### `schema_version` (int, required)
Currently `1`. The engine checks it at Step 0 (profile-lint). Lets future versions migrate.

### `name` (string, required)
Full name. Must match `master_resume.md`'s `### name`. Rendered as the resume header and,
when `output_basename` is blank, slugified into the output filename.

### `output_basename` (string, optional)
Explicit base name for rendered files, e.g. `Jane_Doe_resume` → `Jane_Doe_resume.docx/.md/.html`.
Blank ⇒ the renderer slugifies `name` (`"Jane Doe"` → `Jane_Doe_resume`). Empty name ⇒ `resume`.

### `contact_line` (string, required)
`City, ST · phone · email`. **Location in the header only — no parentheticals, no "remote
preferred."** Remote preference belongs in the summary (per the ATS parser rules in SKILL.md).

### `links` (list of {label, url}, optional)
Header links (LinkedIn, Portfolio, …). Rendered as a middle-dot-separated line.

### `specializations` (list of strings, required)
The honest list of what the user actually practices. Feeds:
- the **accuracy-first constraint** (a posting keyword naming a domain not in this list, that
  the user works only *near*, is rephrased to the closest honest descriptor — never claimed);
- the **reviewer pass** (the reviewer is told these are the real specializations and flags any
  tagline/title/summary phrase that claims something outside them).

### `excluded_from_skills` (list of strings)
Terms banned from the **Skills section and Keyword Bank**, but **allowed inside bullet text**
where they describe real work. The engine never invents a new Skills category to host an
excluded term. If a posting *hard-requires* one as a stated requirement, the engine surfaces
it in the final report rather than silently adding it.

### `term_replacements` (list of {from, to})
Jargon → honest-phrasing substitutions. When a posting uses `from`, the engine threads `to`
instead. Example: `from: "vector match optimization"`, `to: "retrieval accuracy tuning"`.

### `claimed_languages` (list of strings)
The programming language(s) the user surfaces in Skills. The engine uses a **singular** framing
and never pluralizes into "languages." Often a single entry (e.g. `["SQL"]`); may be `[]`.

### `combined_title_employer` (string) + `combined_title_first_half` (string)
**Off by default** (`combined_title_employer: ""`). Turn on ONLY when a single employer
genuinely gave the user two legitimate titles for ONE role (a slash title). When set:
- the named employer's title renders as `<combined_title_first_half> / <tailored second half>`,
  and the engine tailors only the second half per posting;
- **every other employer uses one title per role.**

Most users answer "no" to "does ONE employer give you two legitimate titles for one role?" and
leave this off.

### `genuine_domains` (list of strings)
Domains the user truly works in. A posting title **within** one of these threads directly into
the role header, **preserving the posting's seniority** (don't up- or down-level).

### `adjacent_not_in` (list of {profession, honest_equivalent})
Professions the user works adjacent to but not in, each paired with the honest title the engine
substitutes. Example: `profession: "Developer Relations"`, `honest_equivalent: "Documentation
Engineer"`.

### `always_include` (list of company-name strings)
Experience entries that are **never trimmed for space**. During page-fit, the engine trims other
content first and protects these. (A distinctive entry you always want kept as a
conversation-starter is the typical case.)

### `conditional_include` (list)
Per-mode / per-theme include rules for borderline entries. Each item:
```yaml
- company: "Acme Consulting LLC"
  include_when:
    - { mode: "default", themes: ["analytics", "devex"], rule: "INCLUDE" }
    - { mode: "default", themes: ["evals", "knowledge_systems"], rule: "OMIT" }
    - { mode: "full", themes: "all", rule: "INCLUDE" }
```
`mode` is `default` | `full`; `themes` is a list of theme names or `"all"`; `rule` is
`INCLUDE` | `OMIT`. The engine evaluates these in step 7 (assembly) and step 9 (page-fit).

### `summary_openers` (list of strings)
Safe opener title(s) the summary may lead with — only titles genuinely held or honest role
descriptors. **Never a title the user has not held.** A pattern with `<focus>` (e.g.
`"Documentation engineer specializing in <focus>"`) signals the engine may fill `<focus>` from
a real specialization when a themed posting calls for it.

## `# Notes` section
Optional free-form prose after the frontmatter for context that doesn't fit a field.
