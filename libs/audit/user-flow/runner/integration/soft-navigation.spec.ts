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
      const start = performance.now();
      while (performance.now() - start < 180) { /* Deliberately block the triggering interaction. */ }
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
const RecordedInteraction = Schema.Struct({ interactionId: Schema.Number, duration: Schema.Number });

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
      const observedInteractions = await page.evaluateHandle(() => {
        const entries: PerformanceEventTiming[] = [];
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry instanceof PerformanceEventTiming && entry.interactionId > 0) entries.push(entry);
          }
        });
        observer.observe({ type: 'event', buffered: true });
        return { entries, stop: () => observer.disconnect() };
      });
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
      const triggeringEvents = await observedInteractions.evaluate(({ entries, stop }) => {
        stop();
        return entries.map((entry) => ({
          name: entry.name,
          targetId: entry.target instanceof Element ? entry.target.id : undefined,
          interactionId: entry.interactionId,
          duration: entry.duration,
        }));
      });
      await observedInteractions.dispose();
      await flow.startTimespan({ name: 'Ordinary interaction' });
      await page.click('#noop');
      await flow.endTimespan();
      expect(await page.evaluate(() => localStorage.getItem('session'))).toBe('preserved');
      const result = await flow.createFlowResult();
      if (process.env['APP_SPEED_SOFT_NAV_ARTIFACTS']) {
        const directory = resolve(process.env['APP_SPEED_SOFT_NAV_ARTIFACTS']);
        await mkdir(directory, { recursive: true });
        await writeFile(resolve(directory, 'flow-result.json'), JSON.stringify(result));
        await writeFile(resolve(directory, 'flow-report.html'), generateReport(result, 'html'));
        await writeFile(
          resolve(directory, 'triggering-interaction.json'),
          JSON.stringify(
            {
              triggeringEvents,
              inp: result.steps[1].lhr.audits['interaction-to-next-paint'],
              traceEvents: flow
                .createArtifactsJson()
                .gatherSteps[1].artifacts.Trace.traceEvents.filter((event) =>
                  ['EventTiming', 'Responsiveness.Renderer.UserInteraction', 'SoftNavigationStart'].includes(
                    event.name,
                  ),
                ),
            },
            null,
            2,
          ),
        );
      }
      const [hard, soft, timespan] = result.steps.map((step) => step.lhr);
      expect(hard.gatherMode).toBe('navigation');
      expect(hard.configSettings.softNavigation).toBe(false);
      expect(hard.audits['first-contentful-paint'].numericValue).toBeGreaterThan(0);
      expect(hard.audits['interaction-to-next-paint']).toBeUndefined();
      expect(soft.gatherMode).toBe('navigation');
      expect(soft.configSettings.softNavigation).toBe(true);
      expect(soft.finalDisplayedUrl).toBe(`${baseUrl}/products/1`);
      for (const id of ['first-contentful-paint', 'largest-contentful-paint']) {
        expect(soft.audits[id].scoreDisplayMode).toBe('numeric');
        expect(soft.audits[id].numericValue).toBeGreaterThan(0);
      }
      const inp = soft.audits['interaction-to-next-paint'];
      expect(inp.scoreDisplayMode).toBe('numeric');
      expect(inp.numericValue).toBeGreaterThanOrEqual(180);
      expect(soft.categories['performance'].auditRefs).toContainEqual({
        id: 'interaction-to-next-paint',
        weight: 0,
        group: 'metrics',
        acronym: 'INP',
      });
      expect(new Set(triggeringEvents.map((entry) => entry.interactionId)).size).toBe(1);
      const trigger = triggeringEvents.find((entry) => entry.name === 'click' && entry.targetId === 'product');
      expect(trigger).toBeDefined();
      const recordedInteractions = flow
        .createArtifactsJson()
        .gatherSteps[1].artifacts.Trace.traceEvents.filter((event) => event.name === 'EventTiming' && event.ph !== 'e')
        .map((event) => event.args['data'])
        .filter(Schema.is(RecordedInteraction));
      expect(recordedInteractions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ interactionId: trigger?.interactionId, duration: inp.numericValue }),
        ]),
      );
      // Event Timing rounds public durations to 8 ms; Lighthouse uses the unrounded trace timing.
      expect(Math.abs((inp.numericValue ?? 0) - (trigger?.duration ?? 0))).toBeLessThanOrEqual(16);
      expect(soft.audits['document-latency-insight'].scoreDisplayMode).toBe('notApplicable');
      expect(Object.values(soft.audits).filter((audit) => audit.scoreDisplayMode === 'error')).toEqual([]);
      expect(soft.categories['performance'].auditRefs.some((ref) => ref.id === 'largest-contentful-paint')).toBe(true);
      expect(timespan.gatherMode).toBe('timespan');
      expect(timespan.audits['soft-nav-fcp']).toBeUndefined();
      expect(timespan.audits['first-contentful-paint']).toBeUndefined();
      expect(timespan.runWarnings.join(' ')).not.toContain('A soft navigation was detected during this timespan.');
    } finally {
      flow.dispose();
      await page.close();
    }
  });

  it('does not invent an INP value when the callback has no user interaction', async () => {
    const page = await browser.newPage();
    const flow = await startFlow(page, { flags: { throttlingMethod: 'provided' } });
    try {
      await page.goto(baseUrl);
      await flow.navigate(
        async () => {
          await page.evaluate(() => {
            history.pushState({}, '', '/programmatic');
            document.querySelector('#content')?.replaceChildren('Programmatic content update');
          });
        },
        { softNavigation: true },
      );
      const inp = (await flow.createFlowResult()).steps[0].lhr.audits['interaction-to-next-paint'];
      expect(inp.scoreDisplayMode).toBe('notApplicable');
      expect(inp.numericValue).toBeUndefined();
    } finally {
      flow.dispose();
      await page.close();
    }
  });

  it('warns once when a timespan contains confirmed soft navigations', async () => {
    const page = await browser.newPage();
    const flow = await startFlow(page, { flags: { throttlingMethod: 'provided' } });
    try {
      await page.goto(baseUrl);
      await flow.startTimespan({ name: 'Soft navigation recorded as timespan' });
      await page.click('#product');
      await page.waitForSelector('#content h1');
      await page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
      );
      await page.click('#product');
      await page.waitForFunction(() => document.querySelector('#content h1')?.textContent === 'Product 2');
      await page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
      );
      await flow.endTimespan();
      const result = await flow.createFlowResult();
      const { lhr } = result.steps[0];
      const warnings = lhr.runWarnings.filter((warning) =>
        warning.includes('A soft navigation was detected during this timespan.'),
      );
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('navigation step with Soft Navigation enabled');
      expect(warnings[0]).toContain('FCP and LCP alongside INP');
      expect(lhr.gatherMode).toBe('timespan');
      expect(lhr.audits['first-contentful-paint']).toBeUndefined();
      expect(lhr.audits['interaction-to-next-paint'].scoreDisplayMode).toBe('numeric');
      const report = generateReport(result, 'html');
      expect(report).toContain('A soft navigation was detected during this timespan.');
      if (process.env['APP_SPEED_SOFT_NAV_ARTIFACTS']) {
        const directory = resolve(process.env['APP_SPEED_SOFT_NAV_ARTIFACTS']);
        await mkdir(directory, { recursive: true });
        await writeFile(resolve(directory, 'timespan-warning-result.json'), JSON.stringify(result));
        await writeFile(resolve(directory, 'timespan-warning-report.html'), report);
      }
    } finally {
      flow.dispose();
      await page.close();
    }
  });

  it('does not warn for a same-document URL/content update without a detected soft navigation', async () => {
    const page = await browser.newPage();
    const flow = await startFlow(page, { flags: { throttlingMethod: 'provided' } });
    try {
      await page.goto(baseUrl);
      await flow.startTimespan();
      await page.evaluate(() => {
        history.pushState({}, '', '/programmatic');
        document.querySelector('#content')?.replaceChildren('Programmatic content update');
      });
      await flow.endTimespan();
      const { lhr } = (await flow.createFlowResult()).steps[0];
      expect(lhr.runWarnings.join(' ')).not.toContain('A soft navigation was detected during this timespan.');
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
