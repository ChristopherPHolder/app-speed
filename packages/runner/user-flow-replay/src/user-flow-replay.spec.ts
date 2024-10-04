import { describe, expect, it } from 'vitest';
import { UserFlowAudit } from './user-flow-replay';
import { writeFileSync } from 'fs';

describe.skip('userFlowReplay', () => {
  it('should work', async () => {
    const replayScript = {
      title: 'Example Title',
      steps: [
        {
          type: 'startNavigation',
          stepOptions: { name: 'Initial Navigation' },
        },
        {
          type: 'navigate',
          url: 'https://google.com',
        },
        { type: 'endNavigation' },
      ],
    };

    const userFlowAudit = new UserFlowAudit(replayScript);
    const results = await userFlowAudit.run();
    writeFileSync('e.html', results.htmlReport, 'utf8');
    expect(results.jsonReport).toBeTruthy();
    expect(results.jsonReport).toContain(replayScript.title);
  }, 50_000);

  it('should run timespan audits', async () => {
    const replayScript = {
      title: 'Example Title',
      steps: [
        {
          type: 'startNavigation',
          name: 'Initial Navigation',
        },
        {
          type: 'navigate',
          url: 'https://deep-blue.io',
        },
        { type: 'endNavigation' },
        { type: 'startTimespan', name: 'Initial Timespan' },
        {
          type: 'click',
          offsetX: 10,
          offsetY: 10,
          selectors: [
            '#gatsby-focus-wrapper > main > div.it-services-banner > div > div > div:nth-child(1) > div > div > a',
          ],
        },

        { type: 'endTimespan' },
        { type: 'snapshot', name: 'Snapshot test' },
      ],
    };

    const userFlowAudit = new UserFlowAudit(replayScript);
    const results = await userFlowAudit.run();
    writeFileSync('e.html', results.htmlReport, 'utf8');
    expect(results.jsonReport).toBeTruthy();
    expect(results.jsonReport).toContain(replayScript.title);
  }, 50_000);
});
