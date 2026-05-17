import { Schema } from 'effect';
import { AppAuditCustomStepTypeSchema, AuditStepTypeSchema } from './audit-step.schema';
import { UrlWithHttpsSchema } from './puppeteer-replay/puppeteer-replay-step';
import {
  PuppeteerReplayStepTypeSchema,
  PUPPETEER_REPLAY_CUSTOM_STEP_TYPE,
} from './puppeteer-replay/puppeteer-replay-step-type';
import { AUDIT_CUSTOM_STEP_TYPE } from './custom-audit-step-type';
import type { BuilderStepVariantDefinition } from './builder-step-contract';

export const AddCookieParametersSchema = Schema.Struct({
  name: Schema.NonEmptyString,
  value: Schema.NonEmptyString,
  url: UrlWithHttpsSchema,
  domain: Schema.optional(Schema.NonEmptyString),
  path: Schema.optional(Schema.NonEmptyString),
  secure: Schema.optional(Schema.Boolean),
  httpOnly: Schema.optional(Schema.Boolean),
  sameSite: Schema.optional(Schema.Literal('Strict', 'Lax', 'None')),
});

export const AuditClearCacheStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  step: AppAuditCustomStepTypeSchema.pipe(Schema.pickLiteral(AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE)),
});

export const AuditAddCookieStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  step: AppAuditCustomStepTypeSchema.pipe(Schema.pickLiteral(AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE)),
  ...AddCookieParametersSchema.fields,
});

const ReplayAuditCustomStepWithoutFlagsSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  name: Schema.Literal(AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE),
  parameters: Schema.optional(Schema.Undefined),
});

const ReplayAuditCustomStepWithFlagsSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  name: Schema.Literal(AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE),
  parameters: AddCookieParametersSchema,
});

const AuditClearCacheRunnerStepSchema = Schema.transform(
  AuditClearCacheStepSchema,
  ReplayAuditCustomStepWithoutFlagsSchema,
  {
    strict: true,
    decode: () => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      name: AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
      parameters: undefined,
    }),
    encode: () => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
    }),
  },
);

const AuditAddCookieRunnerStepSchema = Schema.transform(
  AuditAddCookieStepSchema,
  ReplayAuditCustomStepWithFlagsSchema,
  {
    strict: true,
    decode: ({ name, value, url, domain, path, secure, httpOnly, sameSite }) => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      name: AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
      parameters: {
        name,
        value,
        url,
        domain,
        path,
        secure,
        httpOnly,
        sameSite,
      },
    }),
    encode: ({ parameters }) => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
      ...parameters,
    }),
  },
);

export const ReplayAuditCustomStepSchema = Schema.Union(
  Schema.typeSchema(AuditClearCacheRunnerStepSchema),
  Schema.typeSchema(AuditAddCookieRunnerStepSchema),
);

export const AuditCustomRunnerStepSchema = Schema.Union(AuditClearCacheRunnerStepSchema, AuditAddCookieRunnerStepSchema);

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
];
