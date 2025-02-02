import { execSync } from 'node:child_process';
import { Injectable, Logger } from '@nestjs/common';

import {
  DescribeInstanceStatusCommand,
  DescribeInstanceStatusCommandOutput,
  EC2Client,
  StartInstancesCommand,
  StartInstancesCommandOutput,
  waitUntilInstanceRunning,
} from '@aws-sdk/client-ec2';

const EC2_CLIENT_CONFIG = { region: 'us-east-1' };
const INSTANCE_IDS = ['i-0781d8307e3c9e9f7'];

@Injectable()
export class RunnerManagerService {
  readonly #logger = new Logger(RunnerManagerService.name);
  ec2Client = new EC2Client(EC2_CLIENT_CONFIG);

  async activateRunner(local = true) {
    this.#logger.log('Activate Runner');

    return execSync('echo "' + local + '"');

    // const instanceStatus = await this.#instanceState();
    // if (instanceStatus.InstanceStatuses?.length) {
    //   // @TODO improve vandling of instance already active by validating its running correctly
    //   return;
    // }
    // await this.#activateInstance();
    // await this.#waitForActivation();
  }

  #instanceState(): Promise<DescribeInstanceStatusCommandOutput> {
    const descStatusCmd = new DescribeInstanceStatusCommand({ InstanceIds: INSTANCE_IDS, DryRun: false });
    return this.ec2Client.send(descStatusCmd);
  }

  #activateInstance(): Promise<StartInstancesCommandOutput> {
    const startCmd = new StartInstancesCommand({ InstanceIds: INSTANCE_IDS, DryRun: false });
    return this.ec2Client.send(startCmd);
  }

  #waitForActivation() {
    const WaiterParams = { client: this.ec2Client, maxWaitTime: 120 };
    return waitUntilInstanceRunning(WaiterParams, { InstanceIds: INSTANCE_IDS, DryRun: false });
  }

  #runActivationScript() {
    console.log('run script');
  }
}
