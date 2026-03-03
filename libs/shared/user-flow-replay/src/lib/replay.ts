import type { Step as PuppeteerReplayStep, UserFlow as PuppeteerReplayUserFlow } from '@puppeteer/replay';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from './step-type';

// @TODO Move to global types and explain what it does
type Modify<T, R> = Omit<T, keyof R> & R;

interface StartNavigationStep {
  type: typeof LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION;
  name?: string;
}

interface EndNavigationStep {
  type: typeof LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION;
}

interface StartTimespanStep {
  type: typeof LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN;
  name?: string;
}

interface EndTimespanStep {
  type: typeof LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN;
}

interface SnapshotStep {
  type: typeof LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT;
  name?: string;
}

type LighthouseStep = StartNavigationStep | EndNavigationStep | StartTimespanStep | EndTimespanStep | SnapshotStep;

export type AppSpeedUserFlowStep = PuppeteerReplayStep | LighthouseStep;

export type AppSpeedUserFlow = Modify<
  PuppeteerReplayUserFlow,
  {
    steps: AppSpeedUserFlowStep[];
  }
>;

// It should work with a puppeteer step
// const example1: AppSpeedUserFlow = {
//   title: 'Example Title',
//   steps: [
//     {
//       type: PuppeteerReplayStepType.Navigate,
//       url: 'https://example.com'
//     }
//   ]
// }
//
// const replayStep: PuppeteerReplayStep = {
//   type: PuppeteerReplayStepType.Navigate,
//   url: 'https://example.com'
// }

const example2: AppSpeedUserFlow = {
  title: 'Example Title',
  steps: [
    {
      type: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
      name: 'Example Step name',
    },
  ],
};
