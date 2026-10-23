// Generates every site icon from one definition of the logo mark: three bars for operating
// (solid), announced (outlined) and stalled (outlined, grey), on the ink background.
//
//   npm run icons
//
// Writes to public/: favicon.svg, favicon.ico (16/32/48), apple-touch-icon.png (180, full-bleed:
// iOS rounds the corners itself), icon-192.png and icon-512.png (rounded), and
// icon-maskable-512.png (full-bleed, mark inside the central safe zone for Android masks).
import { writeFileSync } from 'fs';
import { join } from 'path';
import { Resvg } from '@resvg/resvg-js';

const OUT = join(process.cwd(), 'public');
const INK = '#15212C';

/** The mark on a 32×32 grid. `scale` shrinks the bars toward the centre (maskable safe zone). */
function markSvg({ rounded = true, scale = 1 } = {}) {
  const t = (32 - 32 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
    `<rect width="32" height="32"${rounded ? ' rx="6"' : ''} fill="${INK}"/>` +
    (scale === 1 ? '<g>' : `<g transform="translate(${t} ${t}) scale(${scale})">`) +
    `<rect x="5" y="7" width="6" height="18" fill="#3FBF9A"/>` +
    `<rect x="13.5" y="8" width="5" height="16" fill="none" stroke="#E0A040" stroke-width="2"/>` +
    `<rect x="22" y="8" width="5" height="16" fill="none" stroke="#9AA6B0" stroke-width="2"/>` +
    `</g></svg>`;
}

const png = (svg, size) => new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();

/** ICO container holding PNG-encoded images (supported by every current browser). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4); // colour planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map(i => i.data)]);
}

const rounded = markSvg();
const fullBleed = markSvg({ rounded: false });

writeFileSync(join(OUT, 'favicon.svg'), rounded + '\n');
writeFileSync(join(OUT, 'favicon.ico'), ico([16, 32, 48].map(size => ({ size, data: png(rounded, size) }))));
writeFileSync(join(OUT, 'apple-touch-icon.png'), png(fullBleed, 180));
writeFileSync(join(OUT, 'icon-192.png'), png(rounded, 192));
writeFileSync(join(OUT, 'icon-512.png'), png(rounded, 512));
writeFileSync(join(OUT, 'icon-maskable-512.png'), png(markSvg({ rounded: false, scale: 0.72 }), 512));

console.log('Icons written to public/.');
