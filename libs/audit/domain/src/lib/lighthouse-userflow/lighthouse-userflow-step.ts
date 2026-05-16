import { Schema } from 'effect';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from './lighthouse-userflow-step-type';
import {
  PuppeteerReplayStepTypeSchema,
  PUPPETEER_REPLAY_CUSTOM_STEP_TYPE,
} from '../puppeteer-replay/puppeteer-replay-step-type';
import { AuditCustomStepTypeSchema, AuditStepTypeSchema } from '../audit-step.schema';
import { UrlWithHttpsSchema } from '../puppeteer-replay/puppeteer-replay-step';

export const UserflowStartNavigationStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  step: AuditCustomStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION)),
  name: Schema.optional(Schema.NonEmptyString),
});
export const UserflowEndNavigationStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  step: AuditCustomStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION)),
});

export const UserflowStartTimespanStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  step: AuditCustomStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN)),
  name: Schema.optional(Schema.NonEmptyString),
});

export const UserflowEndTimespanStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  step: AuditCustomStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN)),
});

export const UserflowSnapshotStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  step: AuditCustomStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT)),
  name: Schema.optional(Schema.NonEmptyString),
});

export const UserflowClearCacheStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  step: AuditCustomStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.CLEAR_CACHE)),
});

const AddCookieParametersSchema = Schema.Struct({
  name: Schema.NonEmptyString,
  value: Schema.NonEmptyString,
  url: UrlWithHttpsSchema,
  domain: Schema.optional(Schema.NonEmptyString),
  path: Schema.optional(Schema.NonEmptyString),
  secure: Schema.optional(Schema.Boolean),
  httpOnly: Schema.optional(Schema.Boolean),
  sameSite: Schema.optional(Schema.Literal('Strict', 'Lax', 'None')),
});

export const UserflowAddCookieStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  step: AuditCustomStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.ADD_COOKIE)),
  ...AddCookieParametersSchema.fields,
});

export const UserflowStepSchema = Schema.Union(
  UserflowStartNavigationStepSchema,
  UserflowEndNavigationStepSchema,
  UserflowStartTimespanStepSchema,
  UserflowEndTimespanStepSchema,
  UserflowSnapshotStepSchema,
  UserflowClearCacheStepSchema,
  UserflowAddCookieStepSchema,
);

export const isUserflowStep = Schema.is(UserflowStepSchema);

export const UserflowAuditStepTypeScheme = AuditCustomStepTypeSchema;

export const UserflowStepTypeWithStepFlagsLiteral = UserflowAuditStepTypeScheme.pipe(
  Schema.pickLiteral(
    LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
    LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
    LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
    LIGHTHOUSE_AUDIT_STEP_TYPE.ADD_COOKIE,
  ),
);

export const UserflowStepTypeWithoutStepFlagsLiteral = UserflowAuditStepTypeScheme.pipe(
  Schema.pickLiteral(
    LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
    LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
    LIGHTHOUSE_AUDIT_STEP_TYPE.CLEAR_CACHE,
  ),
);

const ReplayUserflowStepFlagsSchema = Schema.Struct({
  name: Schema.optional(Schema.NonEmptyString),
});

const ReplayUserflowStepWithFlagsSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  name: UserflowStepTypeWithStepFlagsLiteral,
  parameters: Schema.optional(ReplayUserflowStepFlagsSchema),
});

const UserflowStartNavigationRunnerStepSchema = Schema.transform(
  UserflowStartNavigationStepSchema,
  Schema.Struct({
    type: ReplayUserflowStepWithFlagsSchema.fields.type,
    name: ReplayUserflowStepWithFlagsSchema.fields.name.pipe(
      Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION),
    ),
    parameters: ReplayUserflowStepWithFlagsSchema.fields.parameters,
  }),
  {
    strict: true,
    decode: ({ name }) => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      name: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
      parameters: name ? { name } : undefined,
    }),
    encode: ({ parameters }) => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
      name: parameters?.name,
    }),
  },
);

const UserflowStartTimespanRunnerStepSchema = Schema.transform(
  UserflowStartTimespanStepSchema,
  Schema.Struct({
    type: ReplayUserflowStepWithFlagsSchema.fields.type,
    name: ReplayUserflowStepWithFlagsSchema.fields.name.pipe(
      Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN),
    ),
    parameters: ReplayUserflowStepWithFlagsSchema.fields.parameters,
  }),
  {
    strict: true,
    decode: ({ name }) => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      name: LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
      parameters: name ? { name } : undefined,
    }),
    encode: ({ parameters }) => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
      name: parameters?.name,
    }),
  },
);

const UserflowSnapshotRunnerStepSchema = Schema.transform(
  UserflowSnapshotStepSchema,
  Schema.Struct({
    type: ReplayUserflowStepWithFlagsSchema.fields.type,
    name: ReplayUserflowStepWithFlagsSchema.fields.name.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT)),
    parameters: ReplayUserflowStepWithFlagsSchema.fields.parameters,
  }),
  {
    strict: true,
    decode: ({ name }) => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      name: LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
      parameters: name ? { name } : undefined,
    }),
    encode: ({ parameters }) => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
      name: parameters?.name,
    }),
  },
);

const ReplayUserflowStepWithoutFlagsSchema = Schema.Struct({
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  name: UserflowStepTypeWithoutStepFlagsLiteral,
  parameters: Schema.optional(Schema.Undefined),
});

const UserflowEndNavigationRunnerStepSchema = Schema.transform(
  UserflowEndNavigationStepSchema,
  Schema.Struct({
    type: ReplayUserflowStepWithoutFlagsSchema.fields.type,
    name: ReplayUserflowStepWithoutFlagsSchema.fields.name.pipe(
      Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION),
    ),
    parameters: ReplayUserflowStepWithoutFlagsSchema.fields.parameters,
  }),
  {
    strict: true,
    decode: () => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      name: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
      parameters: undefined,
    }),
    encode: () => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
    }),
  },
);

const UserflowEndTimespanRunnerStepSchema = Schema.transform(
  UserflowEndTimespanStepSchema,
  Schema.Struct({
    type: ReplayUserflowStepWithoutFlagsSchema.fields.type,
    name: ReplayUserflowStepWithoutFlagsSchema.fields.name.pipe(
      Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN),
    ),
    parameters: ReplayUserflowStepWithoutFlagsSchema.fields.parameters,
  }),
  {
    strict: true,
    decode: () => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      name: LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
      parameters: undefined,
    }),
    encode: () => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
    }),
  },
);

const UserflowClearCacheRunnerStepSchema = Schema.transform(
  UserflowClearCacheStepSchema,
  Schema.Struct({
    type: ReplayUserflowStepWithoutFlagsSchema.fields.type,
    name: ReplayUserflowStepWithoutFlagsSchema.fields.name.pipe(
      Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.CLEAR_CACHE),
    ),
    parameters: ReplayUserflowStepWithoutFlagsSchema.fields.parameters,
  }),
  {
    strict: true,
    decode: () => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      name: LIGHTHOUSE_AUDIT_STEP_TYPE.CLEAR_CACHE,
      parameters: undefined,
    }),
    encode: () => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: LIGHTHOUSE_AUDIT_STEP_TYPE.CLEAR_CACHE,
    }),
  },
);

const UserflowAddCookieRunnerStepSchema = Schema.transform(
  UserflowAddCookieStepSchema,
  Schema.Struct({
    type: ReplayUserflowStepWithFlagsSchema.fields.type,
    name: ReplayUserflowStepWithFlagsSchema.fields.name.pipe(
      Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.ADD_COOKIE),
    ),
    parameters: AddCookieParametersSchema,
  }),
  {
    strict: true,
    decode: ({ name, value, url, domain, path, secure, httpOnly, sameSite }) => ({
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      name: LIGHTHOUSE_AUDIT_STEP_TYPE.ADD_COOKIE,
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
      step: LIGHTHOUSE_AUDIT_STEP_TYPE.ADD_COOKIE,
      ...parameters,
    }),
  },
);

export const ReplayUserflowStepSchema = Schema.Union(
  Schema.typeSchema(UserflowStartNavigationRunnerStepSchema),
  Schema.typeSchema(UserflowEndNavigationRunnerStepSchema),
  Schema.typeSchema(UserflowStartTimespanRunnerStepSchema),
  Schema.typeSchema(UserflowEndTimespanRunnerStepSchema),
  Schema.typeSchema(UserflowSnapshotRunnerStepSchema),
  Schema.typeSchema(UserflowClearCacheRunnerStepSchema),
  Schema.typeSchema(UserflowAddCookieRunnerStepSchema),
);

export const isReplayUserflowStep = Schema.is(ReplayUserflowStepSchema);
export const isReplayUserflowStepWithFlags = Schema.is(ReplayUserflowStepWithFlagsSchema);

export const UserflowRunnerStepSchema = Schema.Union(
  UserflowStartNavigationRunnerStepSchema,
  UserflowEndNavigationRunnerStepSchema,
  UserflowStartTimespanRunnerStepSchema,
  UserflowEndTimespanRunnerStepSchema,
  UserflowSnapshotRunnerStepSchema,
  UserflowClearCacheRunnerStepSchema,
  UserflowAddCookieRunnerStepSchema,
);
