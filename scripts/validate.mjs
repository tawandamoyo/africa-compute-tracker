import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const strict = process.argv.includes('--strict');

const schema = JSON.parse(readFileSync(join(ROOT, 'facility.schema.json'), 'utf-8'));
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const dataDir = join(ROOT, 'data', 'facilities');
const files = readdirSync(dataDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

if (files.length === 0) {
  console.warn('Warning: no facility files found in data/facilities/');
  process.exit(0);
}

// Returns array of warning strings for a single facility record.
function softWarnings(data, file) {
  const warnings = [];

  // last_verified older than 6 months
  if (data.last_verified) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 6);
    if (new Date(data.last_verified + 'T00:00:00') < cutoff) {
      warnings.push(`last_verified (${data.last_verified}) is older than 6 months — schedule a re-verification`);
    }
  }

  // Any source missing archived_url
  for (const src of data.sources ?? []) {
    if (/(^|\/\/)(www\.)?example\.(com|org)|\/todo-/i.test(src.url ?? '')) {
      warnings.push(`source [${src.id}] has a placeholder url — the site shows it unlinked until the real URL is found`);
    }
    if (!src.archived_url) {
      warnings.push(`source [${src.id}] has no archived_url — archive via web.archive.org/save/`);
    }
  }

  // Any sourced_fields entry with confidence 'reported' and only one source
  for (const [field, entry] of Object.entries(data.sourced_fields ?? {})) {
    if (entry.confidence === 'reported' && (entry.source_ids ?? []).length < 2) {
      warnings.push(`sourced_fields['${field}'] is 'reported' with only one source — cross-verify when possible`);
    }
  }

  // Any claim with status 'disputed' and no note
  for (const claim of data.claims ?? []) {
    if (claim.status === 'disputed' && !claim.note) {
      warnings.push(`claim [${claim.id}] has status 'disputed' but no note — add context explaining the dispute`);
    }
  }

  // analysis block present but significance_summary empty or absent
  if (data.analysis && (!data.analysis.significance_summary || data.analysis.significance_summary.length === 0)) {
    warnings.push(`analysis block is present but significance_summary is empty — add 2–4 bullets`);
  }

  return warnings;
}

let hasErrors = false;
let totalWarnings = 0;

for (const file of files) {
  const raw = readFileSync(join(dataDir, file), 'utf-8');
  let data;
  try {
    data = yaml.load(raw);
  } catch (err) {
    console.error(`❌ ${file}: YAML parse error — ${err.message}`);
    hasErrors = true;
    continue;
  }

  const valid = validate(data);
  if (!valid) {
    console.error(`❌ ${file}:`);
    for (const err of validate.errors) {
      console.error(`   ${err.instancePath || '(root)'} ${err.message}`);
    }
    hasErrors = true;
    continue;
  }

  const expectedFile = `${data.id}.yaml`;
  if (file !== expectedFile) {
    console.error(`❌ ${file}: filename must match id — expected ${expectedFile}`);
    hasErrors = true;
    continue;
  }

  const warnings = softWarnings(data, file);
  if (warnings.length > 0) {
    if (strict) {
      console.error(`❌ ${file} (strict — warnings promoted to errors):`);
      for (const w of warnings) {
        console.error(`   ⚠  ${w}`);
      }
      hasErrors = true;
    } else {
      console.log(`✓  ${file}`);
      for (const w of warnings) {
        console.warn(`   ⚠  ${w}`);
      }
      totalWarnings += warnings.length;
    }
  } else {
    console.log(`✓  ${file}`);
  }
}

if (hasErrors) {
  console.error('\nValidation failed. Fix the errors above before building.');
  process.exit(1);
}

const facilityCount = files.length;
const noun = facilityCount === 1 ? 'facility' : 'facilities';
if (totalWarnings > 0 && !strict) {
  console.log(`\n${facilityCount} ${noun} validated successfully (${totalWarnings} warning${totalWarnings === 1 ? '' : 's'} — run with --strict to treat as errors).`);
} else {
  console.log(`\n${facilityCount} ${noun} validated successfully.`);
}
