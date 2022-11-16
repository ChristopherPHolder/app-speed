import {execSync} from 'node:child_process';
import {takeNextScheduledAudit} from './app/sqs-scheduler';
import {uploadResultsToBucket} from './app/s3-uploader';
import {sendAuditResults} from './app/sendResults';

import * as dotenv from 'dotenv';
dotenv.config();

(async function runner(): Promise<void|string> {
    const nextAuditRunParams = await takeNextScheduledAudit();
    if (!nextAuditRunParams) {
        execSync('exit 0', {shell: '/bin/bash'});
        return execSync('sudo shutdown -h now', {shell: '/bin/bash'}).toString();
    }

    try {
        const {targetUrl, requesterId, endpoint} = nextAuditRunParams;
        execSync(`npx user-flow --url=${targetUrl} --open=false`, {shell: '/bin/bash'});
        const resultsUrl = await uploadResultsToBucket(targetUrl);
        await sendAuditResults(requesterId, endpoint, resultsUrl);
    } catch (error: unknown) {
        console.log(error);
    }

    await runner();
})();