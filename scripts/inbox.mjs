// Lists items in data/inbox/ by triage status and surfaces a worklist:
// what still needs triage, and what is triaged + relevant but not yet extracted.
// Also lint-checks each item's front-matter against the inbox conventions.
//
// Informational by default (exits 0). Pass --strict to exit non-zero when any
// item has front-matter problems (useful in CI / pre-commit).
//
// Usage:
//   npm run inbox            list everything + worklist
//   npm run inbox -- --todo  worklist only (untriaged + ready-to-extract)
//   npm run inbox -- --strict treat front-matter problems as a failure
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const strict = process.argv.includes('--strict');
const todoOnly = process.argv.includes('--todo');

const inboxDir = join(ROOT, 'data', 'inbox');
// Non-item files that live in the inbox folder.
const SKIP = new Set(['README.md', 'TEMPLATE.md']);

// Enums. trust_tier is pulled from the facility schema so there is one source of truth.
const schema = JSON.parse(readFileSync(join(ROOT, 'facility.schema.json'), 'utf-8'));
const TRUST_TIERS = schema.properties.sources.items.properties.trust_tier.enum;
const STATUSES = ['new', 'triaged', 'extracted', 'archived', 'rejected'];
const RELEVANCE = ['high', 'medium', 'low', 'none'];
const TYPES = ['news_article', 'press_release', 'filing', 'tech_spec', 'social_media', 'report'];

if (!existsSync(inboxDir)) {
  console.error('No data/inbox/ directory found.');
  process.exit(strict ? 1 : 0);
}

const files = readdirSync(inboxDir)
  .filter(f => f.endsWith('.md') && !SKIP.has(f))
  .sort();

// Pull the YAML front-matter block (between the first two `---` fences) out of a markdown file.
function parseFrontMatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { fm: null, error: 'no front-matter block (expected a --- ... --- header)' };
  try {
    return { fm: yaml.load(m[1]) ?? {}, error: null };
  } catch (err) {
    return { fm: null, error: `front-matter is not valid YAML: ${err.message}` };
  }
}

function lint(fm) {
  const problems = [];
  const inEnum = (val, list, field) => {
    if (val != null && val !== '' && !list.includes(val)) {
      problems.push(`${field}: '${val}' is not one of ${list.join(', ')}`);
    }
  };

  if (!fm.title) problems.push('missing title');
  if (!fm.url && !/\S/.test(String(fm.url ?? ''))) {
    // url may be intentionally blank while still in 'new'; only nag once triaged.
  }
  inEnum(fm.type, TYPES, 'type');
  inEnum(fm.status, STATUSES, 'status');
  inEnum(fm.relevance, RELEVANCE, 'relevance');
  inEnum(fm.trust_tier, TRUST_TIERS, 'trust_tier');

  const status = fm.status ?? 'new';
  if ((status === 'triaged' || status === 'extracted') && !fm.relevance) {
    problems.push(`status is '${status}' but relevance is unset`);
  }
  if (status === 'extracted' && !fm.extracted_to) {
    problems.push("status is 'extracted' but extracted_to is empty");
  }
  return problems;
}

const items = files.map(file => {
  const raw = readFileSync(join(inboxDir, file), 'utf-8');
  const { fm, error } = parseFrontMatter(raw);
  if (error) return { file, fm: {}, problems: [error] };
  return { file, fm, problems: lint(fm) };
});

const statusOf = i => i.fm.status ?? 'new';
const untriaged = items.filter(i => statusOf(i) === 'new');
const readyToExtract = items.filter(
  i => statusOf(i) === 'triaged' && ['high', 'medium'].includes(i.fm.relevance),
);
const withProblems = items.filter(i => i.problems.length > 0);

const ICON = { new: '🆕', triaged: '🔎', extracted: '✅', archived: '🗄️', rejected: '🚫' };

function listTable() {
  console.log(`Inbox — ${items.length} item${items.length === 1 ? '' : 's'} in data/inbox/\n`);
  console.log('STATUS     REL     FILE');
  for (const i of items) {
    const status = statusOf(i);
    const rel = i.fm.relevance ?? '—';
    const flag = i.problems.length ? '  ⚠' : '';
    console.log(`${(ICON[status] ?? '  ') + ' ' + status.padEnd(7)} ${rel.padEnd(7)} ${i.file}${flag}`);
  }
  console.log('');
}

function worklist() {
  console.log('Worklist');
  console.log('────────');
  if (untriaged.length === 0 && readyToExtract.length === 0) {
    console.log('  Nothing pending — inbox is fully triaged and extracted. 🎉\n');
    return;
  }
  if (untriaged.length) {
    console.log(`  ▸ ${untriaged.length} to triage (status: new):`);
    for (const i of untriaged) console.log(`      - ${i.file}`);
  }
  if (readyToExtract.length) {
    console.log(`  ▸ ${readyToExtract.length} ready to extract (triaged, relevance high/medium):`);
    for (const i of readyToExtract) {
      const fac = (i.fm.facilities ?? []).join(', ') || '(no facilities listed)';
      console.log(`      - ${i.file} → ${fac}`);
    }
  }
  console.log('');
}

if (!todoOnly) listTable();
worklist();

if (withProblems.length) {
  console.log('Front-matter problems');
  console.log('─────────────────────');
  for (const i of withProblems) {
    console.log(`  ${i.file}`);
    for (const p of i.problems) console.log(`    - ${p}`);
  }
  console.log('');
}

if (strict && withProblems.length) {
  console.error(`${withProblems.length} item(s) have front-matter problems (--strict).`);
  process.exit(1);
}
