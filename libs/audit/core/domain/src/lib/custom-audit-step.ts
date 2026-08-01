import { Schema, SchemaTransformation } from 'effect';
import { AuditCustomStepBaseSchema } from './audit-step.schema';
import { UrlWithHttpsOrAboutBlankSchema } from './puppeteer-replay/puppeteer-replay-step';
import { PUPPETEER_REPLAY_CUSTOM_STEP_TYPE } from './puppeteer-replay/puppeteer-replay-step-type';
import { AUDIT_CUSTOM_STEP_TYPE } from './custom-audit-step-type';
import type { BuilderStepVariantDefinition } from './builder-step-spec';

export const AppAuditCustomStepTypeSchema = Schema.Literals([
  AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
  AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
  AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_TIME,
  AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_NETWORK_IDLE,
]);

export const AddCookieParametersSchema = Schema.Struct({
  name: Schema.NonEmptyString,
  value: Schema.NonEmptyString,
  url: UrlWithHttpsOrAboutBlankSchema,
  domain: Schema.optional(Schema.NonEmptyString),
  path: Schema.optional(Schema.NonEmptyString),
  secure: Schema.optional(Schema.Boolean),
  httpOnly: Schema.optional(Schema.Boolean),
  sameSite: Schema.optional(Schema.Literals(['Strict', 'Lax', 'None'])),
});

export const WaitForTimeParametersSchema = Schema.Struct({
  seconds: Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: 60 })),
});

const NonNegativeIntSchema = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0));

export const WaitForNetworkIdleParametersSchema = Schema.Struct({
  idleTime: Schema.optional(NonNegativeIntSchema),
  timeout: Schema.optional(NonNegativeIntSchema),
  concurrency: Schema.optional(NonNegativeIntSchema),
});

export const AuditClearCacheStepSchema = Schema.Struct({
  ...AuditCustomStepBaseSchema.fields,
  step: Schema.Literal(AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE),
});

export const AuditAddCookieStepSchema = Schema.Struct({
  ...AuditCustomStepBaseSchema.fields,
  step: Schema.Literal(AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE),
  ...AddCookieParametersSchema.fields,
});

export const AuditWaitForTimeStepSchema = Schema.Struct({
  ...AuditCustomStepBaseSchema.fields,
  step: Schema.Literal(AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_TIME),
  ...WaitForTimeParametersSchema.fields,
});

export const AuditWaitForNetworkIdleStepSchema = Schema.Struct({
  ...AuditCustomStepBaseSchema.fields,
  step: Schema.Literal(AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_NETWORK_IDLE),
  ...WaitForNetworkIdleParametersSchema.fields,
});

const ReplayAuditCustomStepWithoutFlagsSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP),
  name: Schema.Literal(AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE),
  parameters: Schema.optional(Schema.Undefined),
});

const ReplayAuditCustomStepWithFlagsSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP),
  name: Schema.Literal(AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE),
  parameters: AddCookieParametersSchema,
});

const ReplayAuditWaitForTimeStepSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP),
  name: Schema.Literal(AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_TIME),
  parameters: WaitForTimeParametersSchema,
});

const ReplayAuditWaitForNetworkIdleStepSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP),
  name: Schema.Literal(AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_NETWORK_IDLE),
  parameters: WaitForNetworkIdleParametersSchema,
});

const AuditClearCacheRunnerStepSchema = AuditClearCacheStepSchema.pipe(
  Schema.decodeTo(
    ReplayAuditCustomStepWithoutFlagsSchema,
    SchemaTransformation.transform({
      decode: () => ({
        type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
        name: AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
      }),
      encode: () => ({
        type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
        step: AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
      }),
    }),
  ),
);

const AuditAddCookieRunnerStepSchema = AuditAddCookieStepSchema.pipe(
  Schema.decodeTo(
    ReplayAuditCustomStepWithFlagsSchema,
    SchemaTransformation.transform({
      decode: ({ name, value, url, domain, path, secure, httpOnly, sameSite }) => ({
        type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
        name: AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
        parameters: {
          name,
          value,
          url,
          ...(domain === undefined ? {} : { domain }),
          ...(path === undefined ? {} : { path }),
          ...(secure === undefined ? {} : { secure }),
          ...(httpOnly === undefined ? {} : { httpOnly }),
          ...(sameSite === undefined ? {} : { sameSite }),
        },
      }),
      encode: ({ parameters }) => ({
        type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
        step: AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
        ...parameters,
      }),
    }),
  ),
);

const AuditWaitForTimeRunnerStepSchema = AuditWaitForTimeStepSchema.pipe(
  Schema.decodeTo(
    ReplayAuditWaitForTimeStepSchema,
    SchemaTransformation.transform({
      decode: ({ seconds }) => ({
        type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
        name: AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_TIME,
        parameters: { seconds },
      }),
      encode: ({ parameters }) => ({
        type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
        step: AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_TIME,
        ...parameters,
      }),
    }),
  ),
);

const AuditWaitForNetworkIdleRunnerStepSchema = AuditWaitForNetworkIdleStepSchema.pipe(
  Schema.decodeTo(
    ReplayAuditWaitForNetworkIdleStepSchema,
    SchemaTransformation.transform({
      decode: ({ idleTime, timeout, concurrency }) => ({
        type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
        name: AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_NETWORK_IDLE,
        parameters: {
          ...(idleTime === undefined ? {} : { idleTime }),
          ...(timeout === undefined ? {} : { timeout }),
          ...(concurrency === undefined ? {} : { concurrency }),
        },
      }),
      encode: ({ parameters }) => ({
        type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
        step: AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_NETWORK_IDLE,
        ...parameters,
      }),
    }),
  ),
);

export const ReplayAuditCustomStepSchema = Schema.Union([
  Schema.toType(AuditClearCacheRunnerStepSchema),
  Schema.toType(AuditAddCookieRunnerStepSchema),
  Schema.toType(AuditWaitForTimeRunnerStepSchema),
  Schema.toType(AuditWaitForNetworkIdleRunnerStepSchema),
]);

export const AuditCustomRunnerStepSchema = Schema.Union([
  AuditClearCacheRunnerStepSchema,
  AuditAddCookieRunnerStepSchema,
  AuditWaitForTimeRunnerStepSchema,
  AuditWaitForNetworkIdleRunnerStepSchema,
]);

export const AuditCustomBuilderStepVariants: readonly BuilderStepVariantDefinition[] = [
  {
    id: AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
    schema: AuditClearCacheStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
    },
  },
  {
    id: AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
    schema: AuditAddCookieStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
      name: '',
      value: '',
      url: '',
    },
  },
  {
    id: AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_TIME,
    schema: AuditWaitForTimeStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_TIME,
      seconds: 1,
    },
  },
  {
    id: AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_NETWORK_IDLE,
    schema: AuditWaitForNetworkIdleStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_NETWORK_IDLE,
    },
  },
];
