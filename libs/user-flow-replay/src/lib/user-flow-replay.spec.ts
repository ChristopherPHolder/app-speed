import { describe, it, expect } from 'vitest';
import { UserFlowAudit, UserFlowAuditConfiguration } from './user-flow-replay';

describe('userFlowReplay', () => {
  it('should work', async () => {

    const replayScript = {
      title: 'Example Title',
      steps: [
        {
          type: 'navigate',
          url: 'https://google.com',
          name: 'Navigate to Google.com'
        }
      ]
    }

    const auditConfiguration: UserFlowAuditConfiguration = {
      options: {},
      replayScript: replayScript
    };

    const userFlowAudit = new UserFlowAudit(auditConfiguration);
    const results = await userFlowAudit.run();

    expect(results.jsonReport.name).toEqual(replayScript.title);
  }, 50_000);
});
