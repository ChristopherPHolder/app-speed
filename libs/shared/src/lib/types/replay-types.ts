import type {
  Step as PuppeteerReplayStep,
  StepType as PuppeteerReplayStepType,
  UserFlow as PuppeteerReplayUserFlow,
} from '@puppeteer/replay';
import type { Flags } from 'lighthouse';

export type { PuppeteerReplayStepType };
// @TODO Move to global types and explain what it does
type Modify<T, R> = Omit<T, keyof R> & R;

interface LighthouseStepFlags extends Flags {
  name?: string;
}
export const LighthouseStepType = {
  StartNavigation: 'startNavigation',
  EndNavigation: 'endNavigation',
  StartTimespan: 'startTimespan',
  EndTimespan: 'endTimespan',
  Snapshot: 'snapshot',
} as const;

export type MeasureModes =
  typeof LighthouseStepType.StartNavigation |
  typeof LighthouseStepType.EndNavigation |
  typeof LighthouseStepType.StartTimespan |
  typeof LighthouseStepType.EndTimespan |
  typeof LighthouseStepType.Snapshot;

export interface StartNavigationStep {
  type: typeof LighthouseStepType.StartNavigation;
  stepOptions?: LighthouseStepFlags
}

export interface EndNavigationStep {
  type: typeof LighthouseStepType.EndNavigation;
}

export interface StartTimespanStep {
  type: typeof LighthouseStepType.StartTimespan;
  flags?: Flags
}

export interface EndTimespanStep {
  type: typeof LighthouseStepType.EndTimespan;
}

export interface SnapshotStep {
  type: typeof LighthouseStepType.Snapshot;
  flags?: Flags;
}

export declare type LighthouseStep = StartNavigationStep | EndNavigationStep | StartTimespanStep | EndTimespanStep | SnapshotStep;

export declare type AppSpeedUserFlowStep = PuppeteerReplayStep | LighthouseStep;

export type AppSpeedUserFlow = Modify<PuppeteerReplayUserFlow, {
  steps: AppSpeedUserFlowStep[];
}>;
// It should work with an empty user-flow
const example0: AppSpeedUserFlow = {
  title: 'Example Title',
  steps: []
}

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
      type: LighthouseStepType.StartNavigation,
      stepOptions: {
        name: 'Example Step name'
      }
    }
  ]
}
