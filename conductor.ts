import { execSync } from 'node:child_process';
import { takeNextScheduledAudit } from './sqs-scheduler';
import { uploadResultsToBucket } from './s3-uploader';

async function conductor(): Promise<void> {
  const target = await takeNextScheduledAudit();

  if (!target) {
   execSync("sudo shutdown -h now");
  }
  const urlString = target as string;
  try {
    execSync(`npx user-flow --url=${target} --open=false`);
    await uploadResultsToBucket(urlString);
  } catch (error) {
    console.log(error);
  }
  
  await conductor();
}

conductor();