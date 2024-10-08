import { PuppeteerRunnerExtension, Step, UserFlow as UserFlowRecording } from '@puppeteer/replay';
import { Browser, Page } from 'puppeteer';
import { AppSpeedUserFlowStep } from '@app-speed/shared';
import { isMeasureType } from './utils';
import { UserFlow } from 'lighthouse';

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

  override async runStep(step: AppSpeedUserFlowStep, flowRecording: UserFlowRecording): Promise<void> {
    if (!isMeasureType(step.type)) {
      return super.runStep(step as Step, flowRecording);
    }
    if (step.type === 'endTimespan') {
      try {
        await this.page.waitForNetworkIdle({ timeout: 10_000 });
      } catch (e) {
        console.log(e);
      }
    }
    if (step.type === 'endTimespan' || step.type === 'endNavigation') {
      return this.flow[step.type]();
    }
    if (step.type === 'startNavigation' || step.type === 'startTimespan' || step.type === 'snapshot') {
      return this.flow[step.type]({ name: step.name });
    }
  }
}
