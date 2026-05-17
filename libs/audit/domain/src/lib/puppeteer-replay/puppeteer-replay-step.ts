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
  Selector,
  SetViewportStep,
  WaitForElementStep,
  WaitForExpressionStep,
} from '@puppeteer/replay';
import { Schema } from 'effect';
import {
  PUPPETEER_REPLAY_ASSERTED_EVENT_TYPE,
  PuppeteerReplayAssociatedEventTypeSchema,
} from './puppeteer-replay-asserted-event-type';
import {
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  PUPPETEER_REPLAY_CUSTOM_STEP_TYPE,
  PUPPETEER_REPLAY_USER_STEP_TYPE,
  PuppeteerReplayStepTypeSchema,
} from './puppeteer-replay-step-type';
import { PointerButtonTypeSchema } from './puppeteer-replay-pointer-button-type';
import { PuppeteerReplayKeySchema } from './puppeteer-replay-key';
import { SchemaTypeWithEnumLiteralDeep } from '../type-utils';
import type { BuilderStepVariantDefinition } from '../builder-step-spec';

const TimeoutSchema = Schema.optional(
  Schema.Union(Schema.NonNegativeInt, Schema.NumberFromString.pipe(Schema.int(), Schema.nonNegative())).annotations({
    identifier: 'Timeout',
  }),
);

export const UrlWithHttpsSchema = Schema.String.pipe(
  Schema.pattern(/^https:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&/=]*$/),
).annotations({ title: 'UrlWithHttps' });

const AssertedEventsSchema = Schema.Struct({
  type: PuppeteerReplayAssociatedEventTypeSchema.pipe(
    Schema.pickLiteral(PUPPETEER_REPLAY_ASSERTED_EVENT_TYPE.NAVIGATION),
  ),
  title: Schema.optional(Schema.NonEmptyString),
  url: Schema.optional(UrlWithHttpsSchema),
}) satisfies SchemaTypeWithEnumLiteralDeep<NavigationEvent>;

const FrameSelectorSchema = Schema.Array(Schema.NonNegativeInt);
export const SelectorPathSchema = Schema.Struct({
  segments: Schema.NonEmptyArray(Schema.NonEmptyString),
});
const SelectorsSchema = Schema.Array(SelectorPathSchema);
const ReplaySelectorSchema = Schema.Union(Schema.NonEmptyString, Schema.NonEmptyArray(Schema.NonEmptyString));
const ReplaySelectorsSchema = Schema.Array(ReplaySelectorSchema);

type SelectorPath = typeof SelectorPathSchema.Type;
type NormalizedSelectorStep<TStep extends { selectors: unknown }> = Omit<TStep, 'selectors'> & {
  selectors: SelectorPath[];
};

const PointerDeviceTypeSchema = Schema.Literal(
  'mouse',
  'pen',
  'touch',
) satisfies SchemaTypeWithEnumLiteralDeep<PointerDeviceType>;

export const ChangeStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.CHANGE)),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  frame: Schema.optional(FrameSelectorSchema),
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
  value: Schema.NonEmptyString,
}) satisfies SchemaTypeWithEnumLiteralDeep<NormalizedSelectorStep<ChangeStep>>;

export const ClickStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.CLICK)),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  button: Schema.optional(PointerButtonTypeSchema),
  deviceType: Schema.optional(PointerDeviceTypeSchema),
  duration: Schema.optional(Schema.NonNegativeInt),
  frame: Schema.optional(FrameSelectorSchema),
  offsetX: Schema.NonNegativeInt,
  offsetY: Schema.NonNegativeInt,
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<NormalizedSelectorStep<ClickStep>>;

export const CloseStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.CLOSE)),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<CloseStep>;

export const CustomStepParamsSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
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
export const CustomStepSchema = Schema.Union(
  Schema.Struct({
    ...CustomStepParamsSchema.fields,
    target: Schema.optional(Schema.String),
  }),
  Schema.Struct({
    ...CustomStepParamsSchema.fields,
    frame: Schema.optional(FrameSelectorSchema),
  }),
) satisfies SchemaTypeWithEnumLiteralDeep<CustomStep>;

export const DoubleClickStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.DOUBLE_CLICK)),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  button: Schema.optional(PointerButtonTypeSchema),
  deviceType: Schema.optional(PointerDeviceTypeSchema),
  duration: Schema.optional(Schema.NonNegativeInt),
  frame: Schema.optional(FrameSelectorSchema),
  offsetX: Schema.NonNegativeInt,
  offsetY: Schema.NonNegativeInt,
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<NormalizedSelectorStep<DoubleClickStep>>;

export const EmulateNetworkConditionsStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(
    Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.EMULATE_NETWORK_CONDITIONS),
  ),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  download: Schema.NonNegativeInt,
  latency: Schema.NonNegativeInt,
  target: Schema.optional(Schema.String),
  upload: Schema.NonNegativeInt,
}) satisfies SchemaTypeWithEnumLiteralDeep<EmulateNetworkConditionsStep>;

export const HoverStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.HOVER)),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  frame: Schema.optional(FrameSelectorSchema),
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<NormalizedSelectorStep<HoverStep>>;

export const KeyDownStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.KEY_DOWN)),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  key: PuppeteerReplayKeySchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<KeyDownStep>;

export const KeyUpStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.KEY_UP)),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  key: PuppeteerReplayKeySchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<KeyUpStep>;

export const NavigateStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.NAVIGATE)),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
  url: UrlWithHttpsSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<NavigateStep>;

export const ScrollPageStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.SCROLL)),
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
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.SET_VIEWPORT)),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  deviceScaleFactor: Schema.NonNegativeInt,
  hasTouch: Schema.Boolean,
  height: Schema.NonNegativeInt,
  isLandscape: Schema.Boolean,
  isMobile: Schema.Boolean,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
  width: Schema.NonNegativeInt,
}) satisfies SchemaTypeWithEnumLiteralDeep<SetViewportStep>;

// TODO
const AttributesSchema = Schema.Record({ key: Schema.String, value: Schema.String });
const PropertiesSchema = Schema.Record({ key: Schema.String, value: Schema.String });

export const WaitForElementStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_ASSERTION_STEP_TYPE.WAIT_FOR_ELEMENT)),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  attributes: Schema.optional(AttributesSchema),
  count: Schema.NonNegativeInt,
  frame: Schema.optional(FrameSelectorSchema),
  operator: Schema.optional(Schema.Literal('>=', '==', '<=')),
  properties: Schema.optional(PropertiesSchema),
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
  visible: Schema.optional(Schema.Boolean),
}) satisfies SchemaTypeWithEnumLiteralDeep<NormalizedSelectorStep<WaitForElementStep>>;

export const WaitForExpressionStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(
    Schema.pickLiteral(PUPPETEER_REPLAY_ASSERTION_STEP_TYPE.WAIT_FOR_EXPRESSION),
  ),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  expression: Schema.NonEmptyString,
  frame: Schema.optional(FrameSelectorSchema),
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<WaitForExpressionStep>;

const ReplayChangeStepSchema = Schema.Struct({
  ...ChangeStepSchema.fields,
  selectors: ReplaySelectorsSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<ChangeStep>;

const ReplayClickStepSchema = Schema.Struct({
  ...ClickStepSchema.fields,
  selectors: ReplaySelectorsSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<ClickStep>;

const ReplayDoubleClickStepSchema = Schema.Struct({
  ...DoubleClickStepSchema.fields,
  selectors: ReplaySelectorsSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<DoubleClickStep>;

const ReplayHoverStepSchema = Schema.Struct({
  ...HoverStepSchema.fields,
  selectors: ReplaySelectorsSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<HoverStep>;

const ReplayScrollStepSchema = Schema.Struct({
  ...ScrollStepSchema.fields,
  selectors: ReplaySelectorsSchema,
});

const ReplayWaitForElementStepSchema = Schema.Struct({
  ...WaitForElementStepSchema.fields,
  selectors: ReplaySelectorsSchema,
}) satisfies SchemaTypeWithEnumLiteralDeep<WaitForElementStep>;

const selectorPathToReplaySelector = ({ segments }: SelectorPath): Selector =>
  segments.length === 1 ? segments[0] : [...segments];

const replaySelectorToSelectorPath = (selector: Selector): SelectorPath => ({
  segments: (() => {
    const segments = Array.isArray(selector) ? selector : [selector];
    const [first, ...rest] = segments;

    if (!first) {
      throw new Error('Replay selector paths must be non-empty');
    }

    return [first, ...rest];
  })(),
});

const normalizedSelectorsStepRunnerSchema = (
  authoringSchema: Schema.Schema.AnyNoContext,
  replaySchema: Schema.Schema.AnyNoContext,
) =>
  Schema.transform(
    authoringSchema as never,
    replaySchema as never,
    {
      strict: true,
      decode: ({ selectors, ...rest }: { selectors: SelectorPath[] } & Record<string, unknown>) => ({
        ...rest,
        selectors: selectors.map(selectorPathToReplaySelector),
      }),
      encode: ({ selectors, ...rest }: { selectors: Selector[] } & Record<string, unknown>) => ({
        ...rest,
        selectors: selectors.map(replaySelectorToSelectorPath),
      }),
    } as never,
  );

export const ChangeRunnerStepSchema = normalizedSelectorsStepRunnerSchema(ChangeStepSchema, ReplayChangeStepSchema);
export const ClickRunnerStepSchema = normalizedSelectorsStepRunnerSchema(ClickStepSchema, ReplayClickStepSchema);
export const DoubleClickRunnerStepSchema = normalizedSelectorsStepRunnerSchema(
  DoubleClickStepSchema,
  ReplayDoubleClickStepSchema,
);
export const HoverRunnerStepSchema = normalizedSelectorsStepRunnerSchema(HoverStepSchema, ReplayHoverStepSchema);
export const ScrollRunnerStepSchema = normalizedSelectorsStepRunnerSchema(ScrollStepSchema, ReplayScrollStepSchema);
export const WaitForElementRunnerStepSchema = normalizedSelectorsStepRunnerSchema(
  WaitForElementStepSchema,
  ReplayWaitForElementStepSchema,
);

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

export const PuppeteerReplayStepSchema = Schema.Union(
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
).annotations({ title: 'PuppeteerReplayStep' });

export const PuppeteerReplayRunnerStepSchema = Schema.Union(
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
);
