import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { readFileSync, readdirSync } from 'node:fs';
import yaml from 'js-yaml';

const SITE = 'https://africacomputetracker.org';

/**
 * Last-modified dates for the sitemap: each facility page uses its record's `last_verified`;
 * every other page uses the latest verification across the dataset.
 */
function lastmodDates() {
  const dir = './data/facilities';
  const dates = new Map();
  let latest = '';
  for (const file of readdirSync(dir).filter(f => /\.ya?ml$/.test(f))) {
    const f = yaml.load(readFileSync(`${dir}/${file}`, 'utf8'));
    if (!f?.last_verified) continue;
    dates.set(`${SITE}/facilities/${f.id}/`, f.last_verified);
    if (f.last_verified > latest) latest = f.last_verified;
  }
  return { dates, latest };
}
const { dates, latest } = lastmodDates();

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'ignore',
  // Not 'always': in Astro 4 that drops the lazily loaded MapLibre stylesheet.
  build: { inlineStylesheets: 'auto' },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({
      filter: page => !page.includes('/404'),
      serialize(item) {
        const when = dates.get(item.url) ?? latest;
        if (when) item.lastmod = new Date(`${when}T00:00:00Z`).toISOString();
        return item;
      },
    }),
  ],
});
