import { UserFlowRunner, AuditParams } from './user-flow-runner';

describe('UserFlowRunner', () => {
  it('should return an html and json report', async () => {
    const runner = new UserFlowRunner();
    const params: AuditParams = { targetUrl: 'https://www.google.com/' };
    const results = await runner.run(params);
    expect(results.htmlReport).toBeTruthy();
    expect(results.jsonReport).toBeTruthy();
  }, 60_000);
});
