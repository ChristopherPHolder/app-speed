import { describe, expect, it } from 'vitest';
import { UserFlowAudit } from './user-flow-replay';
import { writeFileSync } from 'fs';

describe('userFlowReplay', () => {
  it('should work', async () => {

    const replayScript= {
      title: 'Example Title',
      steps: [
        {
          type: 'startNavigation',
          stepOptions: { name: 'Initial Navigation' }
        },
        {
          type:  'navigate',
          url: 'https://google.com',
        },
        { type: 'endNavigation' }
      ]
    }

    const userFlowAudit = new UserFlowAudit(replayScript);
    const results = await userFlowAudit.run();
    writeFileSync('e.html', results.htmlReport, 'utf8');
    expect(results.jsonReport).toBeTruthy();
    expect(results.jsonReport).toContain(replayScript.title);
  }, 50_000);
});
