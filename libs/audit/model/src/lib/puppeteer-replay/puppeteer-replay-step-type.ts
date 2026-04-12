import type { StepType } from '@puppeteer/replay';
import { AssertNever, EnumLiteral, MapEnumLiteral } from '../type-utils';
import { Schema } from 'effect';

export const PUPPETEER_REPLAY_ASSERTION_STEP_TYPE = {
  WAIT_FOR_ELEMENT: 'waitForElement',
  WAIT_FOR_EXPRESSION: 'waitForExpression',
} as const satisfies Pick<MapEnumLiteral<StepType>, 'WAIT_FOR_ELEMENT' | 'WAIT_FOR_EXPRESSION'>;

export const PUPPETEER_REPLAY_USER_STEP_TYPE = {
  CHANGE: 'change',
  CLICK: 'click',
  CLOSE: 'close',
  DOUBLE_CLICK: 'doubleClick',
  EMULATE_NETWORK_CONDITIONS: 'emulateNetworkConditions',
  HOVER: 'hover',
  KEY_DOWN: 'keyDown',
  KEY_UP: 'keyUp',
  NAVIGATE: 'navigate',
  SCROLL: 'scroll',
  SET_VIEWPORT: 'setViewport',
} as const satisfies Pick<
  MapEnumLiteral<StepType>,
  | 'CHANGE'
  | 'CLICK'
  | 'CLOSE'
  | 'DOUBLE_CLICK'
  | 'EMULATE_NETWORK_CONDITIONS'
  | 'HOVER'
  | 'KEY_DOWN'
  | 'KEY_UP'
  | 'NAVIGATE'
  | 'SCROLL'
  | 'SET_VIEWPORT'
>;

export const PUPPETEER_REPLAY_CUSTOM_STEP_TYPE = {
  CUSTOM_STEP: 'customStep',
} as const satisfies Pick<MapEnumLiteral<StepType>, 'CUSTOM_STEP'>;

const PUPPETEER_REPLAY_STEP_TYPE = [
  PUPPETEER_REPLAY_USER_STEP_TYPE.CHANGE,
  PUPPETEER_REPLAY_USER_STEP_TYPE.CLICK,
  PUPPETEER_REPLAY_USER_STEP_TYPE.CLOSE,
  PUPPETEER_REPLAY_USER_STEP_TYPE.DOUBLE_CLICK,
  PUPPETEER_REPLAY_USER_STEP_TYPE.EMULATE_NETWORK_CONDITIONS,
  PUPPETEER_REPLAY_USER_STEP_TYPE.HOVER,
  PUPPETEER_REPLAY_USER_STEP_TYPE.KEY_DOWN,
  PUPPETEER_REPLAY_USER_STEP_TYPE.KEY_UP,
  PUPPETEER_REPLAY_USER_STEP_TYPE.NAVIGATE,
  PUPPETEER_REPLAY_USER_STEP_TYPE.SCROLL,
  PUPPETEER_REPLAY_USER_STEP_TYPE.SET_VIEWPORT,
  PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE.WAIT_FOR_ELEMENT,
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE.WAIT_FOR_EXPRESSION,
] as const satisfies EnumLiteral<StepType>[];

export const PuppeteerReplayStepTypeSchema = Schema.Literal(...PUPPETEER_REPLAY_STEP_TYPE);

/**
 * Assert all puppeteer replay key are being used in the PUPPETEER_REPLAY_KEY literal
 *
 * This is required as we can only use @puppeteer/replay as a type due to its dependencies
 * which would mean it cannot be used in browser bundles.
 */
type _AssertNoMissingPuppeteerReplayKeys = AssertNever<
  Exclude<EnumLiteral<StepType>, (typeof PUPPETEER_REPLAY_STEP_TYPE)[number]>
>;
