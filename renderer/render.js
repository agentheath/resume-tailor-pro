#!/usr/bin/env node
/*
 * render.js — Resume renderer for the resume-tailor-pro skill.
 *
 * Usage:  node render.js spec.json output/
 *
 * Reads a JSON spec (schema documented in SKILL.md) and writes three files whose
 * base name is derived from the spec (spec.output_basename, else a slug of
 * spec.name, else "resume"):
 *   output/<basename>.docx
 *   output/<basename>.md
 *   output/<basename>.html
 *
 * Design constraints (kept in lockstep with SKILL.md's ATS + voice rules):
 *   - Single-column layout, Calibri font, US Letter, 1" margins (slightly
 *     tightened top/bottom to help one-page fit).
 *   - Standard section headings: Summary, Experience, Skills, Education.
 *   - Bullets use docx numbering with the "•" glyph (never literal unicode runs).
 *   - Dates are passed through verbatim from the spec (hyphen format enforced
 *     upstream by the skill). The renderer additionally normalizes any stray
 *     en/em dash in a dates field to a hyphen as a safety net.
 *   - "**bold**" spans inside summary, bullets, and skill values become bold runs
 *     in Word and Markdown ** in the .md output.
 *   - No headers/footers, no tables, no images.
 */

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  LevelFormat, BorderStyle, ExternalHyperlink, HeadingLevel,
  Table, TableRow, TableCell, WidthType, VerticalAlign,
} = require("docx");

// A borderless table is the only layout primitive Pages/LibreOffice/Word all
// honor for "left text ........ right-aligned dates" on one line; paragraph tab
// stops are dropped by Pages on docx export.
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = {
  top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER,
  insideHorizontal: NO_BORDER, insideVertical: NO_BORDER,
};
const ZERO_MARGINS = { top: 0, bottom: 0, left: 0, right: 0 };

// ---------- helpers ----------

function die(msg) {
  console.error("render.js error: " + msg);
  process.exit(1);
}

// Normalize en/em dashes to hyphen in date strings (ATS safety net).
function fixDashes(s) {
  return (s || "").replace(/\s*[\u2013\u2014]\s*/g, " - ");
}

// Parse "**bold**" spans into an array of {text, bold} segments.
function parseBold(text) {
  const segments = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index), bold: false });
    segments.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), bold: false });
  if (segments.length === 0) segments.push({ text: text, bold: false });
  return segments;
}

// Build an array of TextRun from a string with optional **bold** spans.
function runsFromText(text, opts = {}) {
  return parseBold(text).map(seg => new TextRun({
    text: seg.text,
    bold: seg.bold || opts.bold || false,
    italics: opts.italics || false,
    font: FONT,
    size: opts.size || BODY_SIZE,
    color: opts.color || undefined,
  }));
}

// ---------- HTML helpers (for Chrome --print-to-pdf path) ----------

function escapeHtml(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// "**bold**" spans -> <strong>… ; everything else HTML-escaped.
function htmlFromText(text) {
  return parseBold(text)
    .map(seg => seg.bold ? `<strong>${escapeHtml(seg.text)}</strong>` : escapeHtml(seg.text))
    .join("");
}

function buildHtml(spec) {
  const links = (Array.isArray(spec.links) ? spec.links : [])
    .map(l => `<a href="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a>`)
    .join('<span class="dot"> · </span>');

  const experience = spec.experience.map(job => {
    const dates = job.dates ? `<span class="job-dates">${escapeHtml(fixDashes(job.dates))}</span>` : "";
    const bullets = (job.bullets || []).map(b => `<li>${htmlFromText(b)}</li>`).join("");
    return `<div class="job">
      <div class="job-header">
        <span class="job-title"><strong>${escapeHtml(job.title)}</strong> — ${escapeHtml(job.company)}</span>
        ${dates}
      </div>
      <ul>${bullets}</ul>
    </div>`;
  }).join("");

  const skills = spec.skills.map(s =>
    `<div class="skill"><span class="skill-label">${escapeHtml(s.label)}:</span> ${htmlFromText(s.value)}</div>`
  ).join("");

  const education = spec.education
    ? `<h2 class="section">Education</h2><div class="education">${htmlFromText(spec.education)}</div>`
    : "";

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(spec.name)}</title>
<style>
  @page { size: letter; margin: 0.5in 0.75in; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Calibri', 'Carlito', 'Helvetica Neue', Arial, sans-serif;
    font-size: 10.5pt; line-height: 1.2; color: #000;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .name { text-align: center; font-weight: 700; font-size: 19pt; margin: 0 0 1pt; }
  .tagline { text-align: center; color: #404040; margin: 0 0 1pt; font-size: 10pt; white-space: nowrap; }
  .contact { text-align: center; margin: 0 0 1pt; }
  .links { text-align: center; margin: 0 0 6pt; }
  .links a { color: #0563C1; text-decoration: none; }
  h2.section {
    font-size: 11.5pt; font-weight: 700; text-transform: uppercase;
    border-bottom: 1px solid #808080; padding-bottom: 1.5pt; margin: 8pt 0 4pt;
  }
  .summary { margin: 0 0 3pt; text-align: justify; }
  .job { margin: 0 0 4pt; }
  .job:first-of-type { margin-top: 0; }
  .job-header {
    display: flex; justify-content: space-between; align-items: baseline;
    gap: 12pt; margin-top: 4pt;
  }
  .job-title { flex: 1 1 auto; }
  .job-dates { color: #404040; font-style: italic; white-space: nowrap; flex: 0 0 auto; }
  ul { margin: 2pt 0 0; padding-left: 15pt; }
  li { margin: 0 0 1.5pt; }
  .skill { margin: 0 0 1.5pt; }
  .skill-label { font-weight: 700; }
  .education { margin: 0; }
</style></head>
<body>
  <div class="name">${escapeHtml(spec.name)}</div>
  ${spec.tagline ? `<div class="tagline">${escapeHtml(spec.tagline)}</div>` : ""}
  ${spec.contact_line ? `<div class="contact">${escapeHtml(fixDashes(spec.contact_line))}</div>` : ""}
  ${links ? `<div class="links">${links}</div>` : ""}
  <h2 class="section">Summary</h2>
  <div class="summary">${htmlFromText(spec.summary)}</div>
  <h2 class="section">Experience</h2>
  ${experience}
  <h2 class="section">Skills</h2>
  ${skills}
  ${education}
</body></html>`;
}

const FONT = "Calibri";
const BODY_SIZE = 21;   // 10.5pt (half-points)
const NAME_SIZE = 40;   // 20pt
const HEAD_SIZE = 24;   // 12pt section headings

// ---------- load spec ----------

const specPath = process.argv[2];
const outDir = process.argv[3];
if (!specPath || !outDir) die("usage: node render.js <spec.json> <output-dir>");
if (!fs.existsSync(specPath)) die("spec not found: " + specPath);
fs.mkdirSync(outDir, { recursive: true });

// Base name for all rendered output files (.docx/.md/.html; PDF made downstream).
// Derived from the spec so the renderer carries no identity literal:
//   1. spec.output_basename if present (e.g. "Jane_Doe_resume")
//   2. else a filesystem-safe slug of spec.name ("Jane Doe" -> "Jane_Doe_resume")
//   3. else the generic fallback "resume"
function slugifyName(name) {
  const slug = (name || "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")   // drop punctuation/accents
    .trim()
    .replace(/[\s-]+/g, "_");   // spaces/hyphens -> underscore
  return slug ? slug + "_resume" : "resume";
}

let spec;
try {
  spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
} catch (e) {
  die("could not parse spec JSON: " + e.message);
}

for (const req of ["name", "summary", "experience", "skills"]) {
  if (!spec[req]) die("spec missing required field: " + req);
}

const OUT_BASENAME = spec.output_basename || slugifyName(spec.name);

// ---------- build docx children ----------

const children = [];

// Name
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 40 },
  children: [new TextRun({ text: spec.name, bold: true, font: FONT, size: NAME_SIZE })],
}));

// Tagline
if (spec.tagline) {
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: spec.tagline, font: FONT, size: BODY_SIZE, color: "404040" })],
  }));
}

// Contact line
if (spec.contact_line) {
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: fixDashes(spec.contact_line), font: FONT, size: BODY_SIZE })],
  }));
}

// Links line (LinkedIn · Portfolio)
if (Array.isArray(spec.links) && spec.links.length) {
  const linkChildren = [];
  spec.links.forEach((lnk, i) => {
    if (i > 0) linkChildren.push(new TextRun({ text: "  ·  ", font: FONT, size: BODY_SIZE }));
    linkChildren.push(new ExternalHyperlink({
      link: lnk.url,
      children: [new TextRun({ text: lnk.label, font: FONT, size: BODY_SIZE, style: "Hyperlink" })],
    }));
  });
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: linkChildren,
  }));
}

// Section heading helper
function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "808080", space: 1 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT, size: HEAD_SIZE })],
  });
}

// SUMMARY
children.push(sectionHeading("Summary"));
children.push(new Paragraph({
  spacing: { after: 80 },
  children: runsFromText(spec.summary),
}));

// EXPERIENCE
children.push(sectionHeading("Experience"));
// Content width = page - left - right margins.
const CONTENT_W = 12240 - 1080 - 1080; // 10080 twips
const DATES_W = 1900;                   // right column for the date range
const TITLE_W = CONTENT_W - DATES_W;
spec.experience.forEach(job => {
  // Title — Company (left cell)   dates (right cell, right-aligned) on one line.
  // Rendered as a borderless 2-col table so the alignment survives PDF export.
  // Location is intentionally omitted from the header per the standard layout.
  const leftPara = new Paragraph({
    spacing: { before: 80, after: 0 },
    children: [
      new TextRun({ text: job.title, bold: true, font: FONT, size: BODY_SIZE }),
      new TextRun({ text: "  —  " + job.company, font: FONT, size: BODY_SIZE }),
    ],
  });
  const rightPara = new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { before: 80, after: 0 },
    children: job.dates
      ? [new TextRun({ text: fixDashes(job.dates), italics: true, font: FONT, size: BODY_SIZE, color: "404040" })]
      : [],
  });
  children.push(new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    indent: { size: 0, type: WidthType.DXA },
    borders: NO_BORDERS,
    rows: [new TableRow({
      children: [
        new TableCell({ width: { size: TITLE_W, type: WidthType.DXA }, margins: ZERO_MARGINS, borders: NO_BORDERS, verticalAlign: VerticalAlign.CENTER, children: [leftPara] }),
        new TableCell({ width: { size: DATES_W, type: WidthType.DXA }, margins: ZERO_MARGINS, borders: NO_BORDERS, verticalAlign: VerticalAlign.CENTER, children: [rightPara] }),
      ],
    })],
  }));
  (job.bullets || []).forEach(b => {
    children.push(new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      spacing: { after: 40 },
      children: runsFromText(b),
    }));
  });
});

// SKILLS
children.push(sectionHeading("Skills"));
spec.skills.forEach(s => {
  children.push(new Paragraph({
    spacing: { after: 30 },
    children: [
      new TextRun({ text: s.label + ": ", bold: true, font: FONT, size: BODY_SIZE }),
      ...runsFromText(s.value),
    ],
  }));
});

// EDUCATION
if (spec.education) {
  children.push(sectionHeading("Education"));
  children.push(new Paragraph({
    spacing: { after: 40 },
    children: runsFromText(spec.education),
  }));
}

// ---------- assemble document ----------

const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 360, hanging: 180 } } },
      }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },        // US Letter
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }, // 0.75"
      },
    },
    children,
  }],
});

// ---------- write docx ----------

const docxPath = path.join(outDir, OUT_BASENAME + ".docx");
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(docxPath, buf);

  // ---------- write markdown mirror ----------
  const md = [];
  md.push(`# ${spec.name}`);
  if (spec.tagline) md.push(`*${spec.tagline}*`);
  if (spec.contact_line) md.push(fixDashes(spec.contact_line));
  if (Array.isArray(spec.links) && spec.links.length) {
    md.push(spec.links.map(l => `[${l.label}](${l.url})`).join(" · "));
  }
  md.push("");
  md.push("## Summary");
  md.push(spec.summary);
  md.push("");
  md.push("## Experience");
  spec.experience.forEach(job => {
    md.push(`### ${job.title} — ${job.company}`);
    if (job.dates) md.push(`*${fixDashes(job.dates)}*`);
    (job.bullets || []).forEach(b => md.push(`- ${b}`));
    md.push("");
  });
  md.push("## Skills");
  spec.skills.forEach(s => md.push(`- **${s.label}:** ${s.value}`));
  md.push("");
  if (spec.education) {
    md.push("## Education");
    md.push(spec.education);
    md.push("");
  }
  const mdPath = path.join(outDir, OUT_BASENAME + ".md");
  fs.writeFileSync(mdPath, md.join("\n"));

  // ---------- write HTML (source for the Chrome --print-to-pdf step) ----------
  const htmlPath = path.join(outDir, OUT_BASENAME + ".html");
  fs.writeFileSync(htmlPath, buildHtml(spec));

  console.log("Wrote " + docxPath);
  console.log("Wrote " + mdPath);
  console.log("Wrote " + htmlPath);
}).catch(e => die("docx packing failed: " + e.message));
