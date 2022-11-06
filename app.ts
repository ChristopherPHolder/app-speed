import { execSync } from 'node:child_process';
import { takeNextScheduledAudit } from './sqs-scheduler';
import { uploadResultsToBucket } from './s3-uploader';
import {AuditRunParams} from "./types";

(async function conductor(): Promise<void> {
    const nextAuditRunParams = await takeNextScheduledAudit();
    if (!nextAuditRunParams) {
        execSync("sudo shutdown -h now");
    }

    const { targetUrl, requesterId } = nextAuditRunParams as AuditRunParams;
    console.log('Requester ID', requesterId);
    try {
        execSync(`npx user-flow --url=${targetUrl} --open=false`);
        await uploadResultsToBucket(targetUrl);
    } catch (error) {
        console.log(error);
    }

    await conductor();
})();