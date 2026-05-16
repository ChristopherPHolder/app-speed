import type { Step as PuppeteerReplayStep, UserFlow as PuppeteerReplayUserFlow } from '@puppeteer/replay';
import { PUPPETEER_REPLAY_CUSTOM_STEP_TYPE } from '../puppeteer-replay/puppeteer-replay-step-type';
import { AUDIT_CUSTOM_STEP_TYPE } from '../custom-audit-step-type';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from '../lighthouse-userflow/lighthouse-userflow-step-type';

// @TODO Move to global types and explain what it does
type Modify<T, R> = Omit<T, keyof R> & R;

interface StartNavigationStep {
  type: typeof PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP;
  step: typeof LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION;
  name?: string;
}

interface EndNavigationStep {
  type: typeof PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP;
  step: typeof LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION;
}

interface StartTimespanStep {
  type: typeof PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP;
  step: typeof LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN;
  name?: string;
}

interface EndTimespanStep {
  type: typeof PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP;
  step: typeof LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN;
}

interface SnapshotStep {
  type: typeof PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP;
  step: typeof LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT;
  name?: string;
}

interface ClearCacheStep {
  type: typeof PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP;
  step: typeof AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE;
}

interface AddCookieStep {
  type: typeof PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP;
  step: typeof AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE;
  name: string;
  value: string;
  url: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

type LighthouseStep =
  | StartNavigationStep
  | EndNavigationStep
  | StartTimespanStep
  | EndTimespanStep
  | SnapshotStep
  | ClearCacheStep
  | AddCookieStep;

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

// const example2: AppSpeedUserFlow = {
//   title: 'Example Title',
//   steps: [
//     {
//       type: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
//       name: 'Example Step name',
//     },
//   ],
// };
