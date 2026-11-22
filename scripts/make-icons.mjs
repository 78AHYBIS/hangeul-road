/**
 * Draws the app icons and iOS splash screens as PNG files in public/icons/.
 * Run by hand after changing the design (command below).
 * Needs Playwright with Chromium (not a project dependency; installed globally here).
 *
 * The glyph is 한 drawn as strokes (no font), on a 100 x 100 grid.
 */
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// require() (unlike import) honours NODE_PATH, so a globally installed Playwright works:
// NODE_PATH=$(npm root -g) node scripts/make-icons.mjs
const { chromium } = createRequire(import.meta.url)('playwright');

const TEAL = '#0f766e';
const PAPER = '#fafaf9'; // stone-50, the app background in light mode

const GLYPH = `
  <g fill="none" stroke="#fff" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M24 13h12M14 25h32"/>
    <circle cx="30" cy="42" r="10"/>
    <path d="M64 8v50M64 33h12"/>
    <path d="M24 66v22h54"/>
  </g>`;

/** The glyph scaled to `size` % of the canvas, centred. */
function glyph(size) {
  const scale = size / 100;
  const offset = (100 - size) / 2;
  return `<g transform="translate(${offset} ${offset}) scale(${scale})">${GLYPH}</g>`;
}

/** Rounded square, transparent corners: favicon and "any" icons. */
export const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="${TEAL}"/>${glyph(64)}</svg>`;
/** Full bleed, glyph inside the central safe circle: Android masks it to any shape. */
const MASKABLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${TEAL}"/>${glyph(50)}</svg>`;
/** Full square: iOS rounds the corners itself and shows black behind transparency. */
const APPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${TEAL}"/>${glyph(62)}</svg>`;

// iPhone portrait sizes (CSS width x height, pixel ratio) for apple-touch-startup-image.
export const SPLASH_SIZES = [
  [375, 667, 2], // SE 2nd/3rd gen, 8
  [414, 896, 2], // 11, XR
  [375, 812, 3], // X, XS, 11 Pro, 12 mini, 13 mini
  [414, 896, 3], // XS Max, 11 Pro Max
  [390, 844, 3], // 12, 13, 14
  [428, 926, 3], // 12/13 Pro Max, 14 Plus
  [393, 852, 3], // 14 Pro, 15, 15 Pro, 16
  [430, 932, 3], // 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  [402, 874, 3], // 16 Pro
  [440, 956, 3], // 16 Pro Max
];

function splashHtml(w, h) {
  const icon = Math.round(Math.min(w, h) * 0.28);
  return `<body style="margin:0;width:${w}px;height:${h}px;background:${PAPER};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Inter,'DejaVu Sans',sans-serif">
    <div style="width:${icon}px;height:${icon}px">${ICON_SVG.replace('<svg ', '<svg width="100%" height="100%" ')}</div>
    <p style="margin:${Math.round(icon * 0.18)}px 0 0;font-size:${Math.round(icon * 0.2)}px;font-weight:700;color:#1c1917;letter-spacing:-0.02em">Hangeul Road</p>
  </body>`;
}

const browser = await chromium.launch();
const page = await browser.newPage();

async function png(svg, size, file, transparent = false) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`,
  );
  await page.screenshot({ path: `public/icons/${file}`, omitBackground: transparent });
}

await png(ICON_SVG, 192, 'icon-192.png', true);
await png(ICON_SVG, 512, 'icon-512.png', true);
await png(MASKABLE_SVG, 512, 'maskable-512.png');
await png(APPLE_SVG, 180, 'apple-touch-icon.png');
writeFileSync('public/icon.svg', ICON_SVG + '\n');

for (const [w, h, ratio] of SPLASH_SIZES) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: ratio,
  });
  const p = await ctx.newPage();
  await p.setContent(splashHtml(w, h));
  await p.screenshot({ path: `public/icons/splash-${w * ratio}x${h * ratio}.png` });
  await ctx.close();
}

await browser.close();
console.log('Icons written to public/icons/ and public/icon.svg');
