import {environment} from './environments/environment';
import {takeNextScheduledAudit} from './app/queue';
import {execSync} from 'node:child_process';
import { uploadResultsToBucket } from './app/store';
import { sendAuditResults } from './app/results';
import { runAudits } from './app/audit'


(async function swoop(): Promise<void> {
  const nextAuditRunParams = await takeNextScheduledAudit();
  if (!nextAuditRunParams) {
    if (environment.production) {
      execSync('exit 0', {shell: '/bin/bash'});
      execSync('sudo shutdown -h now', {shell: '/bin/bash'});
    }
    return;
  }

  try {
    const {targetUrl, requesterId, endpoint} = nextAuditRunParams;
    const auditResults = await runAudits({targetUrl});
    const resultsUrl = await uploadResultsToBucket(targetUrl, auditResults);
    await sendAuditResults(requesterId, endpoint, resultsUrl);
  } catch (error: unknown) {
    console.log(error);
  }

  await swoop();
})();
