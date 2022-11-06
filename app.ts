import { execSync } from 'node:child_process';
import { takeNextScheduledAudit } from './sqs-scheduler';
import { uploadResultsToBucket } from './s3-uploader';
import {AuditRunParams} from "./types";
import {sendAuditResults} from "./sendResults";

(async function conductor(): Promise<void> {
    const nextAuditRunParams = await takeNextScheduledAudit();
    if (!nextAuditRunParams) {
        execSync("sudo shutdown -h now");
    }

    const { targetUrl, requesterId, endpoint } = nextAuditRunParams as AuditRunParams;
    console.log('Target Url', targetUrl, 'Requester ID', requesterId, 'Endpoint', endpoint);
    try {
        execSync(`npx user-flow --url=${targetUrl} --open=false`);
        const uploadResponse = await uploadResultsToBucket(targetUrl);
        console.log(uploadResponse);
        await sendAuditResults(requesterId, endpoint);
    } catch (error) {
        console.log(error);
    }
    await conductor();
})();