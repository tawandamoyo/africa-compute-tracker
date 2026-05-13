// Migration script: v1 → v2 schema
//
// Conservative by design. Only adds stubs where they make sense; does not
// auto-migrate speculation from free-text fields into claims. Instead it writes
// a TODO report at dist/migration-todos.md listing entries that require manual
// conversion. Running twice produces no changes (idempotent).
//
// Usage:
//   node scripts/migrate-v1-to-v2.mjs           # writes files
//   node scripts/migrate-v1-to-v2.mjs --dry-run  # prints what it would do, no writes

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const dataDir = join(ROOT, 'data', 'facilities');
const distDir = join(ROOT, 'dist');
const dryRun = process.argv.includes('--dry-run');

const files = readdirSync(dataDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

// Patterns in notes / foreign_capital_origin that suggest speculation worth
// converting to a claim manually.
const SPECULATION_PATTERNS = [
  /unconfirmed/i,
  /possible\b/i,
  /speculation/i,
  /speculated/i,
  /may be/i,
  /reportedly/i,
  /rumou?red/i,
  /anchor tenant/i,
  /not confirmed/i,
  /neither.*confirmed/i,
];

function hasSpeculation(text) {
  if (!text) return false;
  return SPECULATION_PATTERNS.some(p => p.test(text));
}

// Check whether a string that might be a YAML block starts with a v2 marker
// (i.e., the file already has the new fields — migration is idempotent).
function alreadyMigrated(data) {
  // If any of the new top-level keys exist, the record has been touched already.
  return (
    'claims' in data ||
    'claim_history' in data ||
    'constraints' in data ||
    'analysis' in data ||
    'project' in data ||
    'external_ids' in data ||
    'verification' in data
  );
}

// Returns the list of fields in the record that contain speculation text.
function findSpeculationFields(data) {
  const found = [];

  // Check notes
  if (hasSpeculation(data.notes)) {
    found.push({ field: 'notes', excerpt: (data.notes ?? '').slice(0, 120).replace(/\n/g, ' ') });
  }

  // Check governance.foreign_capital_origin items
  for (const [i, item] of (data.governance?.foreign_capital_origin ?? []).entries()) {
    if (hasSpeculation(item)) {
      found.push({ field: `governance.foreign_capital_origin[${i}]`, excerpt: item });
    }
  }

  // Check workload_profile.notes
  if (hasSpeculation(data.workload_profile?.notes)) {
    found.push({ field: 'workload_profile.notes', excerpt: (data.workload_profile?.notes ?? '').slice(0, 120).replace(/\n/g, ' ') });
  }

  return found;
}

// Decide whether this record needs any stubs added.
// The brief says: only add empty stubs if the file "already mentions speculation
// in notes or has fields the new model is meant to capture".
function needsStubs(data) {
  // Always skip if already migrated
  if (alreadyMigrated(data)) return false;

  // Add stubs if there's speculation text (the main trigger)
  if (findSpeculationFields(data).length > 0) return true;

  // Also add stubs if governance.foreign_capital_origin is non-empty
  // (likely a candidate for formalising into claims)
  if ((data.governance?.foreign_capital_origin ?? []).length > 0) return true;

  return false;
}

const todos = [];
let mutatedCount = 0;

for (const file of files) {
  const filePath = join(dataDir, file);
  const raw = readFileSync(filePath, 'utf-8');

  let data;
  try {
    data = yaml.load(raw);
  } catch (err) {
    console.error(`Skipping ${file} — YAML parse error: ${err.message}`);
    continue;
  }

  if (alreadyMigrated(data)) {
    if (dryRun) console.log(`[dry-run] ${file}: already migrated — skipping`);
    continue;
  }

  const speculationFields = findSpeculationFields(data);

  // Record speculation TODOs for the report regardless of whether we add stubs
  if (speculationFields.length > 0) {
    todos.push({ id: data.id ?? file, file, speculationFields });
  }

  if (!needsStubs(data)) {
    if (dryRun) console.log(`[dry-run] ${file}: no stubs needed — skipping`);
    continue;
  }

  // Build the mutated record: add empty stubs for the new array fields.
  // We add them just before 'sources' so they appear in a logical order.
  const mutated = { ...data };

  // Only add if actually relevant (speculation present → claims/constraints at minimum)
  mutated.claims = [];
  mutated.claim_history = [];
  mutated.constraints = [];

  if (dryRun) {
    console.log(`[dry-run] ${file}: would add claims: [], claim_history: [], constraints: []`);
    if (speculationFields.length > 0) {
      console.log(`         → has speculation in: ${speculationFields.map(f => f.field).join(', ')}`);
      console.log(`         → manual TODO written to dist/migration-todos.md`);
    }
    continue;
  }

  // Serialise back to YAML. Use yaml.dump with block style so the file remains
  // human-readable. We preserve the original key order by reassembling manually.
  const header = [
    'id', 'name', 'aliases',
    'country', 'city', 'region', 'location',
    'status', 'status_history', 'scale_tier',
    'timeline', 'operators', 'owners', 'tenants',
    'capacity', 'infrastructure', 'power', 'water',
    'financials', 'governance', 'workload_profile',
    'claims', 'claim_history', 'constraints',
    'analysis', 'project', 'external_ids', 'verification',
    'sources', 'sourced_fields',
    'last_verified', 'first_tracked', 'notes',
  ];

  const ordered = {};
  for (const key of header) {
    if (key in mutated) ordered[key] = mutated[key];
  }
  // Catch any keys not in the canonical order (future-proofing)
  for (const key of Object.keys(mutated)) {
    if (!(key in ordered)) ordered[key] = mutated[key];
  }

  const out = yaml.dump(ordered, {
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });

  writeFileSync(filePath, out, 'utf-8');
  mutatedCount++;
  console.log(`✓  ${file}: added claims, claim_history, constraints stubs`);
  if (speculationFields.length > 0) {
    console.log(`   → speculation detected in: ${speculationFields.map(f => f.field).join(', ')}`);
    console.log(`   → see dist/migration-todos.md for manual conversion tasks`);
  }
}

// Write the TODO report
mkdirSync(distDir, { recursive: true });
const todoLines = [];
todoLines.push('# Migration TODO Report');
todoLines.push('');
todoLines.push('Generated by `npm run migrate`. Lists fields where free-text speculation should be');
todoLines.push('manually converted into `claims` entries under the v2 schema.');
todoLines.push('');
todoLines.push('**These changes require human judgement — do not automate.** The claim model');
todoLines.push('captures contested assertions precisely; a script cannot reliably interpret what');
todoLines.push('the original text intended.');
todoLines.push('');

if (todos.length === 0) {
  todoLines.push('No manual migration tasks found.');
} else {
  for (const t of todos) {
    todoLines.push(`## ${t.id}`);
    todoLines.push('');
    todoLines.push(`File: \`data/facilities/${t.file}\``);
    todoLines.push('');
    todoLines.push('Fields with speculation text:');
    todoLines.push('');
    for (const f of t.speculationFields) {
      todoLines.push(`- **\`${f.field}\`**: "${f.excerpt}"`);
      todoLines.push('');
      todoLines.push('  Suggested action: move this into a `claims` entry with:');
      todoLines.push('  - `type`: appropriate type (e.g. `anchor_tenant`, `foreign_investment`)');
      todoLines.push('  - `entity`: the named party (if any)');
      todoLines.push('  - `status`: `disputed` or `reported` depending on sourcing');
      todoLines.push('  - `denial_status`: `unaddressed` if neither party has commented');
      todoLines.push('  - `source_ids`: source IDs from the existing `sources` array');
      todoLines.push('  - `note`: plain-English summary of the dispute');
      todoLines.push('');
      todoLines.push('  Then remove or edit the speculation text from the original field.');
      todoLines.push('');
    }
  }
}

writeFileSync(join(distDir, 'migration-todos.md'), todoLines.join('\n'), 'utf-8');

if (dryRun) {
  console.log(`\n[dry-run] Would have migrated ${files.length} files.`);
  console.log(`[dry-run] ${todos.length} manual TODO(s) identified — see dist/migration-todos.md.`);
} else {
  console.log(`\nMigration complete. ${mutatedCount} file(s) updated.`);
  console.log(`${todos.length} manual TODO(s) written to dist/migration-todos.md.`);
  if (mutatedCount > 0) {
    console.log('Run `npm run validate` to confirm migrated files still pass schema validation.');
  }
}
