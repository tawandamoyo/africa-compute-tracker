/**
 * schema.org structured data, emitted as one connected @graph per page. The author is referenced
 * by the Person @id published on tawanda.dev rather than restated here.
 */
import { SITE, absolute, datasetCitation, countryName } from './site.js';

export const PERSON_ID = 'https://tawanda.dev/#person';
export const WEBSITE_ID = `${SITE.url}/#website`;
export const DATASET_ID = `${SITE.url}/data/#dataset`;

/** Lightweight author reference: resolves to the full Person node on tawanda.dev. */
export const author = { '@type': 'Person', '@id': PERSON_ID, name: SITE.author, url: 'https://tawanda.dev/' };

export const website = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${SITE.url}/`,
  name: SITE.name,
  description: SITE.description,
  inLanguage: 'en',
  publisher: { '@id': PERSON_ID },
};

// schema.org/Dataset makes the tracker eligible for Google Dataset Search.
export function dataset(summary) {
  return {
    '@type': 'Dataset',
    '@id': DATASET_ID,
    name: SITE.name,
    alternateName: 'Africa AI Datacenter Tracker',
    description:
      `${SITE.description} The dataset covers ${summary.total} hyperscale, carrier-neutral and purpose-built AI compute facilities in ` +
      `${summary.countries.map(countryName).join(', ')}, with status, IT load, power, water, ownership and governance fields, ` +
      'contested claims recorded separately from sourced facts, and per-field confidence levels.',
    url: absolute('/data/'),
    sameAs: SITE.repo,
    version: SITE.version,
    datePublished: SITE.released,
    dateModified: summary.lastVerified > SITE.released ? summary.lastVerified : SITE.released,
    license: SITE.licenseUrl,
    isAccessibleForFree: true,
    creator: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    citation: datasetCitation(),
    keywords: [
      'data centres', 'data centers', 'AI infrastructure', 'compute', 'Africa', 'hyperscale',
      'colocation', 'energy', 'compute governance',
      ...summary.countries.map(countryName),
    ],
    spatialCoverage: { '@type': 'Place', name: 'Africa' },
    variableMeasured: ['status', 'IT load (MW)', 'operator', 'location', 'grid carbon intensity', 'water source'],
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: absolute('/data/facilities.csv') },
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: absolute('/data/facilities.json') },
    ],
  };
}

/** Breadcrumb trail; `crumbs` are [name, root-relative path] pairs. */
export function breadcrumbs(crumbs) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: absolute(path),
    })),
  };
}
