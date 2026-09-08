// Generates responsive WebP variants next to every source JPEG used in the
// product galleries and the hero, plus the social share image. Runs before
// each build; variants that already exist and are newer than their source
// are left alone, so committed output makes the build step near-instant.
import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const PRODUCT_DIRS = [
  'public/images/seiko-5',
  'public/images/seiko-pepsi',
  'public/images/king-seiko-vanac',
];
const PRODUCT_WIDTHS = [480, 960, 1440];

const HERO = 'public/images/hero/hero-editorial.jpg';
const HERO_WIDTHS = [960, 1600, 2400];

const OG_IMAGE = 'public/og-image.jpg';

async function mtime(path) {
  try {
    return (await stat(path)).mtimeMs;
  } catch {
    return null;
  }
}

async function fresh(out, sourceMtime) {
  const outMtime = await mtime(out);
  return outMtime != null && outMtime >= sourceMtime;
}

async function variants(file, widths) {
  const sourceMtime = await mtime(file);
  if (sourceMtime == null) throw new Error(`missing ${file}`);
  const base = file.slice(0, file.length - extname(file).length);
  for (const w of widths) {
    const out = `${base}-${w}.webp`;
    if (await fresh(out, sourceMtime)) continue;
    await sharp(file)
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(out);
    const { size } = await stat(out);
    console.log(`${out}  ${(size / 1024).toFixed(0)}KB`);
  }
}

for (const dir of PRODUCT_DIRS) {
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    console.warn(`skip ${dir} (missing)`);
    continue;
  }
  for (const name of entries) {
    if (!/\.jpe?g$/i.test(name)) continue;
    await variants(join(dir, name), PRODUCT_WIDTHS);
  }
}

await variants(HERO, HERO_WIDTHS).catch((e) => console.warn(`skip hero: ${e.message}`));

// 1200×630 social card, cropped from the hero.
const heroMtime = await mtime(HERO);
if (heroMtime != null && !(await fresh(OG_IMAGE, heroMtime))) {
  await sharp(HERO)
    .rotate()
    .resize({ width: 1200, height: 630, fit: 'cover', position: 'attention' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(OG_IMAGE);
  console.log(`${OG_IMAGE}`);
}

console.log('images: done');
