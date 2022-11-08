import {execSync} from 'node:child_process';
import {takeNextScheduledAudit} from './sqs-scheduler';
import {uploadResultsToBucket} from './s3-uploader';
import {sendAuditResults} from './sendResults';

(async function conductor(): Promise<void> {
	const nextAuditRunParams = await takeNextScheduledAudit();
	if (!nextAuditRunParams) {
		execSync('sudo shutdown -h && exit 0', {shell: '/bin/bash'});
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

	await conductor();
})();
