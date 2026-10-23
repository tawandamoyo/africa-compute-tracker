import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { loadFacilities } from './loadFacilities.js';

// CITATION.cff is the single source of truth for dataset version and release date.
const cff = yaml.load(readFileSync(join(process.cwd(), 'CITATION.cff'), 'utf-8'));

export const SITE = {
  name: 'Africa Compute Tracker',
  url: 'https://africacomputetracker.org',
  tagline: 'AI data centres across Africa, sourced and mapped',
  description:
    'An open, citable dataset of AI-relevant data centres across Africa. Every figure has a source, a trust tier and a verification date, and announced projects are kept apart from what is actually running.',
  repo: 'https://github.com/tawandamoyo/africa-compute-tracker',
  author: 'Tawanda Moyo',
  authorUrl: 'https://github.com/tawandamoyo',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  version: String(cff.version),
  released: String(cff['date-released']),
};

export const issueUrl = (template) =>
  `${SITE.repo}/issues/new${template ? `?template=${template}.yml` : '/choose'}`;

export const COUNTRIES = {
  ZA: { name: 'South Africa', slug: 'south-africa' },
  KE: { name: 'Kenya', slug: 'kenya' },
  NG: { name: 'Nigeria', slug: 'nigeria' },
  EG: { name: 'Egypt', slug: 'egypt' },
  MA: { name: 'Morocco', slug: 'morocco' },
  GH: { name: 'Ghana', slug: 'ghana' },
  ET: { name: 'Ethiopia', slug: 'ethiopia' },
  RW: { name: 'Rwanda', slug: 'rwanda' },
  CI: { name: "Côte d'Ivoire", slug: 'cote-divoire' },
  TN: { name: 'Tunisia', slug: 'tunisia' },
  SN: { name: 'Senegal', slug: 'senegal' },
};

export const countryName = (code) => COUNTRIES[code]?.name ?? code;
export const countrySlug = (code) => COUNTRIES[code]?.slug ?? String(code).toLowerCase();

export const slugify = (s) =>
  String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// Status groups: the distinction readers most often get wrong.
export const STATUS_GROUP = {
  operational: 'built',
  expanded: 'built',
  announced: 'pipeline',
  under_construction: 'pipeline',
  paused: 'stalled',
  cancelled: 'stalled',
};

export const GROUP_LABEL = {
  built: 'Operating',
  pipeline: 'Announced or under construction',
  stalled: 'Paused or cancelled',
};

export const GROUP_SHORT = { built: 'Operating', pipeline: 'Pipeline', stalled: 'Stalled' };

export const statusGroup = (status) => STATUS_GROUP[status] ?? 'pipeline';

/**
 * Disclosed running IT load. A 0 on a facility that isn't built yet records that nothing is
 * running, not a disclosed figure, so it is treated as undisclosed.
 */
export function liveLoad(f) {
  const v = f.capacity?.it_load_mw_current;
  return v === 0 && statusGroup(f.status) !== 'built' ? null : v ?? null;
}

export function summarise(facilities) {
  const groups = { built: [], pipeline: [], stalled: [] };
  for (const f of facilities) groups[statusGroup(f.status)].push(f);

  const sum = (list, pick) => list.reduce((t, f) => t + (pick(f) ?? 0), 0);
  const liveMw = sum(facilities, liveLoad);
  const plannedMw = sum(facilities, f => f.capacity?.it_load_mw);
  const disclosing = facilities.filter(
    f => f.capacity?.it_load_mw != null || liveLoad(f) != null
  ).length;

  const verified = facilities.map(f => f.last_verified).filter(Boolean).sort();
  return {
    total: facilities.length,
    groups,
    countries: [...new Set(facilities.map(f => f.country))],
    liveMw,
    plannedMw,
    disclosing,
    lastVerified: verified.at(-1) ?? null,
  };
}

export function facilitiesByCountry() {
  const out = {};
  for (const f of loadFacilities()) (out[f.country] ??= []).push(f);
  return out;
}

export function facilitiesByOperator() {
  const out = {};
  for (const f of loadFacilities()) {
    for (const op of f.operators ?? []) (out[slugify(op)] ??= { name: op, facilities: [] }).facilities.push(f);
  }
  return out;
}

export const facilityUrl = (f) => `/facilities/${f.id}/`;
export const absolute = (path) => new URL(path, SITE.url).href;

export function datasetCitation(accessed = 'YYYY-MM-DD') {
  return `Moyo, Tawanda. Africa Compute Tracker (dataset), version ${SITE.version}. ${SITE.url}. Licensed CC BY 4.0. Accessed ${accessed}.`;
}

export function recordCitation(f, accessed = 'YYYY-MM-DD') {
  return `Africa Compute Tracker, "${f.name}" (${f.id}), record last verified ${f.last_verified}. ${absolute(facilityUrl(f))}. Accessed ${accessed}.`;
}

// Placeholder URLs must never be published as working links.
export const isPlaceholderUrl = (url) => !url || /(^|\/\/)(www\.)?example\.(com|org)|\/todo-/i.test(url);
