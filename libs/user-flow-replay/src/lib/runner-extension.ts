import {
    PuppeteerRunnerExtension,
    Step,
    UserFlow as UserFlowRecording,
} from '@puppeteer/replay';
import {Browser, Page} from "puppeteer";
import { AppSpeedUserFlowStep,
} from 'shared';
import { isMeasureType } from "./utils";
import { UserFlow } from 'lighthouse';

export class UserFlowRunnerExtension extends PuppeteerRunnerExtension {

    constructor(browser: Browser, page: Page, private flow: UserFlow, opts?: {
        timeout?: number;
    }) {
        super(browser, page, opts);
    }

    override async runStep(step: AppSpeedUserFlowStep, flowRecording: UserFlowRecording): Promise<void> {
        if (!isMeasureType(step.type)) {
            return super.runStep(step as Step, flowRecording);
        }
        if (step.type === 'endTimespan' || step.type === 'endNavigation') {
            return this.flow[step.type]();
        }
        if (step.type === 'startNavigation') {
            return this.flow[step.type]({ ...step.stepOptions })
        }
        if (step.type === 'startTimespan') {
            return this.flow[step.type]({...step.flags})
        }
    }
}
