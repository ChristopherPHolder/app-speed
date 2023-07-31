import {
  Step as PuppeteerReplayStep,
  StepType as PuppeteerReplayStepType,
  UserFlow as PuppeteerReplayUserFlow,
} from '@puppeteer/replay';
import UserFlow from 'lighthouse/types/user-flow';
import LighthouseStepFlags = UserFlow.StepFlags;

// @TODO Move to global types and explain what it does
type Modify<T, R> = Omit<T, keyof R> & R;

/**
 *  'navigation' is already covered by `@puppeteer/replay`
 */
export type MeasureModes = 'startNavigation' | 'endNavigation' |'snapshot' | 'startTimespan' | 'endTimespan';
declare enum LighthouseStepType {
  StartNavigation = 'startNavigation',
  EndNavigation = 'endNavigation',
  StartTimespan = 'startTimespan',
  EndTimespan = 'endTimespan',
  Snapshot = 'snapshot',
}


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

type LighthouseStep = StartNavigationStep | EndNavigationStep | StartTimespanStep | EndTimespanStep | SnapshotStep;

export type MeasurementStep = {
  type: MeasureModes;
  stepOptions?: { name?: string; }
  url?: string;
}

export type UserFlowRecordingStep = MeasurementStep | PuppeteerReplayStep;

export type UserFlowReportJson = Modify<PuppeteerReplayUserFlow, {
  steps: UserFlowRecordingStep[];
}>;

export type AppSpeedUserFlowStep = PuppeteerReplayStep | LighthouseStep;

export type AppSpeedUserFlow =  {
  /**
   * Human-readble title describing the recorder user flow.
   */
  title: string;
  /**
   * Timeout in milliseconds.
   */
  timeout?: number;
  /**
   * The name of the attribute to use to generate selectors instead of regular
   * CSS selectors. For example, specifying `data-testid` would generate the
   * selector `[data-testid=value]` for the element `<div data-testid=value>`.
   */
  selectorAttribute?: string;
  steps: AppSpeedUserFlowStep[];
}

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
