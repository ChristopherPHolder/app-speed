import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import puppeteer, { type Browser } from 'puppeteer';
import { startFlow, generateReport } from 'lighthouse';
import { Schema } from 'effect';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UserflowRunnerStepSchema } from '@app-speed/audit/user-flow/domain';
import { UserFlowRunnerExtension } from '../src/lib/audit/runner-extension';

const server = createServer((_request, response) => {
  response.setHeader('Content-Type', 'text/html');
  response.end(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width">
    <title>Soft navigation fixture</title><style>
      body { font: 20px system-ui; margin: 48px; color: #16324f; background: #f5f8fc; }
      main { max-width: 760px; padding: 40px; background: white; border-radius: 16px; }
      button { font: inherit; padding: 12px 24px; cursor: pointer; }
    </style><main><h1>Explore the collection</h1><p>Choose an item to open its details without reloading.</p>
    <button id="product">View product</button><button id="noop">Keep browsing</button><section id="content"></section></main>
    <script>let count = 0; document.querySelector('#product').onclick = () => {
      count++; history.pushState({}, '', '/products/' + count);
      setTimeout(() => {
        document.querySelector('#content').innerHTML = '<h1>Product ' + count + '</h1><p>A new view rendered by a same-document navigation.</p>';
      }, 250);
    };</script></html>`);
});
let browser: Browser;
let baseUrl: string;

beforeAll(async () => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing fixture address');
  baseUrl = `http://127.0.0.1:${address.port}`;
  browser = await puppeteer.launch({ headless: true });
});

afterAll(async () => {
  await browser?.close();
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

const decodeStep = Schema.decodeUnknownPromise(UserflowRunnerStepSchema);

describe('Lighthouse navigation experiment in Chrome', () => {
  it('measures a soft navigation through the replay start/end navigation steps', async () => {
    const page = await browser.newPage();
    const flow = await startFlow(page, {
      name: 'Navigation experiment',
      flags: { formFactor: 'desktop', screenEmulation: { disabled: true }, throttlingMethod: 'provided' },
    });
    try {
      await flow.navigate(baseUrl, { name: 'Initial page load' });
      const extension = new UserFlowRunnerExtension(browser, page, flow);
      await page.evaluate(() => localStorage.setItem('session', 'preserved'));
      await extension.runStep(
        await decodeStep({
          type: 'customStep',
          step: 'startNavigation',
          name: 'Product details',
          softNavigation: true,
        }),
        { title: 'Navigation experiment', steps: [] },
      );
      await page.click('#product');
      await extension.runStep(await decodeStep({ type: 'customStep', step: 'endNavigation' }), {
        title: 'Navigation experiment',
        steps: [],
      });
      await flow.startTimespan({ name: 'Ordinary interaction' });
      await page.click('#noop');
      await flow.endTimespan();
      expect(await page.evaluate(() => localStorage.getItem('session'))).toBe('preserved');
      const result = await flow.createFlowResult();
      const [hard, soft, timespan] = result.steps.map((step) => step.lhr);
      expect(hard.gatherMode).toBe('navigation');
      expect(hard.configSettings.softNavigation).toBe(false);
      expect(hard.audits['first-contentful-paint'].numericValue).toBeGreaterThan(0);
      expect(soft.gatherMode).toBe('navigation');
      expect(soft.configSettings.softNavigation).toBe(true);
      expect(soft.finalDisplayedUrl).toBe(`${baseUrl}/products/1`);
      for (const id of ['first-contentful-paint', 'largest-contentful-paint']) {
        expect(soft.audits[id].scoreDisplayMode).toBe('numeric');
        expect(soft.audits[id].numericValue).toBeGreaterThan(0);
      }
      expect(soft.audits['document-latency-insight'].scoreDisplayMode).toBe('notApplicable');
      expect(Object.values(soft.audits).filter((audit) => audit.scoreDisplayMode === 'error')).toEqual([]);
      expect(soft.categories['performance'].auditRefs.some((ref) => ref.id === 'largest-contentful-paint')).toBe(true);
      expect(timespan.gatherMode).toBe('timespan');
      expect(timespan.audits['soft-nav-fcp']).toBeUndefined();
      expect(timespan.audits['first-contentful-paint']).toBeUndefined();

      if (process.env['APP_SPEED_SOFT_NAV_ARTIFACTS']) {
        const directory = resolve(process.env['APP_SPEED_SOFT_NAV_ARTIFACTS']);
        await mkdir(directory, { recursive: true });
        await writeFile(resolve(directory, 'flow-result.json'), JSON.stringify(result));
        await writeFile(resolve(directory, 'flow-report.html'), generateReport(result, 'html'));
      }
    } finally {
      flow.dispose();
      await page.close();
    }
  });

  it('reports missing soft navigation metrics as errors and keeps the run bounded', async () => {
    const page = await browser.newPage();
    const flow = await startFlow(page, { flags: { throttlingMethod: 'provided', maxWaitForLoad: 1000 } });
    try {
      await page.goto(baseUrl);
      await flow.navigate(
        async () => {
          await page.click('#noop');
        },
        { softNavigation: true },
      );
      const { lhr } = (await flow.createFlowResult()).steps[0];
      expect(lhr.audits['first-contentful-paint'].scoreDisplayMode).toBe('error');
      expect(lhr.audits['first-contentful-paint'].errorMessage).toContain('soft navigation');
      expect(lhr.audits['largest-contentful-paint'].scoreDisplayMode).toBe('error');
    } finally {
      flow.dispose();
      await page.close();
    }
  });

  it('warns when several soft navigations share a step and measures the first', async () => {
    const page = await browser.newPage();
    const flow = await startFlow(page, { flags: { throttlingMethod: 'provided' } });
    try {
      await page.goto(baseUrl);
      await flow.navigate(
        async () => {
          await page.click('#product');
          await page.waitForSelector('#content h1');
          await page.evaluate(
            () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
          );
          await page.click('#product');
        },
        { softNavigation: true },
      );
      const { lhr } = (await flow.createFlowResult()).steps[0];
      expect(lhr.runWarnings.join(' ')).toContain('Only the first soft navigation is measured');
      expect(lhr.audits['first-contentful-paint'].numericValue).toBeGreaterThan(0);
    } finally {
      flow.dispose();
      await page.close();
    }
  });
});
