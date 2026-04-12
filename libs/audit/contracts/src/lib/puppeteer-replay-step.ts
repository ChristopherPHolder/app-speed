import type {
  AssertedEvent,
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
  ScrollStep,
  SetViewportStep,
  Step,
  WaitForElementStep,
  WaitForExpressionStep,
} from '@puppeteer/replay';
import { Schema } from 'effect';

import {
  PointerButtonTypeSchema,
  PUPPETEER_REPLAY_ASSERTED_EVENT_TYPE,
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  PUPPETEER_REPLAY_CUSTOM_STEP_TYPE,
  PUPPETEER_REPLAY_USER_STEP_TYPE,
  PuppeteerReplayAssociatedEventTypeSchema,
  PuppeteerReplayKeySchema,
  PuppeteerReplayStepTypeSchema,
} from '@app-speed/audit/model';

type WithEnumLiteralDeep<T> = T extends readonly (infer U)[]
  ? readonly WithEnumLiteralDeep<U>[]
  : T extends object
    ? { readonly [K in keyof T]: WithEnumLiteralDeep<T[K]> }
    : T extends string
      ? `${T}`
      : T;

type SchemaTypeWithEnumLiteralDeep<T> = { Type: WithEnumLiteralDeep<T> };

type AssertedEventSchemaType<T extends AssertedEvent> = { Type: WithEnumLiteralDeep<T> };

type StepSchemaType<T extends Step> = { Type: WithEnumLiteralDeep<T> };

const NonNegativeIntFromStringSchema = Schema.NumberFromString.pipe(Schema.int(), Schema.nonNegative()).annotations({
  identifier: 'NonNegativeIntFromString',
});

const TimeoutSchema = Schema.optional(
  Schema.Union(Schema.NonNegativeInt, NonNegativeIntFromStringSchema).annotations({
    identifier: 'Timeout',
  }),
);

const UrlWithHttpsSchema = Schema.String.pipe(
  Schema.pattern(/^https:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&/=]*$/),
).annotations({ title: 'UrlWithHttps' });

const AssertedEventsSchema = Schema.Struct({
  type: PuppeteerReplayAssociatedEventTypeSchema.pipe(
    Schema.pickLiteral(PUPPETEER_REPLAY_ASSERTED_EVENT_TYPE.NAVIGATION),
  ),
  title: Schema.optional(Schema.NonEmptyString),
  url: Schema.optional(UrlWithHttpsSchema),
}) satisfies AssertedEventSchemaType<NavigationEvent>;

const FrameSelectorSchema = Schema.Array(Schema.NonNegativeInt);
// TODO FIX Selectors is actually more complex, its an array of strings or string arrays.
// const SelectorSchema = Schema.Union(Schema.String, Schema.Array(Schema.String)); TODO Fix
const SelectorSchema = Schema.NonEmptyString;
const SelectorsSchema = Schema.Array(SelectorSchema);

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
}) satisfies StepSchemaType<ChangeStep>;

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
}) satisfies StepSchemaType<ClickStep>;

export const CloseStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.CLOSE)),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies StepSchemaType<CloseStep>;

export const CustomStepParamsSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  parameters: Schema.Unknown,
  name: Schema.NonEmptyString,
}) satisfies StepSchemaType<CustomStepParams>;

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
) satisfies StepSchemaType<CustomStep>;

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
}) satisfies StepSchemaType<DoubleClickStep>;

export const EmulateNetworkConditionsStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(
    Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.EMULATE_NETWORK_CONDITIONS),
  ),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  download: Schema.NonNegativeInt,
  latency: Schema.NonNegativeInt,
  target: Schema.optional(Schema.String),
  upload: Schema.NonNegativeInt,
}) satisfies StepSchemaType<EmulateNetworkConditionsStep>;

export const HoverStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.HOVER)),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  frame: Schema.optional(FrameSelectorSchema),
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies StepSchemaType<HoverStep>;

export const KeyDownStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.KEY_DOWN)),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  key: PuppeteerReplayKeySchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies StepSchemaType<KeyDownStep>;

export const KeyUpStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.KEY_UP)),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  key: PuppeteerReplayKeySchema,
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies StepSchemaType<KeyUpStep>;

export const NavigateStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_USER_STEP_TYPE.NAVIGATE)),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
  url: UrlWithHttpsSchema,
}) satisfies StepSchemaType<NavigateStep>;

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
}) satisfies StepSchemaType<ScrollStep>;

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
}) satisfies StepSchemaType<SetViewportStep>;

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
}) satisfies StepSchemaType<WaitForElementStep>;

export const WaitForExpressionStepSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(
    Schema.pickLiteral(PUPPETEER_REPLAY_ASSERTION_STEP_TYPE.WAIT_FOR_EXPRESSION),
  ),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  expression: Schema.NonEmptyString,
  frame: Schema.optional(FrameSelectorSchema),
  target: Schema.optional(Schema.String),
  timeout: TimeoutSchema,
}) satisfies StepSchemaType<WaitForExpressionStep>;

export const PuppeteerReplayStepSchema = Schema.Union(
  ChangeStepSchema,
  ClickStepSchema,
  CloseStepSchema,
  CustomStepSchema,
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
).annotations({ title: 'PuppeteerReplayStep' }) satisfies StepSchemaType<Step>;
