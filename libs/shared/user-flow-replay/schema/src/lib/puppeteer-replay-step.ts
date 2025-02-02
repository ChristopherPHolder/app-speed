import {
  AssertedEventType,
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
  ScrollStep,
  SetViewportStep,
  Step,
  StepType,
  WaitForElementStep,
  WaitForExpressionStep,
} from '@puppeteer/replay';
import { Schema } from 'effect';
import { KeySchema } from './puppeteer-replay-key';
import { ReadonlyDeep } from 'type-fest';

const UrlWithHttpsSchema = Schema.String.pipe(
  Schema.pattern(
    /^https:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/,
  ),
  Schema.annotations({
    identifier: 'Valid URL with HTTPS',
    title: 'Valid url with https protocol',
    description: 'This field requires being a valid URL that uses the HTTPS Protocol',
  }),
);

const AssertedEventsSchema = Schema.Struct({
  title: Schema.optional(Schema.NonEmptyString),
  type: Schema.Literal(AssertedEventType.Navigation),
  url: Schema.optional(UrlWithHttpsSchema),
});

const FrameSelectorSchema = Schema.Array(Schema.NonNegativeInt);
const SelectorSchema = Schema.Union(Schema.String, Schema.Array(Schema.String));
const SelectorsSchema = Schema.Array(SelectorSchema);
const PointerButtonTypeSchema = Schema.Literal('primary', 'auxiliary', 'secondary', 'back', 'forward');
const PointerDeviceTypeSchema = Schema.Literal('mouse', 'pen', 'touch');

type PuppeteerReplayStepSchema<T extends Step> = { Type: ReadonlyDeep<T> };

export const ChangeStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.Change),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  frame: Schema.optional(FrameSelectorSchema),
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
  value: Schema.NonEmptyString,
}) satisfies PuppeteerReplayStepSchema<ChangeStep>;

export const ClickStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.Click),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  button: Schema.optional(PointerButtonTypeSchema),
  deviceType: Schema.optional(PointerDeviceTypeSchema),
  duration: Schema.optional(Schema.NonNegativeInt),
  frame: Schema.optional(FrameSelectorSchema),
  offsetX: Schema.NonNegativeInt,
  offsetY: Schema.NonNegativeInt,
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
}) satisfies PuppeteerReplayStepSchema<ClickStep>;

export const CloseStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.Close),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
}) satisfies PuppeteerReplayStepSchema<CloseStep>;

export const CustomStepTypeLiteral = Schema.Literal(StepType.CustomStep);
export const CustomStepParamsSchema = Schema.Struct({
  type: CustomStepTypeLiteral,
  parameters: Schema.Unknown,
  name: Schema.NonEmptyString,
}) satisfies PuppeteerReplayStepSchema<CustomStepParams>;

export const CustomStepSchema = Schema.Union(
  Schema.Struct({
    ...CustomStepParamsSchema.fields,
    target: Schema.optional(Schema.String),
  }),
  Schema.Struct({
    ...CustomStepParamsSchema.fields,
    frame: Schema.optional(FrameSelectorSchema),
  }),
) satisfies PuppeteerReplayStepSchema<CustomStep>;

export const DoubleClickStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.DoubleClick),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  button: Schema.optional(PointerButtonTypeSchema),
  deviceType: Schema.optional(PointerDeviceTypeSchema),
  duration: Schema.optional(Schema.NonNegativeInt),
  frame: Schema.optional(FrameSelectorSchema),
  offsetX: Schema.NonNegativeInt,
  offsetY: Schema.NonNegativeInt,
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
}) satisfies PuppeteerReplayStepSchema<DoubleClickStep>;

export const EmulateNetworkConditionsStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.EmulateNetworkConditions),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  download: Schema.NonNegativeInt,
  latency: Schema.NonNegativeInt,
  target: Schema.optional(Schema.String),
  upload: Schema.NonNegativeInt,
}) satisfies PuppeteerReplayStepSchema<EmulateNetworkConditionsStep>;

export const HoverStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.Hover),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  frame: Schema.optional(FrameSelectorSchema),
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
}) satisfies PuppeteerReplayStepSchema<HoverStep>;

export const KeyDownStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.KeyDown),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  key: KeySchema,
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
}) satisfies PuppeteerReplayStepSchema<KeyDownStep>;

export const KeyUpStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.KeyUp),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  key: KeySchema,
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
}) satisfies { Type: ReadonlyDeep<KeyUpStep> };

export const NavigateStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.Navigate),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
  url: UrlWithHttpsSchema,
}) satisfies PuppeteerReplayStepSchema<NavigateStep>;

const ScrollPageStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.Scroll),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  frame: Schema.optional(FrameSelectorSchema),
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
  x: Schema.Number,
  y: Schema.Number,
});

export const ScrollStepSchema = Schema.Union(
  ScrollPageStepSchema,
  Schema.Struct({
    ...ScrollPageStepSchema.fields,
    selectors: SelectorsSchema,
  }),
) satisfies PuppeteerReplayStepSchema<ScrollStep>;

export const SetViewStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.SetViewport),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  deviceScaleFactor: Schema.NonNegativeInt,
  hasTouch: Schema.Boolean,
  height: Schema.NonNegativeInt,
  isLandscape: Schema.Boolean,
  isMobile: Schema.Boolean,
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
  width: Schema.NonNegativeInt,
}) satisfies PuppeteerReplayStepSchema<SetViewportStep>;

// TODO
const AttributesSchema = Schema.Record({ key: Schema.String, value: Schema.String });
const PropertiesSchema = Schema.Record({ key: Schema.String, value: Schema.String });

export const WaitForElementStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.WaitForElement),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  attributes: Schema.optional(AttributesSchema),
  count: Schema.NonNegativeInt,
  frame: Schema.optional(FrameSelectorSchema),
  operator: Schema.optional(Schema.Literal('>=', '==', '<=')),
  properties: Schema.optional(PropertiesSchema),
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
  visible: Schema.optional(Schema.Boolean),
}) satisfies PuppeteerReplayStepSchema<WaitForElementStep>;

export const WaitForExpressionStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.WaitForExpression),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  expression: Schema.NonEmptyString,
  frame: Schema.optional(FrameSelectorSchema),
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
}) satisfies PuppeteerReplayStepSchema<WaitForExpressionStep>;

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
);
