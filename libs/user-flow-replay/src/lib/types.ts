import {
  Step as PuppeteerReplayStep,
  StepType as PuppeteerReplayStepType,
  UserFlow as PuppeteerReplayUserFlow,
} from '@puppeteer/replay';
import UserFlow from 'lighthouse/types/user-flow';
import LighthouseStepFlags = UserFlow.StepFlags;

export { PuppeteerReplayStepType };
// @TODO Move to global types and explain what it does
type Modify<T, R> = Omit<T, keyof R> & R;

export declare enum LighthouseStepType {
  StartNavigation = 'startNavigation',
  EndNavigation = 'endNavigation',
  StartTimespan = 'startTimespan',
  EndTimespan = 'endTimespan',
  Snapshot = 'snapshot',
}

export type MeasureModes =
  LighthouseStepType.StartNavigation |
  LighthouseStepType.EndNavigation |
  LighthouseStepType.StartTimespan |
  LighthouseStepType.EndTimespan |
  LighthouseStepType.Snapshot;



export interface StartNavigationStep {
  type: LighthouseStepType.StartNavigation;
  stepOptions?: LighthouseStepFlags
}

export interface EndNavigationStep {
  type: LighthouseStepType.EndNavigation;
}

export interface StartTimespanStep {
  type: LighthouseStepType.StartTimespan;
  flags?: LighthouseStepFlags
}

export interface EndTimespanStep {
  type: LighthouseStepType.EndTimespan;
}

export interface SnapshotStep {
  type: LighthouseStepType.Snapshot;
  flags?: LighthouseStepFlags
}

export type LighthouseStep = StartNavigationStep | EndNavigationStep | StartTimespanStep | EndTimespanStep | SnapshotStep;

export type AppSpeedUserFlowStep = PuppeteerReplayStep | LighthouseStep;

export type AppSpeedUserFlow = Modify<PuppeteerReplayUserFlow, {
  steps: AppSpeedUserFlowStep[];
}>;
// It should work with an empty user-flow
const example0: AppSpeedUserFlow = {
  title: 'Example Title',
  steps: []
}

// It should work with a puppeteer step
const example1: AppSpeedUserFlow = {
  title: 'Example Title',
  steps: [
    {
      type: PuppeteerReplayStepType.Navigate,
      url: 'https://example.com'
    }
  ]
}

const replayStep: PuppeteerReplayStep = {
  type: PuppeteerReplayStepType.Navigate,
  url: 'https://example.com'
}

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
