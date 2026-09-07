import { chromium } from 'playwright';
import fs from 'node:fs';

const outDir = '/home/claude/tokai-vintage/screenshots';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function shoot(viewport, label) {
  const page = await browser.newPage({ viewport });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${outDir}/${label}-01-hero.png` });

  await page.locator('#collection').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/${label}-02-collection.png` });

  // open first watch modal
  await page.getByRole('button', { name: /Discover Seiko 5/i }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/${label}-03-modal.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  await page.locator('#our-story').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/${label}-04-story-shipping.png` });

  await page.close();
}

await shoot({ width: 1440, height: 900 }, 'desktop');
await shoot({ width: 390, height: 844 }, 'mobile');

await browser.close();
console.log('Screenshots saved to', outDir);
