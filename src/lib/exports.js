import { loadFacilities } from './loadFacilities.js';
import { SITE, liveLoad, countryName, statusGroup, facilityUrl, absolute, datasetCitation, isPlaceholderUrl } from './site.js';

// One row per facility, flattened for spreadsheets. Nested detail lives in the JSON export.
const COLUMNS = [
  ['id', f => f.id],
  ['name', f => f.name],
  ['status', f => f.status],
  ['status_group', f => statusGroup(f.status)],
  ['country_code', f => f.country],
  ['country', f => countryName(f.country)],
  ['region', f => f.region],
  ['city', f => f.city],
  ['latitude', f => f.location?.lat],
  ['longitude', f => f.location?.lng],
  ['location_precision', f => f.location?.precision],
  ['operators', f => (f.operators ?? []).join('; ')],
  ['owners', f => (f.owners ?? []).join('; ')],
  ['it_load_mw_planned', f => f.capacity?.it_load_mw],
  ['it_load_mw_current', liveLoad],
  ['total_facility_mw', f => f.capacity?.total_facility_mw],
  ['scale_tier', f => f.scale_tier],
  ['announced_capex_usd_millions', f => f.financials?.announced_capex_usd_millions],
  ['expected_operational', f => f.timeline?.expected_operational],
  ['actual_operational', f => f.timeline?.actual_operational],
  ['source_count', f => f.sources?.length ?? 0],
  ['first_tracked', f => f.first_tracked],
  ['last_verified', f => f.last_verified],
  ['url', f => absolute(facilityUrl(f))],
];

const cell = v => {
  if (v == null) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function facilitiesCsv() {
  const rows = loadFacilities().map(f => COLUMNS.map(([, get]) => cell(get(f))).join(','));
  // BOM so Excel opens accented names (Côte d'Ivoire) correctly.
  return '﻿' + [COLUMNS.map(([k]) => k).join(','), ...rows].join('\r\n') + '\r\n';
}

export function facilitiesJson() {
  const records = loadFacilities().map(f => ({
    ...f,
    sources: (f.sources ?? []).map(s => (isPlaceholderUrl(s.url) ? { ...s, url: null, url_pending: true } : s)),
    url: absolute(facilityUrl(f)),
  }));
  return JSON.stringify(
    {
      name: SITE.name,
      version: SITE.version,
      released: SITE.released,
      license: SITE.licenseUrl,
      citation: datasetCitation(),
      source: SITE.repo,
      record_count: records.length,
      records,
    },
    null,
    2
  );
}

export const CSV_COLUMNS = COLUMNS.map(([k]) => k);
