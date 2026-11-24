// Renders out/book_print.html and out/book_digital.html to PDF with Chromium.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const dir = __dirname;
  const outDir = path.join(dir, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  for (const [name, bleed] of [['print', 3], ['digital', 0]]) {
    const page = await browser.newPage();
    const url = 'file://' + path.join(dir, `book_${name}.html`);
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const report = await page.evaluate(() => window.__report);
    console.log(name, JSON.stringify(report));
    await page.pdf({
      path: path.join(outDir, `Teenpreneur_Journal_v6_${name}.pdf`),
      width: `${148 + 2 * bleed}mm`, height: `${210 + 2 * bleed}mm`,
      printBackground: true, preferCSSPageSize: true,
    });
    await page.close();
  }
  await browser.close();
})();
