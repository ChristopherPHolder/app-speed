import { PuppeteerRunnerExtension, Step, UserFlow as UserFlowRecording } from '@puppeteer/replay';
import type { Browser, Page } from 'puppeteer';
import type { UserFlow } from 'lighthouse';
import {
  isReplayUserflowStep,
  isReplayUserflowStepWithFlags,
  ReplayUserflowStepSchema,
} from '@app-speed/audit/contracts';
import { CustomStepParamsSchema } from '@app-speed/audit/model';
import { Schema } from 'effect';

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
  }

  override async runStep(
    step: Step | typeof ReplayUserflowStepSchema.Type,
    flowRecording: UserFlowRecording,
  ): Promise<void> {
    if (!Schema.is(CustomStepParamsSchema)(step)) {
      return super.runStep(step as Step, flowRecording);
    }

    if (isReplayUserflowStep(step)) {
      if (isReplayUserflowStepWithFlags(step)) {
        return this.flow[step.name](step.parameters);
      }
      // @ts-ignore
      return this.flow[step.name]();
    }

    throw new Error(`Unknown custom step type ${JSON.stringify(step)}`);
  }
}
