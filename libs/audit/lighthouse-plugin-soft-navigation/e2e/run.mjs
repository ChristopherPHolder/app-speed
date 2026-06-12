import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startTimespan } from 'lighthouse';
import puppeteer from 'puppeteer';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const packagePath = path.join(workspaceRoot, 'dist/libs/audit/lighthouse-plugin-soft-navigation');
const scopePath = path.join(workspaceRoot, 'node_modules/@app-speed');
const linkPath = path.join(scopePath, 'lighthouse-plugin-soft-navigation');

const html = `<!doctype html>
<html>
  <head><title>Soft navigation fixture</title></head>
  <body>
    <main id="content"><button id="navigate">Open product</button></main>
    <script>
      document.querySelector('#navigate').addEventListener('click', () => {
        history.pushState({}, '', '/product');
        requestAnimationFrame(() => {
          document.querySelector('#content').innerHTML =
            '<h1 style="font-size: 96px">Soft navigation product page</h1>';
        });
      });
    </script>
  </body>
</html>`;

let browser;
const server = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(html);
});

try {
  await mkdir(scopePath, { recursive: true });
  await rm(linkPath, { force: true, recursive: true });
  await symlink(packagePath, linkPath, 'dir');

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address === 'object');

  browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${address.port}`);

  const timespan = await startTimespan(page, {
    config: {
      extends: 'lighthouse:default',
      plugins: ['@app-speed/lighthouse-plugin-soft-navigation'],
    },
  });

  await page.click('#navigate');
  await page.waitForFunction(() => location.pathname === '/product');
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const result = await timespan.endTimespan();
  assert(result, 'Lighthouse did not return a timespan result');

  const category = Object.values(result.lhr.categories).find((candidate) => candidate.title === 'Soft Navigation');
  assert(category, 'Soft Navigation category was not registered');
  assert.deepEqual(
    category.auditRefs.map(({ id }) => id),
    ['soft-nav-fcp', 'soft-nav-lcp'],
  );

  for (const id of ['soft-nav-fcp', 'soft-nav-lcp']) {
    const audit = result.lhr.audits[id];
    assert(audit, `${id} was not registered`);
    assert.equal(typeof audit.numericValue, 'number', `${id} did not produce a numeric value`);
  }
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  await rm(linkPath, { force: true, recursive: true });
}
