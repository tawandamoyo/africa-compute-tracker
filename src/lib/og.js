import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

/**
 * Build-time Open Graph cards. One template: the title is the
 * hero, a kicker line gives context, and a row of status marks shows the built/pipeline/stalled
 * split, so every share reads as the same publication.
 */

const INK = '#15212C';
const MUTED = '#4D5B67';
const MIST = '#F3F5F6';
const COLORS = { built: '#0B7A5F', pipeline: '#A35F00', stalled: '#65717C' };

const fontFile = (name) => readFileSync(resolve('src/assets/fonts', name));
const FONTS = [
  { name: 'Public Sans', data: fontFile('public-sans-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Public Sans', data: fontFile('public-sans-latin-600-normal.woff'), weight: 600, style: 'normal' },
  { name: 'Public Sans', data: fontFile('public-sans-latin-700-normal.woff'), weight: 700, style: 'normal' },
];

const h = (type, props, ...kids) => ({
  type,
  props: { ...props, children: kids.length === 0 ? undefined : kids.length === 1 ? kids[0] : kids },
});

function mark(group, w, hgt) {
  const color = COLORS[group];
  const base = { width: `${w}px`, height: `${hgt}px`, display: 'flex' };
  if (group === 'built') return h('div', { style: { ...base, background: color } });
  if (group === 'pipeline') return h('div', { style: { ...base, border: `5px solid ${color}`, background: '#fff' } });
  return h('div', {
    style: {
      ...base,
      border: `5px solid ${color}`,
      backgroundImage: `repeating-linear-gradient(-45deg, ${color} 0px, ${color} 4px, #fff 4px, #fff 11px)`,
    },
  });
}

function titleSize(title) {
  const n = title.length;
  if (n <= 30) return 76;
  if (n <= 50) return 64;
  if (n <= 75) return 54;
  return 46;
}

/**
 * @param {{ title: string, kicker: string, marks: Array<'built'|'pipeline'|'stalled'> }} card
 */
export async function ogImage({ title, kicker, marks }) {
  const big = marks.length <= 3;
  const tree = h(
    'div',
    {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        background: MIST,
        fontFamily: 'Public Sans',
        color: INK,
      },
    },
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: '16px', fontSize: '30px', fontWeight: 600 } },
      h('div', { style: { display: 'flex', gap: '5px' } }, mark('built', 12, 32), mark('pipeline', 12, 32), mark('stalled', 12, 32)),
      'Africa Compute Tracker'
    ),
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column' } },
      h('div', { style: { fontSize: '28px', color: MUTED, marginBottom: '18px' } }, kicker),
      h(
        'div',
        { style: { display: 'flex', fontSize: `${titleSize(title)}px`, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.02em' } },
        title
      )
    ),
    h(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' } },
      h('div', { style: { display: 'flex', gap: big ? '12px' : '8px' } }, ...marks.map(g => (big ? mark(g, 36, 56) : mark(g, 26, 42)))),
      h('div', { style: { fontSize: '26px', color: MUTED } }, 'africacomputetracker.org')
    )
  );

  const svg = await satori(tree, { width: 1200, height: 630, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
