import {
  UserFlow as PuppeteerReplayUserFlow,
  Step as PuppeteerReplayStep
} from '@puppeteer/replay';
import { UserFlow as LightHouseUserFlow } from 'lighthouse';

// @TODO Move to global types and explain what it does
type Modify<T, R> = Omit<T, keyof R> & R;

type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

export type LhUserFlowStep = FunctionKeys<LightHouseUserFlow>;

/**
 *  'navigation' is already covered by `@puppeteer/replay`
 */
export type MeasureModes = 'navigate' | 'startNavigation' | 'endNavigation' |'snapshot' | 'startTimespan' | 'endTimespan';

/*
// Consider modify the Step type
  | Modify<Step, {
  type: MeasureModes,
}>;*/
export type MeasurementStep = {
  type: MeasureModes;
  stepOptions?: { name?: string; }
  url?: string;
}

export type UserFlowRecordingStep = MeasurementStep | PuppeteerReplayStep;

export type UserFlowReportJson = Modify<PuppeteerReplayUserFlow, {
  steps: UserFlowRecordingStep[];
}>;

export type ReadFileExtTypes = { json: object, html: string, text: string };
export type ReadFileConfig = { fail?: boolean, ext?: keyof ReadFileExtTypes};
