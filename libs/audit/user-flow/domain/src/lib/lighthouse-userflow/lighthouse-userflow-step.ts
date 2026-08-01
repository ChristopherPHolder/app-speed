import { Schema, SchemaTransformation } from 'effect';
import {
  AuditCustomStepBaseSchema,
  type BuilderStepVariantDefinition,
  PUPPETEER_REPLAY_CUSTOM_STEP_TYPE,
} from '@app-speed/audit/core/domain';

import { LIGHTHOUSE_AUDIT_STEP_TYPE } from './lighthouse-userflow-step-type';

export const LighthouseAuditStepTypeSchema = Schema.Literals([
  LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
  LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
  LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
  LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
  LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
]);

export const UserflowStartNavigationStepSchema = Schema.Struct({
  ...AuditCustomStepBaseSchema.fields,
  step: LighthouseAuditStepTypeSchema.pick([LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION]),
  name: Schema.optional(Schema.NonEmptyString),
});
export const UserflowEndNavigationStepSchema = Schema.Struct({
  ...AuditCustomStepBaseSchema.fields,
  step: LighthouseAuditStepTypeSchema.pick([LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION]),
});

export const UserflowStartTimespanStepSchema = Schema.Struct({
  ...AuditCustomStepBaseSchema.fields,
  step: LighthouseAuditStepTypeSchema.pick([LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN]),
  name: Schema.optional(Schema.NonEmptyString),
});

export const UserflowEndTimespanStepSchema = Schema.Struct({
  ...AuditCustomStepBaseSchema.fields,
  step: LighthouseAuditStepTypeSchema.pick([LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN]),
});

export const UserflowSnapshotStepSchema = Schema.Struct({
  ...AuditCustomStepBaseSchema.fields,
  step: LighthouseAuditStepTypeSchema.pick([LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT]),
  name: Schema.optional(Schema.NonEmptyString),
});

export const UserflowStepSchema = Schema.Union([
  UserflowStartNavigationStepSchema,
  UserflowEndNavigationStepSchema,
  UserflowStartTimespanStepSchema,
  UserflowEndTimespanStepSchema,
  UserflowSnapshotStepSchema,
]);

export const UserflowAuditStepTypeScheme = LighthouseAuditStepTypeSchema;

export const UserflowStepTypeWithStepFlagsLiteral = UserflowAuditStepTypeScheme.pick([
  LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
  LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
  LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
]);

export const UserflowStepTypeWithoutStepFlagsLiteral = UserflowAuditStepTypeScheme.pick([
  LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
  LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
]);

const ReplayUserflowStepFlagsSchema = Schema.Struct({
  name: Schema.optional(Schema.NonEmptyString),
});

const ReplayUserflowStepWithFlagsSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP),
  name: UserflowStepTypeWithStepFlagsLiteral,
  parameters: Schema.optional(ReplayUserflowStepFlagsSchema),
});

const UserflowStartNavigationRunnerStepSchema = UserflowStartNavigationStepSchema.pipe(
  Schema.decodeTo(
    Schema.Struct({
      type: ReplayUserflowStepWithFlagsSchema.fields.type,
      name: Schema.Literal(LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION),
      parameters: Schema.UndefinedOr(Schema.Struct({ name: Schema.String })),
    }),
    SchemaTransformation.transform({
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
    }),
  ),
);

const UserflowStartTimespanRunnerStepSchema = UserflowStartTimespanStepSchema.pipe(
  Schema.decodeTo(
    Schema.Struct({
      type: ReplayUserflowStepWithFlagsSchema.fields.type,
      name: Schema.Literal(LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN),
      parameters: Schema.UndefinedOr(Schema.Struct({ name: Schema.String })),
    }),
    SchemaTransformation.transform({
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
    }),
  ),
);

const UserflowSnapshotRunnerStepSchema = UserflowSnapshotStepSchema.pipe(
  Schema.decodeTo(
    Schema.Struct({
      type: ReplayUserflowStepWithFlagsSchema.fields.type,
      name: Schema.Literal(LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT),
      parameters: Schema.UndefinedOr(Schema.Struct({ name: Schema.String })),
    }),
    SchemaTransformation.transform({
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
    }),
  ),
);

const ReplayUserflowStepWithoutFlagsSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP),
  name: UserflowStepTypeWithoutStepFlagsLiteral,
  parameters: Schema.optional(Schema.Undefined),
});

const UserflowEndNavigationRunnerStepSchema = UserflowEndNavigationStepSchema.pipe(
  Schema.decodeTo(
    Schema.Struct({
      type: ReplayUserflowStepWithoutFlagsSchema.fields.type,
      name: Schema.Literal(LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION),
      parameters: Schema.Undefined,
    }),
    SchemaTransformation.transform({
      decode: () => ({
        type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
        name: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
        parameters: undefined,
      }),
      encode: () => ({
        type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
        step: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
      }),
    }),
  ),
);

const UserflowEndTimespanRunnerStepSchema = UserflowEndTimespanStepSchema.pipe(
  Schema.decodeTo(
    Schema.Struct({
      type: ReplayUserflowStepWithoutFlagsSchema.fields.type,
      name: Schema.Literal(LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN),
      parameters: Schema.Undefined,
    }),
    SchemaTransformation.transform({
      decode: () => ({
        type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
        name: LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
        parameters: undefined,
      }),
      encode: () => ({
        type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
        step: LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
      }),
    }),
  ),
);

export const ReplayUserflowStepSchema = Schema.Union([
  Schema.toType(UserflowStartNavigationRunnerStepSchema),
  Schema.toType(UserflowEndNavigationRunnerStepSchema),
  Schema.toType(UserflowStartTimespanRunnerStepSchema),
  Schema.toType(UserflowEndTimespanRunnerStepSchema),
  Schema.toType(UserflowSnapshotRunnerStepSchema),
]);

export const isReplayUserflowStep = Schema.is(ReplayUserflowStepSchema);
export const isReplayUserflowStepWithFlags = Schema.is(ReplayUserflowStepWithFlagsSchema);

export const UserflowRunnerStepSchema = Schema.Union([
  UserflowStartNavigationRunnerStepSchema,
  UserflowEndNavigationRunnerStepSchema,
  UserflowStartTimespanRunnerStepSchema,
  UserflowEndTimespanRunnerStepSchema,
  UserflowSnapshotRunnerStepSchema,
]);

export const UserflowBuilderStepVariants: readonly BuilderStepVariantDefinition[] = [
  {
    id: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
    schema: UserflowStartNavigationStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
    },
  },
  {
    id: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
    schema: UserflowEndNavigationStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
    },
  },
  {
    id: LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
    schema: UserflowStartTimespanStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
    },
  },
  {
    id: LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
    schema: UserflowEndTimespanStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
    },
  },
  {
    id: LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
    schema: UserflowSnapshotStepSchema,
    defaultValue: {
      type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
      step: LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
    },
  },
];
