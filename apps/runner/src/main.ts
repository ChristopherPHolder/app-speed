import { takeNextScheduledAudit } from './app/queue';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { execSync } from 'node:child_process';
import { uploadResultsToBucket } from './app/store';
import { sendAuditResults } from './app/results';
// TODO This app will be completly deleted once the new one is deployed :)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { UserFlowRunner } from 'user-flow-runner';

(async function run(): Promise<void> {
  const nextAuditRunParams = await takeNextScheduledAudit();
  if (!nextAuditRunParams) {
    execSync('shutdown -h -t 5 & exit 0', { shell: '/bin/bash' });
    return;
  }

  try {
    const { targetUrl, requesterId, endpoint } = nextAuditRunParams;
    const auditResults = await new UserFlowRunner().run({ targetUrl });
    const resultsUrl = await uploadResultsToBucket(targetUrl, auditResults);
    await sendAuditResults(requesterId, endpoint, resultsUrl);
  } catch (error: unknown) {
    console.log(error);
  }

  await run();
})();
