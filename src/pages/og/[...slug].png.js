import { loadFacilities } from '../../lib/loadFacilities.js';
import { summarise, statusGroup, countryName, countrySlug, facilitiesByCountry, facilitiesByOperator } from '../../lib/site.js';
import { formatStatus } from '../../lib/formatters.js';
import { ogImage } from '../../lib/og.js';

/**
 * Per-page Open Graph cards, rendered at build time to /og/site.png, /og/facilities/<id>.png,
 * /og/countries/<slug>.png and /og/operators/<slug>.png. Wired up via Base.astro's `ogImage` prop.
 */

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

  return [site, ...facilityCards, ...countryCards, ...operatorCards];
}

export async function GET({ props }) {
  const png = await ogImage(props);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
