import { describe, expect, it } from 'vitest';
import { UserFlowAudit, UserFlowAuditConfiguration } from './user-flow-replay';
import { writeFileSync } from 'fs';
import { AppSpeedUserFlow, LighthouseStepType, PuppeteerReplayStepType } from './types';

describe('userFlowReplay', () => {
  it('should work', async () => {

    const replayScript: AppSpeedUserFlow = {
      title: 'Example Title',
      steps: [
        {
          type: LighthouseStepType.StartNavigation,
          stepOptions: { name: 'Initial Navigation' }
        },
        {
          type:  PuppeteerReplayStepType.Navigate,
          url: 'https://google.com',
        },
        { type: LighthouseStepType.EndNavigation }
      ]
    }

    const auditConfiguration: UserFlowAuditConfiguration = {
      options: {},
      replayScript: replayScript
    };

    const userFlowAudit = new UserFlowAudit(auditConfiguration);
    const results = await userFlowAudit.run();
    writeFileSync('e.html', results.htmlReport, 'utf8');
    expect(results.jsonReport).toBeTruthy();
    expect(results.jsonReport).toContain(replayScript.title);
  }, 50_000);
});
