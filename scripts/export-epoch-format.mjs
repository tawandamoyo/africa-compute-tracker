// Epoch AI-compatible CSV export.
// Columns match Epoch's data_centers.csv exactly.
// Only includes facilities with at least one capacity figure.
// Run: npm run export:epoch

import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const dataDir = join(ROOT, 'data', 'facilities');
const outDir = join(ROOT, 'dist', 'exports');
const outPath = join(outDir, 'epoch-compatible.csv');

// Small lookup table — expand as dataset grows.
const COUNTRY_NAMES = {
  ZA: 'South Africa',
  KE: 'Kenya',
  NG: 'Nigeria',
  EG: 'Egypt',
  MA: 'Morocco',
  GH: 'Ghana',
  ET: 'Ethiopia',
  CI: "Côte d'Ivoire",
  RW: 'Rwanda',
  TZ: 'Tanzania',
  SN: 'Senegal',
  CM: 'Cameroon',
};

function countryName(code) {
  return COUNTRY_NAMES[code] ?? code;
}

// Returns a #confident / #speculative suffix based on sourced_fields confidence.
function confidenceSuffix(data, fieldPath) {
  const entry = data.sourced_fields?.[fieldPath];
  if (!entry) return '';
  if (entry.confidence === 'confirmed' || entry.confidence === 'reported') return ' #confident';
  if (entry.confidence === 'estimated' || entry.confidence === 'disputed') return ' #speculative';
  return '';
}

// Format the top 3 sources as Markdown links, space-separated.
function topSources(data, max = 3) {
  const sources = (data.sources ?? []).slice(0, max);
  return sources.map(s => {
    const url = s.archived_url ?? s.url;
    const label = s.title ?? s.publisher ?? s.id;
    return `[${label}](${url})`;
  }).join(' ');
}

// Extract first paragraph from a string (up to first blank line).
function firstParagraph(text) {
  if (!text) return '';
  return text.split(/\n\n/)[0].replace(/\n/g, ' ').trim();
}

// Escape a value for CSV (wrap in quotes, escape internal quotes).
function csvVal(val) {
  if (val == null) return '';
  const s = String(val).replace(/"/g, '""');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s}"`;
  }
  return s;
}

const files = readdirSync(dataDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

const rows = [];
const skipped = [];

for (const file of files) {
  const raw = readFileSync(join(dataDir, file), 'utf-8');
  let data;
  try {
    data = yaml.load(raw);
  } catch (err) {
    skipped.push({ file, reason: `YAML parse error: ${err.message}` });
    continue;
  }

  // Must have at least one capacity figure
  const hasCapacity = data.capacity?.it_load_mw != null || data.capacity?.h100_equivalent_gpus != null;
  if (!hasCapacity) {
    skipped.push({ file, id: data.id, reason: 'no capacity figure (it_load_mw or h100_equivalent_gpus absent)' });
    continue;
  }

  // Name
  const name = data.name ?? '';

  // H100 equivalents
  const h100 = data.capacity?.h100_equivalent_gpus != null
    ? String(data.capacity.h100_equivalent_gpus)
    : '';

  // Current power MW (prefer it_load_mw_current, fall back to it_load_mw)
  const powerMw = data.capacity?.it_load_mw_current != null
    ? data.capacity.it_load_mw_current
    : data.capacity?.it_load_mw;
  const currentPower = powerMw != null ? String(powerMw) : '';

  // Capital cost in 2025 USD billions
  // Only emit if capex_currency_year is 2025 (or not set, assume 2025 USD)
  let capexBillions = '';
  if (data.financials?.announced_capex_usd_millions != null) {
    const currencyYear = data.financials.capex_currency_year;
    if (currencyYear == null || currencyYear === 2025) {
      capexBillions = (data.financials.announced_capex_usd_millions / 1000).toFixed(3);
    }
    // else: leave blank — not normalised to 2025 USD
  }

  // Owner (owners[0] with confidence suffix)
  const owner0 = data.owners?.[0] ?? '';
  const ownerSuffix = owner0 ? confidenceSuffix(data, 'owners[0]') || confidenceSuffix(data, 'owners') : '';
  const owner = owner0 ? `${owner0}${ownerSuffix}` : '';

  // Users (tenants joined, with confidence)
  const tenantSuffix = (data.tenants?.length ?? 0) > 0
    ? confidenceSuffix(data, 'tenants')
    : '';
  const users = (data.tenants ?? []).map(t => `${t}${tenantSuffix}`).join('; ');

  // Notes (first paragraph only)
  const notes = firstParagraph(data.notes ?? '');

  // Selected sources (top 3 as Markdown links)
  const selectedSources = topSources(data);

  // Project name with confidence suffix
  const projectName = data.project?.name ?? '';
  const projectSuffix = projectName
    ? (data.project.confidence === 'confirmed' ? ' #confident'
      : data.project.confidence === 'reported' ? ' #confident'
      : ' #speculative')
    : '';
  const project = projectName ? `${projectName}${projectSuffix}` : '';

  // Investors joined
  const investors = (data.financials?.investors ?? []).join('; ');

  // Country name
  const country = countryName(data.country ?? '');

  // Address (never invent a street address)
  const parts = [data.city, data.region, country].filter(Boolean);
  const address = parts.join(', ');

  rows.push([
    name,
    h100,
    currentPower,
    capexBillions,
    owner,
    users,
    notes,
    selectedSources,
    project,
    investors,
    country,
    address,
  ]);
}

// Build CSV
const HEADERS = [
  'Name',
  'Current H100 equivalents',
  'Current power (MW)',
  'Current total capital cost (2025 USD billions)',
  'Owner',
  'Users',
  'Notes',
  'Selected Sources',
  'Project',
  'Investors',
  'Country',
  'Address',
];

const lines = [HEADERS.map(csvVal).join(',')];
for (const row of rows) {
  lines.push(row.map(csvVal).join(','));
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, lines.join('\n') + '\n', 'utf-8');

console.log(`Epoch-compatible CSV written to dist/exports/epoch-compatible.csv`);
console.log(`${rows.length} facilit${rows.length === 1 ? 'y' : 'ies'} exported.`);

if (skipped.length > 0) {
  console.log(`\nSkipped ${skipped.length} facilit${skipped.length === 1 ? 'y' : 'ies'} (no capacity data):`);
  for (const s of skipped) {
    console.log(`  - ${s.id ?? s.file}: ${s.reason}`);
  }
}
