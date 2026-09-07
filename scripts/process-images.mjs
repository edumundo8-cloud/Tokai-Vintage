import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC_BASE = '/mnt/user-data/uploads/Projecto-TokaiVintage';

const blueDialOrder = [2, 3, 4, 5, 6, 1]; // front-facing hero first, caseback last
const pepsiOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // front-facing already first

async function processSet(srcDir, prefix, order, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  for (let i = 0; i < order.length; i++) {
    const n = order[i];
    const srcPath = path.join(srcDir, `${prefix}${n}.png`);
    const outPath = path.join(outDir, `${prefix.toLowerCase().includes('blue') ? 'seiko-5' : 'seiko-pepsi'}-${i + 1}.jpg`);
    await sharp(srcPath)
      .resize({ width: 1800, withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(outPath);
    const stat = fs.statSync(outPath);
    console.log(`${outPath}  ${(stat.size / 1024).toFixed(0)} KB`);
  }
}

await processSet(
  path.join(SRC_BASE, 'Seiko blue dial'),
  'SeikoBlue',
  blueDialOrder,
  '/home/claude/tokai-vintage/public/images/seiko-5'
);

await processSet(
  path.join(SRC_BASE, 'Seiko pepsi'),
  'Seikopepsi',
  pepsiOrder,
  '/home/claude/tokai-vintage/public/images/seiko-pepsi'
);

// Hero image: crop/resize the best blue-dial shot (front-facing, image #2) for the hero section
await sharp(path.join(SRC_BASE, 'Seiko blue dial', 'SeikoBlue2.png'))
  .resize({ width: 2400, withoutEnlargement: true })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile('/home/claude/tokai-vintage/public/images/hero/hero-seiko-5.jpg');

console.log('Done.');
