import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const screenshotRoot = resolve(process.env.SCREENSHOT_DIR || 'artifacts/screenshots');
await mkdir(screenshotRoot, { recursive: true });

const browser = await chromium.launch({ headless: true });
const profiles = [
  ['desktop', { width: 1366, height: 768 }, false],
  ['mobile', { width: 390, height: 844 }, true],
].filter(([name]) => !process.argv[2] || name === process.argv[2]);

for (const [name, viewport, mobile] of profiles) {
  const page = await browser.newPage({ viewportSize: viewport, isMobile: mobile, hasTouch: mobile });
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173');

  const shot = state => page.screenshot({ path: `${screenshotRoot}/${name}-${state}.png` });
  await page.click('[data-go="contract"]');
  await page.click('[data-go="briefing"]');
  await shot('briefing');
  await page.click('[data-go="playing"]');
  await page.waitForTimeout(250);
  await shot('safe-flight');

  await page.evaluate(() => {
    const app = window.orbitalApp;
    const planet = app.m.planet;
    Object.assign(app.state.ship, {
      x: planet.x - planet.influence * 0.75,
      y: planet.y,
      vx: 150,
      vy: 35,
    });
    app.state.gravityEntry = true;
  });
  await page.waitForTimeout(100);
  await shot('gravity-entry');

  await page.evaluate(() => {
    const app = window.orbitalApp;
    const planet = app.m.planet;
    Object.assign(app.state.ship, {
      x: planet.x - planet.radius - 80,
      y: planet.y,
      vx: 190,
      vy: 0,
    });
  });
  await page.waitForTimeout(100);
  await shot('collision-warning');

  await page.evaluate(() => {
    const app = window.orbitalApp;
    const station = app.m.stations[0];
    Object.assign(app.state.ship, { x: station.x + 10, y: station.y, vx: 2, vy: 0 });
    app.state.dockProgress = 0.5;
  });
  await page.waitForTimeout(100);
  await shot('docking');

  await page.evaluate(() => {
    const app = window.orbitalApp;
    app.state.completed = true;
    app.state.cargo = 91;
    app.state.slingshot = true;
    app.show('summary');
  });
  await shot('summary');

  await page.click('[data-go="briefing"]');
  await page.click('[data-go="playing"]');
  await page.keyboard.press('Escape');
  await page.locator('#paused [data-go="playing"]').click();
  await page.keyboard.press('Escape');
  await page.locator('#paused [data-go="menu"]').click();

  if (errors.length) throw new Error(`${name} console errors: ${errors.join('; ')}`);
  console.log(`${name}: flow and 6 screenshots OK (${screenshotRoot})`);
  await page.close();
}

if (!process.argv[2]) {
  const classic = await browser.newPage({ viewportSize: { width: 1366, height: 768 } });
  const classicErrors = [];
  classic.on('pageerror', error => classicErrors.push(error.message));
  await classic.goto('http://127.0.0.1:4173/classic.html#credits');
  await classic.waitForTimeout(500);
  if (!await classic.locator('#creditsScreen').isVisible()) {
    throw new Error('Classic credits route did not open');
  }
  if (!await classic.locator('#labyrinthBtn').isVisible()
    || !await classic.locator('#portalTrigger').isVisible()) {
    throw new Error('Easter Egg triggers missing');
  }
  if (classicErrors.length) throw new Error(classicErrors.join('; '));
  console.log('classic credits and Easter Egg triggers OK');
  await classic.close();
}

await browser.close();
