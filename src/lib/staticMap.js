/**
 * Build-time static map: country outlines (Natural Earth 1:110m via world-atlas, public domain)
 * projected to SVG paths, plus facility positions grouped by proximity. Rendered by Map.astro
 * as the default map, so pages carry no map library or tiles until someone asks for them.
 */
import { createRequire } from 'node:module';
import { geoCentroid, geoEqualEarth, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { COUNTRIES, statusGroup, countryName, facilityUrl } from './site.js';
import { formatStatus } from './formatters.js';

const require = createRequire(import.meta.url);
const atlas = require('world-atlas/countries-110m.json');
const WORLD = feature(atlas, atlas.objects.countries).features;

const GROUP_ORDER = { built: 0, pipeline: 1, stalled: 2 };

// Whole-continent framing, as a ring of points (a lon/lat rectangle polygon can wind the wrong way).
const AFRICA = {
  type: 'MultiPoint',
  coordinates: [
    [-18, 37.5], [17, 37.5], [52, 37.5], [52, 1], [52, -35], [17, -35], [-18, -35], [-18, 1],
  ],
};

/**
 * @param {object} opts
 * @param {any[]} opts.facilities
 * @param {number} opts.width   viewBox width
 * @param {number} opts.height  viewBox height
 * @param {'africa'|'fit'} opts.frame  whole continent, or fitted to the facilities' country
 */
export function staticMap({ facilities, width, height, frame }) {
  const located = facilities.filter(f => f.location?.lat != null && f.location?.lng != null);
  const codes = new Set(facilities.map(f => f.country));
  const isoTracked = new Set([...codes].map(c => String(COUNTRIES[c]?.iso ?? '')));

  const pad = Math.round(Math.min(width, height) * 0.08);
  const projection = geoEqualEarth().rotate([-20, 0]);
  const target =
    frame === 'africa'
      ? AFRICA
      : {
          type: 'FeatureCollection',
          features: [
            ...WORLD.filter(f => isoTracked.has(String(Number(f.id)))),
            ...located.map(f => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [f.location.lng, f.location.lat] } })),
          ],
        };
  projection.fitExtent([[pad, pad], [width - pad, height - pad]], target);

  // Clip to a margin around the frame, so a container wider or taller than the viewBox still
  // shows land at its edges, while far-off geometry is cut away instead of shipped.
  // A fitted single country is cheap to draw, so it gets a wider margin.
  const mx = width * (frame === 'africa' ? 0.3 : 0.6);
  const my = height * (frame === 'africa' ? 0.15 : 0.6);
  const clipped = geoPath(projection.clipExtent([[-mx, -my], [width + mx, height + my]])).digits(0);
  const nearFrame = ([x, y]) => x > -mx && x < width + mx && y > -my && y < height + my;
  // On the continent frame, draw Africa and its neighbours (southern Europe, the Middle East),
  // not the Americas or Asia that a wide container would otherwise reveal.
  const neighbourhood = ([lng, lat]) => lng > -25 && lng < 62 && lat < 47;
  const countries = WORLD.flatMap(f => {
    const centroid = geoCentroid(f);
    if (frame === 'africa' && !neighbourhood(centroid)) return [];
    const c = projection.clipExtent(null)(centroid);
    projection.clipExtent([[-mx, -my], [width + mx, height + my]]);
    if (!c || !nearFrame(c)) return [];
    const d = clipped(f);
    return d ? [{ d, tracked: isoTracked.has(String(Number(f.id))) }] : [];
  });

  // Facilities closer than `near` viewBox units share one row of marks.
  const near = Math.min(width, height) * 0.08;
  const points = located
    .map(f => {
      const [x, y] = projection([f.location.lng, f.location.lat]);
      return { f, x, y };
    })
    .sort((a, b) => GROUP_ORDER[statusGroup(a.f.status)] - GROUP_ORDER[statusGroup(b.f.status)]);

  const groups = [];
  for (const p of points) {
    const g = groups.find(g => Math.hypot(g.x - p.x, g.y - p.y) < near);
    if (g) g.items.push(p);
    else groups.push({ x: p.x, y: p.y, items: [p] });
  }

  return {
    width,
    height,
    countries,
    groups: groups.map(g => ({
      x: Math.round(g.x * 10) / 10,
      y: Math.round(g.y * 10) / 10,
      labelLeft: g.x > width * 0.6,
      label: [...new Set(g.items.map(({ f }) => f.city).filter(Boolean))].join(', '),
      items: g.items.map(({ f }) => ({
        id: f.id,
        name: f.name,
        group: statusGroup(f.status),
        status: formatStatus(f.status),
        place: [f.city, countryName(f.country)].filter(Boolean).join(', '),
        url: facilityUrl(f),
      })),
    })),
  };
}
