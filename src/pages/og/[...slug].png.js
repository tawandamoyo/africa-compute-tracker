import { loadFacilities } from '../../lib/loadFacilities.js';
import { SITE, summarise, statusGroup, liveLoad, countryName, countrySlug, facilitiesByCountry, facilitiesByOperator } from '../../lib/site.js';
import { formatStatus, formatDate } from '../../lib/formatters.js';
import { ogImage } from '../../lib/og.js';

/**
 * Per-page Open Graph cards, rendered at build time to /og/site.png, /og/facilities/<id>.png,
 * /og/countries/<slug>.png, /og/operators/<slug>.png and /og/pages/<name>.png. Wired up via
 * Base.astro's `ogImage` prop.
 */

/** "3 MW running, 5 MW planned. Last verified 29 June 2026." */
function facilityFacts(f) {
  const live = liveLoad(f);
  const planned = f.capacity?.it_load_mw;
  const load = [live != null && `${live} MW running`, planned != null && `${planned} MW planned`].filter(Boolean).join(', ');
  return `${load || 'IT load not disclosed'}. Last verified ${formatDate(f.last_verified)}.`;
}

const marksFor = list => list.map(f => statusGroup(f.status)).sort((a, b) => order[a] - order[b]);
const order = { built: 0, pipeline: 1, stalled: 2 };

export function getStaticPaths() {
  const facilities = loadFacilities();
  const s = summarise(facilities);

  const site = {
    params: { slug: 'site' },
    props: {
      title: `Of ${s.total} AI data centres tracked across Africa, ${s.groups.built.length} are operating.`,
      kicker: 'An open, sourced record of AI compute infrastructure',
      marks: marksFor(facilities),
    },
  };

  const facilityCards = facilities.map(f => ({
    params: { slug: `facilities/${f.id}` },
    props: {
      title: f.name,
      kicker: `${formatStatus(f.status)} in ${[f.city, countryName(f.country)].filter(Boolean).join(', ')}`,
      facts: facilityFacts(f),
      marks: [statusGroup(f.status)],
    },
  }));

  const countryCards = Object.entries(facilitiesByCountry()).map(([code, list]) => ({
    params: { slug: `countries/${countrySlug(code)}` },
    props: {
      title: `AI data centres in ${countryName(code)}`,
      kicker: `${list.length} tracked ${list.length === 1 ? 'facility' : 'facilities'}, every figure sourced`,
      marks: marksFor(list),
    },
  }));

  const operatorCards = Object.entries(facilitiesByOperator()).map(([slug, { name, facilities: list }]) => ({
    params: { slug: `operators/${slug}` },
    props: {
      title: `${name} data centres in Africa`,
      kicker: `${list.length} tracked ${list.length === 1 ? 'facility' : 'facilities'}`,
      marks: marksFor(list),
    },
  }));

  const all = marksFor(facilities);
  const page = (name, title, kicker) => ({ params: { slug: `pages/${name}` }, props: { title, kicker, marks: all } });
  const pageCards = [
    page('data', 'Download and cite the dataset', `CSV and JSON, free to reuse under ${SITE.license}`),
    page('methodology', 'How every figure is sourced, tiered and verified', 'Methodology'),
    page('glossary', 'Reading AI data centre claims: the terms that matter', 'Glossary'),
    page('about', 'About the Africa Compute Tracker', 'Who maintains it, and why it exists'),
    page('changelog', 'What changed in each release', `Dataset version ${SITE.version}`),
    page('countries', 'AI data centres by country and operator', `${s.countries.length} countries tracked`),
  ];

  return [site, ...facilityCards, ...countryCards, ...operatorCards, ...pageCards];
}

export async function GET({ props }) {
  const png = await ogImage(props);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
