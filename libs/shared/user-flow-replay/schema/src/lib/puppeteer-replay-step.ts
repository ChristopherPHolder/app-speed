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
  PointerButtonType,
  PointerDeviceType,
  ScrollStep,
  SetViewportStep,
  Step,
  StepType,
  WaitForElementStep,
  WaitForExpressionStep,
} from '@puppeteer/replay';
import { Schema } from 'effect';
import { ReadonlyDeep } from 'type-fest';
import { KeySchema } from './puppeteer-replay-key';
import { AuditStepTypeSchema } from './audit-step.schema';

type SchemaType<T> = { Type: ReadonlyDeep<T> };

const UrlWithHttpsSchema = Schema.String.pipe(
  Schema.pattern(/^https:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&/=]*$/),
).annotations({ title: 'UrlWithHttps' });

const AssertedEventsSchema = Schema.Struct({
  title: Schema.optional(Schema.NonEmptyString),
  type: Schema.Literal(AssertedEventType.Navigation),
  url: Schema.optional(UrlWithHttpsSchema),
});
const FrameSelectorSchema = Schema.Array(Schema.NonNegativeInt);
// TODO FIX Selectors is actually more complex, its an array of strings or string arrays.
// const SelectorSchema = Schema.Union(Schema.String, Schema.Array(Schema.String)); TODO Fix
const SelectorSchema = Schema.NonEmptyString;
const SelectorsSchema = Schema.Array(SelectorSchema);
const PointerButtonTypeSchema = Schema.Literal(
  'primary',
  'auxiliary',
  'secondary',
  'back',
  'forward',
) satisfies SchemaType<PointerButtonType>;

const PointerDeviceTypeSchema = Schema.Literal('mouse', 'pen', 'touch') satisfies SchemaType<PointerDeviceType>;

export const ChangeStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.Change),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  frame: Schema.optional(FrameSelectorSchema),
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
  value: Schema.NonEmptyString,
}) satisfies SchemaType<ChangeStep>;

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
}) satisfies SchemaType<ClickStep>;

export const CloseStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.Close),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
}) satisfies SchemaType<CloseStep>;

export const CustomStepParamsSchema = Schema.Struct({
  type: Schema.Literal(StepType.CustomStep),
  parameters: Schema.Unknown,
  name: Schema.NonEmptyString,
}) satisfies SchemaType<CustomStepParams>;

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
) satisfies SchemaType<CustomStep>;

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
}) satisfies SchemaType<DoubleClickStep>;

export const EmulateNetworkConditionsStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.EmulateNetworkConditions),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  download: Schema.NonNegativeInt,
  latency: Schema.NonNegativeInt,
  target: Schema.optional(Schema.String),
  upload: Schema.NonNegativeInt,
}) satisfies SchemaType<EmulateNetworkConditionsStep>;

export const HoverStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.Hover),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  frame: Schema.optional(FrameSelectorSchema),
  selectors: SelectorsSchema,
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
}) satisfies SchemaType<HoverStep>;

export const KeyDownStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.KeyDown),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  key: KeySchema,
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
}) satisfies SchemaType<KeyDownStep>;

export const KeyUpStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.KeyUp),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  key: KeySchema,
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
}) satisfies { Type: ReadonlyDeep<KeyUpStep> };

export const NavigateStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(StepType.Navigate)),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
  url: UrlWithHttpsSchema,
}).annotations({ title: 'NavigationStep' }) satisfies SchemaType<NavigateStep>;

export const ScrollPageStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.Scroll),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  frame: Schema.optional(FrameSelectorSchema),
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
  x: Schema.Number,
  y: Schema.Number,
});

export const ScrollStepSchema = ScrollPageStepSchema.pipe(
  Schema.compose(
    Schema.Struct({
      ...ScrollPageStepSchema.fields,
      selectors: SelectorsSchema,
    }),
  ),
) satisfies SchemaType<ScrollStep>;

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
}) satisfies SchemaType<SetViewportStep>;

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
}) satisfies SchemaType<WaitForElementStep>;

export const WaitForExpressionStepSchema = Schema.Struct({
  type: Schema.Literal(StepType.WaitForExpression),
  assertedEvents: Schema.optional(Schema.Array(AssertedEventsSchema)),
  expression: Schema.NonEmptyString,
  frame: Schema.optional(FrameSelectorSchema),
  target: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.NonNegativeInt),
}) satisfies SchemaType<WaitForExpressionStep>;

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
).annotations({ title: 'PuppeteerReplayStep' }) satisfies SchemaType<Step>;
