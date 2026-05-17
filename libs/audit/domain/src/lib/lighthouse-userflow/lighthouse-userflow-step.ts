import { Schema } from 'effect';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from './lighthouse-userflow-step-type';
import {
  PuppeteerReplayStepTypeSchema,
  PUPPETEER_REPLAY_CUSTOM_STEP_TYPE,
} from '../puppeteer-replay/puppeteer-replay-step-type';
import { AuditStepTypeSchema, LighthouseAuditStepTypeSchema } from '../audit-step.schema';
import type { BuilderStepVariantDefinition } from '../builder-step-variant';

export const UserflowStartNavigationStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  step: LighthouseAuditStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION)),
  name: Schema.optional(Schema.NonEmptyString),
});
export const UserflowEndNavigationStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  step: LighthouseAuditStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION)),
});

export const UserflowStartTimespanStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  step: LighthouseAuditStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN)),
  name: Schema.optional(Schema.NonEmptyString),
});

export const UserflowEndTimespanStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  step: LighthouseAuditStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN)),
});

export const UserflowSnapshotStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  step: LighthouseAuditStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT)),
  name: Schema.optional(Schema.NonEmptyString),
});

export const UserflowStepSchema = Schema.Union(
  UserflowStartNavigationStepSchema,
  UserflowEndNavigationStepSchema,
  UserflowStartTimespanStepSchema,
  UserflowEndTimespanStepSchema,
  UserflowSnapshotStepSchema,
);

export const isUserflowStep = Schema.is(UserflowStepSchema);

export const UserflowAuditStepTypeScheme = LighthouseAuditStepTypeSchema;

export const UserflowStepTypeWithStepFlagsLiteral = UserflowAuditStepTypeScheme.pipe(
  Schema.pickLiteral(
    LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
    LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
    LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
  ),
);

export const UserflowStepTypeWithoutStepFlagsLiteral = UserflowAuditStepTypeScheme.pipe(
  Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION, LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN),
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

export const ReplayUserflowStepSchema = Schema.Union(
  Schema.typeSchema(UserflowStartNavigationRunnerStepSchema),
  Schema.typeSchema(UserflowEndNavigationRunnerStepSchema),
  Schema.typeSchema(UserflowStartTimespanRunnerStepSchema),
  Schema.typeSchema(UserflowEndTimespanRunnerStepSchema),
  Schema.typeSchema(UserflowSnapshotRunnerStepSchema),
);

export const isReplayUserflowStep = Schema.is(ReplayUserflowStepSchema);
export const isReplayUserflowStepWithFlags = Schema.is(ReplayUserflowStepWithFlagsSchema);

export const UserflowRunnerStepSchema = Schema.Union(
  UserflowStartNavigationRunnerStepSchema,
  UserflowEndNavigationRunnerStepSchema,
  UserflowStartTimespanRunnerStepSchema,
  UserflowEndTimespanRunnerStepSchema,
  UserflowSnapshotRunnerStepSchema,
);

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
