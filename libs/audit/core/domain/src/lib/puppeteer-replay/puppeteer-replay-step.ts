import type {
  ChangeStep,
  ClickStep,
  CloseStep,
  CustomStep,
  CustomStepParams,
  DoubleClickStep,
  EmulateNetworkConditionsStep,
  HoverStep,
  KeyDownStep,
  KeyUpStep,
  NavigateStep,
  NavigationEvent,
  PointerDeviceType,
  SetViewportStep,
  WaitForElementStep,
  WaitForExpressionStep,
} from '@puppeteer/replay';
import { Schema, SchemaTransformation } from 'effect';
import { PUPPETEER_REPLAY_ASSERTED_EVENT_TYPE } from './puppeteer-replay-asserted-event-type';
import {
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  PUPPETEER_REPLAY_CUSTOM_STEP_TYPE,
  PUPPETEER_REPLAY_USER_STEP_TYPE,
} from './puppeteer-replay-step-type';
import { PointerButtonTypeSchema } from './puppeteer-replay-pointer-button-type';
import { PuppeteerReplayKeySchema } from './puppeteer-replay-key';
import { SchemaTypeWithEnumLiteralDeep } from '../type-utils';
import type { BuilderStepVariantDefinition } from '../builder-step-spec';

const NonNegativeIntSchema = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0));
const TimeoutSchema = Schema.optional(
  Schema.Union([
    NonNegativeIntSchema,
    Schema.NumberFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
  ]).annotate({ identifier: 'Timeout' }),
);

const isValidHttpsOrAboutBlankUrl = (value: string): boolean => {
  if (value === 'about:blank') {
    return true;
  }

  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

export const UrlWithHttpsOrAboutBlankSchema = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^(?:about:blank|https:\/\/.+)$/)),
  Schema.check(
    Schema.makeFilter((value) => isValidHttpsOrAboutBlankUrl(value) || 'Expected an https URL or about:blank'),
  ),
).annotate({ title: 'UrlWithHttpsOrAboutBlank' });

const AssertedEventsSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_ASSERTED_EVENT_TYPE.NAVIGATION),
  title: Schema.optional(Schema.NonEmptyString),
  url: Schema.optional(UrlWithHttpsOrAboutBlankSchema),
}) satisfies SchemaTypeWithEnumLiteralDeep<NavigationEvent>;

const FrameSelectorSchema = Schema.Array(NonNegativeIntSchema);
export const SelectorPathSchema = Schema.Struct({
  segments: Schema.NonEmptyArray(Schema.NonEmptyString),
});
const SelectorsSchema = Schema.Array(SelectorPathSchema);
const ReplaySelectorSchema = Schema.Union([Schema.NonEmptyString, Schema.NonEmptyArray(Schema.NonEmptyString)]);
const ReplaySelectorsSchema = Schema.Array(ReplaySelectorSchema);

type SelectorPath = typeof SelectorPathSchema.Type;
type ReplaySelector = typeof ReplaySelectorSchema.Type;
type NormalizedSelectorStep<TStep extends { selectors: unknown }> = Omit<TStep, 'selectors'> & {
  selectors: SelectorPath[];
};

const PointerDeviceTypeSchema = Schema.Literals([
  'mouse',
  'pen',
  'touch',
]) satisfies SchemaTypeWithEnumLiteralDeep<PointerDeviceType>;

export const ChangeStepSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_USER_STEP_TYPE.CHANGE),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  frame: Schema.optional(FrameSelectorSchema),
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
  value: Schema.NonEmptyString,
}) satisfies SchemaTypeWithEnumLiteralDeep<NormalizedSelectorStep<ChangeStep>>;

export const ClickStepSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_USER_STEP_TYPE.CLICK),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  button: Schema.optional(PointerButtonTypeSchema),
  deviceType: Schema.optional(PointerDeviceTypeSchema),
  duration: Schema.optional(NonNegativeIntSchema),
  frame: Schema.optional(FrameSelectorSchema),
  offsetX: NonNegativeIntSchema,
  offsetY: NonNegativeIntSchema,
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<NormalizedSelectorStep<ClickStep>>;

export const CloseStepSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_USER_STEP_TYPE.CLOSE),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<CloseStep>;

export const CustomStepParamsSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP),
  parameters: Schema.Unknown,
  name: Schema.NonEmptyString,
}) satisfies SchemaTypeWithEnumLiteralDeep<CustomStepParams>;

export const CustomStepWithTargetSchema = Schema.Struct({
  ...CustomStepParamsSchema.fields,
  target: Schema.optional(Schema.String),
});
export const CustomStepWithFrameSchema = Schema.Struct({
  ...CustomStepParamsSchema.fields,
  frame: Schema.optional(FrameSelectorSchema),
});
export const CustomStepSchema = Schema.Union([
  Schema.Struct({
    ...CustomStepParamsSchema.fields,
    target: Schema.optional(Schema.String),
  }),
  Schema.Struct({
    ...CustomStepParamsSchema.fields,
    frame: Schema.optional(FrameSelectorSchema),
  }),
]) satisfies SchemaTypeWithEnumLiteralDeep<CustomStep>;

export const DoubleClickStepSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_USER_STEP_TYPE.DOUBLE_CLICK),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  button: Schema.optional(PointerButtonTypeSchema),
  deviceType: Schema.optional(PointerDeviceTypeSchema),
  duration: Schema.optional(NonNegativeIntSchema),
  frame: Schema.optional(FrameSelectorSchema),
  offsetX: NonNegativeIntSchema,
  offsetY: NonNegativeIntSchema,
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<NormalizedSelectorStep<DoubleClickStep>>;

export const EmulateNetworkConditionsStepSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_USER_STEP_TYPE.EMULATE_NETWORK_CONDITIONS),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  download: NonNegativeIntSchema,
  latency: NonNegativeIntSchema,
  target: Schema.optional(Schema.String),
  upload: NonNegativeIntSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<EmulateNetworkConditionsStep>;

export const HoverStepSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_USER_STEP_TYPE.HOVER),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  frame: Schema.optional(FrameSelectorSchema),
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<NormalizedSelectorStep<HoverStep>>;

export const KeyDownStepSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_USER_STEP_TYPE.KEY_DOWN),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  key: PuppeteerReplayKeySchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<KeyDownStep>;

export const KeyUpStepSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_USER_STEP_TYPE.KEY_UP),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  key: PuppeteerReplayKeySchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<KeyUpStep>;

export const NavigateStepSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_USER_STEP_TYPE.NAVIGATE),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
  url: UrlWithHttpsOrAboutBlankSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<NavigateStep>;

export const ScrollPageStepSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_USER_STEP_TYPE.SCROLL),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  frame: Schema.optional(FrameSelectorSchema),
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
  x: Schema.Number,
  y: Schema.Number,
});

export const ScrollStepSchema = Schema.Struct({
  ...ScrollPageStepSchema.fields,
  selectors: SelectorsSchema,
});

export const SetViewStepSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_USER_STEP_TYPE.SET_VIEWPORT),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  deviceScaleFactor: NonNegativeIntSchema,
  hasTouch: Schema.Boolean,
  height: NonNegativeIntSchema,
  isLandscape: Schema.Boolean,
  isMobile: Schema.Boolean,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
  width: NonNegativeIntSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<SetViewportStep>;

// TODO
const AttributesSchema = Schema.Record(Schema.String, Schema.String);
const PropertiesSchema = Schema.Record(Schema.String, Schema.String);

export const WaitForElementStepSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_ASSERTION_STEP_TYPE.WAIT_FOR_ELEMENT),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  attributes: Schema.optional(AttributesSchema),
  count: NonNegativeIntSchema,
  frame: Schema.optional(FrameSelectorSchema),
  operator: Schema.optional(Schema.Literals(['>=', '==', '<='])),
  properties: Schema.optional(PropertiesSchema),
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
  visible: Schema.optional(Schema.Boolean),
}) satisfies SchemaTypeWithEnumLiteralDeep<NormalizedSelectorStep<WaitForElementStep>>;

export const WaitForExpressionStepSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_ASSERTION_STEP_TYPE.WAIT_FOR_EXPRESSION),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  expression: Schema.NonEmptyString,
  frame: Schema.optional(FrameSelectorSchema),
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<WaitForExpressionStep>;

const selectorPathToReplaySelector = ({ segments }: SelectorPath): ReplaySelector =>
  segments.length === 1 ? segments[0] : segments;

const replaySelectorToSelectorPath = (selector: ReplaySelector): SelectorPath => ({
  segments: (() => {
    const segments = Array.isArray(selector) ? selector : [selector];
    const [first, ...rest] = segments;

    if (!first) {
      throw new Error('Replay selector paths must be non-empty');
    }

    return [first, ...rest];
  })(),
});

const ReplaySelectorsFromNormalizedSchema = SelectorsSchema.pipe(
  Schema.decodeTo(
    ReplaySelectorsSchema,
    SchemaTransformation.transform({
      decode: (selectors): ReadonlyArray<ReplaySelector> => selectors.map(selectorPathToReplaySelector),
      encode: (selectors): ReadonlyArray<SelectorPath> => selectors.map(replaySelectorToSelectorPath),
    }),
  ),
);

export const ChangeRunnerStepSchema = Schema.Struct({
  ...ChangeStepSchema.fields,
  selectors: ReplaySelectorsFromNormalizedSchema,
});
export const ClickRunnerStepSchema = Schema.Struct({
  ...ClickStepSchema.fields,
  selectors: ReplaySelectorsFromNormalizedSchema,
});
export const DoubleClickRunnerStepSchema = Schema.Struct({
  ...DoubleClickStepSchema.fields,
  selectors: ReplaySelectorsFromNormalizedSchema,
});
export const HoverRunnerStepSchema = Schema.Struct({
  ...HoverStepSchema.fields,
  selectors: ReplaySelectorsFromNormalizedSchema,
});
export const ScrollRunnerStepSchema = Schema.Struct({
  ...ScrollStepSchema.fields,
  selectors: ReplaySelectorsFromNormalizedSchema,
});
export const WaitForElementRunnerStepSchema = Schema.Struct({
  ...WaitForElementStepSchema.fields,
  selectors: ReplaySelectorsFromNormalizedSchema,
});

export const PuppeteerReplayBuilderStepVariants: readonly BuilderStepVariantDefinition[] = [
  {
    id: PUPPETEER_REPLAY_ASSERTION_STEP_TYPE.WAIT_FOR_ELEMENT,
    schema: WaitForElementStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_ASSERTION_STEP_TYPE.WAIT_FOR_ELEMENT,
      count: 1,
      selectors: [],
    },
  },
  {
    id: PUPPETEER_REPLAY_ASSERTION_STEP_TYPE.WAIT_FOR_EXPRESSION,
    schema: WaitForExpressionStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_ASSERTION_STEP_TYPE.WAIT_FOR_EXPRESSION,
      expression: '',
    },
  },
  {
    id: PUPPETEER_REPLAY_USER_STEP_TYPE.CHANGE,
    schema: ChangeStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_USER_STEP_TYPE.CHANGE,
      selectors: [],
      value: '',
    },
  },
  {
    id: PUPPETEER_REPLAY_USER_STEP_TYPE.CLICK,
    schema: ClickStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_USER_STEP_TYPE.CLICK,
      offsetX: 1,
      offsetY: 1,
      selectors: [],
    },
  },
  {
    id: PUPPETEER_REPLAY_USER_STEP_TYPE.CLOSE,
    schema: CloseStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_USER_STEP_TYPE.CLOSE,
    },
  },
  {
    id: PUPPETEER_REPLAY_USER_STEP_TYPE.DOUBLE_CLICK,
    schema: DoubleClickStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_USER_STEP_TYPE.DOUBLE_CLICK,
      offsetX: 1,
      offsetY: 1,
      selectors: [],
    },
  },
  {
    id: PUPPETEER_REPLAY_USER_STEP_TYPE.EMULATE_NETWORK_CONDITIONS,
    schema: EmulateNetworkConditionsStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_USER_STEP_TYPE.EMULATE_NETWORK_CONDITIONS,
      download: 1,
      latency: 1,
      upload: 1,
    },
  },
  {
    id: PUPPETEER_REPLAY_USER_STEP_TYPE.HOVER,
    schema: HoverStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_USER_STEP_TYPE.HOVER,
      selectors: [],
    },
  },
  {
    id: PUPPETEER_REPLAY_USER_STEP_TYPE.KEY_DOWN,
    schema: KeyDownStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_USER_STEP_TYPE.KEY_DOWN,
      key: 'Enter',
    },
  },
  {
    id: PUPPETEER_REPLAY_USER_STEP_TYPE.KEY_UP,
    schema: KeyUpStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_USER_STEP_TYPE.KEY_UP,
      key: 'Enter',
    },
  },
  {
    id: PUPPETEER_REPLAY_USER_STEP_TYPE.NAVIGATE,
    schema: NavigateStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_USER_STEP_TYPE.NAVIGATE,
      url: '',
    },
  },
  {
    id: PUPPETEER_REPLAY_USER_STEP_TYPE.SCROLL,
    schema: ScrollStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_USER_STEP_TYPE.SCROLL,
      selectors: [],
      x: 1,
      y: 1,
    },
  },
  {
    id: PUPPETEER_REPLAY_USER_STEP_TYPE.SET_VIEWPORT,
    schema: SetViewStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_USER_STEP_TYPE.SET_VIEWPORT,
      deviceScaleFactor: 1,
      hasTouch: false,
      height: 1,
      isLandscape: false,
      isMobile: false,
      width: 1,
    },
  },
];

export const PuppeteerReplayStepSchema = Schema.Union([
  ChangeStepSchema,
  ClickStepSchema,
  CloseStepSchema,
  DoubleClickStepSchema,
  EmulateNetworkConditionsStepSchema,
  HoverStepSchema,
  KeyDownStepSchema,
  KeyUpStepSchema,
  NavigateStepSchema,
  ScrollStepSchema,
  SetViewStepSchema,
  WaitForElementStepSchema,
  WaitForExpressionStepSchema,
]).annotate({ title: 'PuppeteerReplayStep' });

export const PuppeteerReplayRunnerStepSchema = Schema.Union([
  ChangeRunnerStepSchema,
  ClickRunnerStepSchema,
  CloseStepSchema,
  CustomStepSchema,
  DoubleClickRunnerStepSchema,
  EmulateNetworkConditionsStepSchema,
  HoverRunnerStepSchema,
  KeyDownStepSchema,
  KeyUpStepSchema,
  NavigateStepSchema,
  ScrollRunnerStepSchema,
  SetViewStepSchema,
  WaitForElementRunnerStepSchema,
  WaitForExpressionStepSchema,
]);
