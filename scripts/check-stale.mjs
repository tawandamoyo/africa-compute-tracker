// Runs the soft-warnings pass over all facility YAMLs and writes a maintenance
// report to dist/maintenance.md. Does not fail the build; purely informational.
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const dataDir = join(ROOT, 'data', 'facilities');
const distDir = join(ROOT, 'dist');
const outPath = join(distDir, 'maintenance.md');

const files = readdirSync(dataDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

const today = new Date();
const todayStr = today.toISOString().slice(0, 10);

function softWarnings(data) {
  const warnings = [];

  if (data.last_verified) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 6);
    if (new Date(data.last_verified + 'T00:00:00') < cutoff) {
      warnings.push({
        level: 'stale',
        message: `Record stale — last_verified ${data.last_verified} is older than 6 months`,
      });
    }
  }

  for (const src of data.sources ?? []) {
    if (!src.archived_url) {
      warnings.push({
        level: 'archive',
        message: `Source [${src.id}] missing archived_url`,
        detail: src.url,
      });
    }
  }

  for (const [field, entry] of Object.entries(data.sourced_fields ?? {})) {
    if (entry.confidence === 'reported' && (entry.source_ids ?? []).length < 2) {
      warnings.push({
        level: 'single_source',
        message: `Field '${field}' is 'reported' with only one source`,
      });
    }
  }

  for (const claim of data.claims ?? []) {
    if (claim.status === 'disputed' && !claim.note) {
      warnings.push({
        level: 'claim',
        message: `Claim [${claim.id}] is 'disputed' with no note`,
      });
    }
  }

  if (data.analysis && (!data.analysis.significance_summary || data.analysis.significance_summary.length === 0)) {
    warnings.push({
      level: 'analysis',
      message: 'analysis block present but significance_summary is empty',
    });
  }

  return warnings;
}

const results = [];

for (const file of files) {
  const raw = readFileSync(join(dataDir, file), 'utf-8');
  let data;
  try {
    data = yaml.load(raw);
  } catch (err) {
    results.push({ file, id: file, name: file, parseError: err.message, warnings: [] });
    continue;
  }
  const warnings = softWarnings(data);
  results.push({ file, id: data.id ?? file, name: data.name ?? file, warnings });
}

// Build markdown report
const lines = [];
lines.push('# Maintenance Report');
lines.push('');
lines.push(`Generated: ${todayStr}`);
lines.push('');
lines.push('This report is produced by `npm run check-stale`. It lists soft warnings that do not');
lines.push('fail the build but indicate records needing attention. Run `npm run validate -- --strict`');
lines.push('to promote these to hard errors.');
lines.push('');

const stale = results.filter(r => r.warnings.some(w => w.level === 'stale'));
const noArchive = results.filter(r => r.warnings.some(w => w.level === 'archive'));
const singleSrc = results.filter(r => r.warnings.some(w => w.level === 'single_source'));
const disputedNoNote = results.filter(r => r.warnings.some(w => w.level === 'claim'));
const emptyAnalysis = results.filter(r => r.warnings.some(w => w.level === 'analysis'));
const parseErrors = results.filter(r => r.parseError);

lines.push(`## Summary`);
lines.push('');
lines.push(`| Category | Facilities affected |`);
lines.push(`|---|---|`);
lines.push(`| Parse errors | ${parseErrors.length} |`);
lines.push(`| Stale records (>6 months) | ${stale.length} |`);
lines.push(`| Sources missing archived_url | ${noArchive.length} |`);
lines.push(`| Reported fields with single source | ${singleSrc.length} |`);
lines.push(`| Disputed claims with no note | ${disputedNoNote.length} |`);
lines.push(`| analysis block with empty significance_summary | ${emptyAnalysis.length} |`);
lines.push('');

lines.push('## Facility-by-facility');
lines.push('');

for (const r of results) {
  if (r.parseError) {
    lines.push(`### ${r.file} — PARSE ERROR`);
    lines.push('');
    lines.push(`\`\`\`\n${r.parseError}\n\`\`\``);
    lines.push('');
    continue;
  }
  if (r.warnings.length === 0) {
    lines.push(`### ${r.id} — ${r.name}`);
    lines.push('');
    lines.push('No warnings.');
    lines.push('');
    continue;
  }
  lines.push(`### ${r.id} — ${r.name}`);
  lines.push('');
  for (const w of r.warnings) {
    const prefix = w.level === 'stale' ? '🔴' :
                   w.level === 'archive' ? '📦' :
                   w.level === 'single_source' ? '📎' :
                   w.level === 'claim' ? '⚠️' : 'ℹ️';
    lines.push(`- ${prefix} ${w.message}`);
    if (w.detail) {
      lines.push(`  - ${w.detail}`);
    }
  }
  lines.push('');
}

mkdirSync(distDir, { recursive: true });
writeFileSync(outPath, lines.join('\n'), 'utf-8');

const totalWarnings = results.reduce((n, r) => n + r.warnings.length, 0);
console.log(`Maintenance report written to dist/maintenance.md`);
console.log(`${results.length} facilities checked, ${totalWarnings} total warnings.`);
if (totalWarnings > 0) {
  console.log('Run `npm run validate -- --strict` to treat warnings as build errors.');
}
