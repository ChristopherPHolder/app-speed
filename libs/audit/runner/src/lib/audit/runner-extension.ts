import { PuppeteerRunnerExtension, Step, UserFlow as UserFlowRecording } from '@puppeteer/replay';
import type { Browser, Page } from 'puppeteer';
import type { UserFlow } from 'lighthouse';
import {
  ReplayUserflowStepSchema,
  UserflowAuditStepTypeScheme,
  UserflowStepTypeWithoutStepFlagsLiteral,
  UserflowStepTypeWithStepFlagsLiteral,
} from '@app-speed/audit/domain';
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
    // TODO refactor parsing custom types
    if (step.type !== 'customStep') {
      return super.runStep(step as Step, flowRecording);
    }
    if (Schema.is(UserflowAuditStepTypeScheme)(step.name)) {
      if (Schema.is(UserflowStepTypeWithStepFlagsLiteral)(step.name)) {
        // @ts-expect-error require fixing parser
        return this.flow[step.name](step.parameters);
      }
      if (Schema.is(UserflowStepTypeWithoutStepFlagsLiteral)(step.name)) {
        return this.flow[step.name]();
      }
    }

    throw new Error(`Unknown custom step type ${JSON.stringify(step)}`);
  }
}
