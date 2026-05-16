import type { UserFlow } from 'lighthouse';
import { MapLiteralStep, StrictExtract } from '../type-utils';

type CallableKeys<T> = {
  [K in keyof T]-?: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T] &
  string;

type UserFlowCallSignature = CallableKeys<UserFlow>;
type RunnerOnlyCustomStep = 'clearCache' | 'addCookie';

type LighthouseSupportedStep = StrictExtract<
  UserFlowCallSignature,
  'startNavigation' | 'endNavigation' | 'startTimespan' | 'endTimespan' | 'snapshot'
>;

export const LIGHTHOUSE_AUDIT_STEP_TYPE = {
  START_NAVIGATION: 'startNavigation',
  END_NAVIGATION: 'endNavigation',
  START_TIMESPAN: 'startTimespan',
  END_TIMESPAN: 'endTimespan',
  SNAPSHOT: 'snapshot',
  CLEAR_CACHE: 'clearCache',
  ADD_COOKIE: 'addCookie',
} as const satisfies MapLiteralStep<LighthouseSupportedStep | RunnerOnlyCustomStep>;
