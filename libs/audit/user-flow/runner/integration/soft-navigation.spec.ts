import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
import puppeteer, { type Browser } from 'puppeteer';
import { startFlow as startLighthouseFlow, generateReport, defaultConfig } from 'lighthouse';
import type { Page } from 'puppeteer';
import { ExperimentalUserFlow } from '../src/lib/soft-navigation/flow';
import { experimentalNavigationConfig } from '../src/lib/soft-navigation/audits';
import { Schema } from 'effect';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UserflowRunnerStepSchema } from '@app-speed/audit/user-flow/domain';
import { UserFlowRunnerExtension } from '../src/lib/audit/runner-extension';

const server = createServer((request, response) => {
  if (request.url === '/slow-content') {
    setTimeout(() => {
      response.setHeader('Content-Type', 'text/plain');
      response.end('Loaded');
    }, 800);
    return;
  }
  response.setHeader('Content-Type', 'text/html');
  response.end(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width">
    <title>Soft navigation fixture</title><style>
      body { font: 20px system-ui; margin: 48px; color: #16324f; background: #f5f8fc; }
      main { max-width: 760px; padding: 40px; background: white; border-radius: 16px; }
      button { font: inherit; padding: 12px 24px; cursor: pointer; }
    </style><main><h1>Explore the collection</h1><p>Choose an item to open its details without reloading.</p>
    <button id="product">View product</button><button id="noop">Keep browsing</button><a id="hard-link" href="/document">Full page</a><section id="content"></section></main>
    <script>let count = 0; document.querySelector('#product').onclick = () => {
      const start = performance.now();
      while (performance.now() - start < 180) { /* Deliberately block the triggering interaction. */ }
      const slow = location.search.includes('slow=1');
      count++; history.pushState({}, '', '/products/' + count);
      const ready = slow ? fetch('/slow-content') : new Promise(resolve => setTimeout(resolve, 250));
      ready.then(() => {
        document.querySelector('#content').innerHTML = '<h1>Product ' + count + '</h1><p>A new view rendered by a same-document navigation.</p>';
      });
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
  browser = await puppeteer.launch({
    headless: true,
    args: process.env['CI'] ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
  });
});

afterAll(async () => {
  await browser?.close();
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

const decodeStep = Schema.decodeUnknownPromise(UserflowRunnerStepSchema);
const RecordedInteraction = Schema.Struct({ interactionId: Schema.Number, duration: Schema.Number });

async function createFlow(
  page: Page,
  options: Parameters<typeof startLighthouseFlow>[1] = {},
  plan: ConstructorParameters<typeof ExperimentalUserFlow>[2] = [],
) {
  const flow = await startLighthouseFlow(page, {
    ...options,
    config: experimentalNavigationConfig(options.config ?? defaultConfig),
  });
  return new ExperimentalUserFlow(page, flow, plan, options.flags?.maxWaitForLoad ?? 3000);
}

describe('Lighthouse navigation experiment in Chrome', () => {
  it('measures a soft navigation through the replay start/end navigation steps', async () => {
    const page = await browser.newPage();
    const flow = await createFlow(
      page,
      {
        name: 'Navigation experiment',
        flags: { formFactor: 'desktop', screenEmulation: { disabled: true }, throttlingMethod: 'provided' },
      },
      ['navigation', 'soft-navigation'],
    );
    try {
      await flow.startNavigation({ name: 'Initial page load' });
      await page.goto(baseUrl);
      await flow.endNavigation();
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
                  [
                    'EventTiming',
                    'Responsiveness.Renderer.UserInteraction',
                    'SoftNavigationStart',
                    'largestContentfulPaint::CandidateForSoftNavigation',
                  ].includes(event.name),
                ),
            },
            null,
            2,
          ),
        );
      }
      const [hard, soft, timespan] = result.steps.map((step) => step.lhr);
      expect(hard.gatherMode).toBe('navigation');
      expect(hard.runWarnings.join(' ')).not.toContain('Multiple navigations');
      expect(result.steps[0].softNavigation).toBeUndefined();
      expect(hard.audits['first-contentful-paint'].numericValue).toBeGreaterThan(0);
      expect(hard.audits['interaction-to-next-paint']).toBeUndefined();
      expect(soft.gatherMode).toBe('navigation');
      expect(soft.runWarnings.join(' ')).not.toContain('Multiple navigations');
      expect(result.steps[1].softNavigation).toBe(true);
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
      expect(soft.audits['document-latency-insight'].scoreDisplayMode).not.toBe('error');
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
    const flow = await createFlow(page, { flags: { throttlingMethod: 'provided' } });
    try {
      await page.goto(baseUrl);
      await flow.navigate(async () => {
        await page.evaluate(() => {
          history.pushState({}, '', '/programmatic');
          document.querySelector('#content')?.replaceChildren('Programmatic content update');
        });
      }, {});
      const inp = (await flow.createFlowResult()).steps[0].lhr.audits['interaction-to-next-paint'];
      expect(inp.scoreDisplayMode).toBe('notApplicable');
      expect(inp.numericValue).toBeUndefined();
    } finally {
      flow.dispose();
      await page.close();
    }
  });

  it('starts network quiet after navigation even when the page was already idle before the click', async () => {
    const page = await browser.newPage();
    const flow = await createFlow(page, { flags: { throttlingMethod: 'provided' } });
    try {
      await page.goto(`${baseUrl}/?slow=1`);
      await flow.startNavigation({ name: 'Delayed interaction' });
      await pause(1600);
      await page.click('#product');
      await flow.endNavigation();
      const { lhr } = (await flow.createFlowResult()).steps[0];
      expect(lhr.audits['first-contentful-paint'].numericValue).toBeGreaterThanOrEqual(800);
      expect(lhr.audits['largest-contentful-paint'].numericValue).toBeGreaterThanOrEqual(800);
    } finally {
      flow.dispose();
      await page.close();
    }
  });

  it('does not label fallback document paints as soft-navigation measurements', async () => {
    const page = await browser.newPage();
    const flow = await createFlow(page, { flags: { throttlingMethod: 'provided' } });
    try {
      await page.goto(baseUrl);
      await flow.navigate(async () => {
        await Promise.all([page.waitForNavigation(), page.click('#hard-link')]);
      });
      const { lhr } = (await flow.createFlowResult()).steps[0];
      for (const id of ['first-contentful-paint', 'largest-contentful-paint']) {
        expect(lhr.audits[id].scoreDisplayMode).toBe('error');
        expect(lhr.audits[id].errorMessage).toContain('No soft navigation detected');
        expect(lhr.audits[id].numericValue).toBeUndefined();
      }
    } finally {
      flow.dispose();
      await page.close();
    }
  });

  it('warns once when a timespan contains confirmed soft navigations', async () => {
    const page = await browser.newPage();
    const flow = await createFlow(page, { flags: { throttlingMethod: 'provided' } });
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
      expect(warnings[0]).toContain('Use a navigation step');
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
    const flow = await createFlow(page, { flags: { throttlingMethod: 'provided' } });
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
    const flow = await createFlow(page, { flags: { throttlingMethod: 'provided', maxWaitForLoad: 1000 } });
    try {
      await page.goto(baseUrl);
      await flow.navigate(async () => {
        await page.click('#noop');
      }, {});
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
    const flow = await createFlow(page, { flags: { throttlingMethod: 'provided' } });
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
        { name: 'Browse products' },
      );
      const result = await flow.createFlowResult();
      const { lhr } = result.steps[0];
      expect(lhr.runWarnings.join(' ')).toContain('Only the first soft navigation is measured');
      expect(lhr.runWarnings.filter((warning) => warning.includes('Multiple navigations'))).toHaveLength(1);
      expect(lhr.runWarnings.join(' ')).toContain('Record each navigation in a separate step.');
      expect(lhr.audits['first-contentful-paint'].numericValue).toBeGreaterThan(0);
      if (process.env['APP_SPEED_SOFT_NAV_ARTIFACTS']) {
        const directory = resolve(process.env['APP_SPEED_SOFT_NAV_ARTIFACTS']);
        await mkdir(directory, { recursive: true });
        await writeFile(resolve(directory, 'multiple-navigation-result.json'), JSON.stringify(result));
      }
    } finally {
      flow.dispose();
      await page.close();
    }
  });

  it.each(['document', 'soft'])(
    'warns when a native navigation step also contains a second %s navigation',
    async (secondNavigation) => {
      const page = await browser.newPage();
      const flow = await createFlow(page, { flags: { throttlingMethod: 'provided' } }, ['navigation']);
      try {
        await flow.startNavigation({ name: 'Several page views' });
        await page.goto(baseUrl);
        if (secondNavigation === 'document') {
          await page.goto(`${baseUrl}/document`);
        } else {
          await page.click('#product');
          await page.waitForSelector('#content h1');
          await page.evaluate(
            () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
          );
        }
        await flow.endNavigation();
        const result = await flow.createFlowResult();
        const { lhr } = result.steps[0];
        expect(lhr.gatherMode).toBe('navigation');
        expect(result.steps[0].softNavigation).toBeUndefined();
        const warnings = lhr.runWarnings.filter((warning) => warning.includes('Multiple navigations'));
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain('Record each navigation in a separate step.');
        expect(generateReport(result, 'html')).toContain('Multiple navigations were detected');
      } finally {
        flow.dispose();
        await page.close();
      }
    },
  );
});
