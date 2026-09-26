// Renders the PNG app icons from the SVGs in public/. Run with: npm run icons
// (only needed after changing an SVG; the PNGs are committed).
import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const ICONS = [
  { src: 'public/icon.svg',          out: 'public/icon-192.png',          size: 192 },
  { src: 'public/icon.svg',          out: 'public/icon-512.png',          size: 512 },
  { src: 'public/icon-maskable.svg', out: 'public/icon-maskable-512.png', size: 512 },
  { src: 'public/icon-maskable.svg', out: 'public/apple-touch-icon.png',  size: 180 },
];

for (const { src, out, size } of ICONS) {
  const svg = readFileSync(src, 'utf8');
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(out, png);
  console.log(`${out} (${size}×${size}, ${(png.length / 1024).toFixed(1)} kB)`);
}
