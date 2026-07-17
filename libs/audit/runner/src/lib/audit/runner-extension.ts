import { PuppeteerRunnerExtension, Step, UserFlow as UserFlowRecording } from '@puppeteer/replay';
import type { Browser, Page } from 'puppeteer';
import type { UserFlow } from 'lighthouse';
import {
  AUDIT_CUSTOM_STEP_TYPE,
  LIGHTHOUSE_AUDIT_STEP_TYPE,
  ReplayAuditCustomStepSchema,
  ReplayUserflowStepSchema,
} from '@app-speed/audit/domain';
import { Schema } from 'effect';
import { setTimeout as waitForTime } from 'node:timers/promises';

const ReplayRunnerCustomStepSchema = Schema.Union(ReplayUserflowStepSchema, ReplayAuditCustomStepSchema);
const decodeReplayRunnerCustomStep = Schema.decodeUnknownSync(ReplayRunnerCustomStepSchema);

export class UserFlowRunnerExtension extends PuppeteerRunnerExtension {
  constructor(
    browser: Browser,
    page: Page,
    private flow: UserFlow,
    opts?: {
      timeout?: number;
    },
  ) {
    super(browser, page, opts);
    this.auditTimeout = opts?.timeout ?? 30_000;
  }

  private readonly auditTimeout: number;

  override async runStep(
    step: Step | typeof ReplayRunnerCustomStepSchema.Type,
    flowRecording: UserFlowRecording,
  ): Promise<void> {
    if (step.type === 'customStep') {
      return await this.runCustomStep(decodeReplayRunnerCustomStep(step));
    }

    return await super.runStep(step as Step, flowRecording);
  }

  async runCustomStep(step: typeof ReplayRunnerCustomStepSchema.Type) {
    switch (step.name) {
      case LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION:
      case LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN:
      case LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT:
        return this.flow[step.name](step.parameters);
      case LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION:
      case LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN:
        return this.flow[step.name]();
      case AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE:
        return await this.page.createCDPSession().then((client) => client.send('Network.clearBrowserCache'));
      case AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE:
        return await this.page.setCookie(step.parameters);
      case AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_TIME:
        return await waitForTime(step.parameters.seconds * 1000);
      case AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_NETWORK_IDLE:
        return await this.page.waitForNetworkIdle({
          ...step.parameters,
          timeout: step.parameters.timeout ?? this.auditTimeout,
        });
    }

    return assertNever(step);
  }
}

const assertNever = (step: never): never => {
  throw new Error(`Unsupported replay custom step: ${JSON.stringify(step)}`);
};
