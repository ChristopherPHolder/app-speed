import { UserFlow, Step } from '@puppeteer/replay';

// @TODO Move to global types and explain what it does
type Modify<T, R> = Omit<T, keyof R> & R;

/**
 *  'navigation' is already covered by `@puppeteer/replay`
 */
export type MeasureModes = 'navigate' |'snapshot' | 'startTimespan' | 'endTimespan';

/*
// Consider modify the Step type
  | Modify<Step, {
  type: MeasureModes,
}>;*/
export type MeasurementStep = {
  type: MeasureModes;
  stepOptions?: { stepName?: string; }
  url?: string;
}

export type UserFlowRecordingStep = MeasurementStep | Step;

export type UserFlowReportJson = Modify<UserFlow, {
  steps: UserFlowRecordingStep[];
}>;

export type ReadFileExtTypes = { json: object, html: string, text: string };
export type ReadFileConfig = { fail?: boolean, ext?: keyof ReadFileExtTypes};
