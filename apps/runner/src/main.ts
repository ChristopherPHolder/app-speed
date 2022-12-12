// import {environment} from './environments/environment';
import {takeNextScheduledAudit} from './app/queue';
import {execSync} from 'node:child_process';
import { uploadResultsToBucket } from './app/store';
import { sendAuditResults } from './app/results';
import { UfoRunner } from './app/runner';


(async function run(): Promise<void> {
  const nextAuditRunParams = await takeNextScheduledAudit();
  if (!nextAuditRunParams) {
    execSync('exit 0', {shell: '/bin/bash'});
    execSync('sudo shutdown -h now', {shell: '/bin/bash'});
    return;
  }

  try {
    const {targetUrl, requesterId, endpoint} = nextAuditRunParams;
    const auditResults = await new UfoRunner({ targetUrl }).run();
    const resultsUrl = await uploadResultsToBucket(targetUrl, auditResults);
    await sendAuditResults(requesterId, endpoint, resultsUrl);
  } catch (error: unknown) {
    console.log(error);
  }

  await run();
})();
