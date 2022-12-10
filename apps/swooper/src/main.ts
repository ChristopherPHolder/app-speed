import {environment} from './environments/environment';
import {takeNextScheduledAudit} from './app/queue';
import {execSync} from 'node:child_process';
import { uploadResultsToBucket } from './app/store';
import { sendAuditResults } from './app/results';


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
    execSync(`npx user-flow --url=${targetUrl} --open=false`, {shell: '/bin/bash'});
    const resultsUrl = await uploadResultsToBucket(targetUrl);
    await sendAuditResults(requesterId, endpoint, resultsUrl);
  } catch (error: unknown) {
    console.log(error);
  }

  await swoop();
})();
