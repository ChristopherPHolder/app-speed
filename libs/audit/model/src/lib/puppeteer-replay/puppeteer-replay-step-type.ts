import type { StepType } from '@puppeteer/replay';
import { CamelToScreamingSnake } from '../type-utils';

type EnumLiteral<T extends string> = `${T}`;

type MapEnumLiteral<T extends string> = {
  [K in EnumLiteral<T> as CamelToScreamingSnake<K>]: EnumLiteral<K>;
};

type PuppeteerReplayStepType = MapEnumLiteral<StepType>;

type PuppeteerReplayAssertionStepType = Pick<PuppeteerReplayStepType, 'WAIT_FOR_ELEMENT' | 'WAIT_FOR_EXPRESSION'>;

export const PUPPETEER_REPLAY_ASSERTION_STEP_TYPE = {
  WAIT_FOR_ELEMENT: 'waitForElement',
  WAIT_FOR_EXPRESSION: 'waitForExpression',
} as const satisfies PuppeteerReplayAssertionStepType;

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
  PuppeteerReplayStepType,
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
