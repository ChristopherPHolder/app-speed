import { execSync } from 'node:child_process';
import { takeNextScheduledAudit } from './sqs-scheduler';

async function conductor(): Promise<void> {
  const target = await takeNextScheduledAudit();

  if (!target) {
   execSync("sudo shutdown -h now");
  }
  
  try {
    execSync(`npx user-flow --url=${target} --open=false`);
    execSync(`node s3-uploader ${target}`);
  } catch (error) {
    console.log(error);
  }
  
  await conductor();
}

conductor();