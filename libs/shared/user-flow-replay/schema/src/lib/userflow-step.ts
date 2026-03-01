import { Schema } from 'effect';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from '@app-speed/shared-user-flow-replay';
import { CustomStepParamsSchema } from './puppeteer-replay-step';
import { AuditStepTypeSchema } from './audit-step.schema';

export const UserflowStartNavigationStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral('startNavigation')),
  name: Schema.optional(Schema.NonEmptyString),
});
export const UserflowEndNavigationStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral('endNavigation')),
});

export const UserflowStartTimespanStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral('startTimespan')),
  name: Schema.optional(Schema.NonEmptyString),
});

export const UserflowEndTimespanStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral('endTimespan')),
});

export const UserflowSnapshotStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral('snapshot')),
});

export const UserflowStepSchema = Schema.Union(
  UserflowStartNavigationStepSchema,
  UserflowEndNavigationStepSchema,
  UserflowStartTimespanStepSchema,
  UserflowEndTimespanStepSchema,
  UserflowSnapshotStepSchema,
);

export const isUserflowStep = Schema.is(UserflowStepSchema);

export const UserflowAuditStepTypeScheme = Schema.Literal(
  LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
  LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
  LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
  LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
  LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
) satisfies { readonly literals: readonly string[] };

export type UserflowStepType = typeof UserflowAuditStepTypeScheme.Type;

const UserflowStepTypeWithStepFlagsLiteral = UserflowAuditStepTypeScheme.pipe(
  Schema.pickLiteral(
    LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
    LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
    LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
  ),
);

const UserflowStepTypeWithoutStepFlagsLiteral = UserflowAuditStepTypeScheme.pipe(
  Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION, LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN),
);

const ReplayUserflowStepWithFlagsSchema = Schema.Struct({
  ...CustomStepParamsSchema.fields,
  name: UserflowStepTypeWithStepFlagsLiteral,
  parameters: Schema.Struct({ name: Schema.NonEmptyString }),
});

export const LighthouseUserflowStepWithFlagsSchema = Schema.Struct({
  type: UserflowStepTypeWithStepFlagsLiteral,
  name: Schema.NonEmptyString,
});

export const LighthouseUserflowStepWithoutFlagsSchema = Schema.Struct({
  type: UserflowStepTypeWithoutStepFlagsLiteral,
});

export const LighthouseUserflowStepSchema = Schema.Union(
  LighthouseUserflowStepWithFlagsSchema,
  LighthouseUserflowStepWithoutFlagsSchema,
);

const UserflowStepTypeWithStepFlagsScheme = Schema.transform(
  LighthouseUserflowStepWithFlagsSchema,
  ReplayUserflowStepWithFlagsSchema,
  {
    strict: true,
    decode: ({ type, name }) => ({
      type: CustomStepParamsSchema.fields.type.literals[0],
      name: type,
      parameters: { name },
    }),
    encode: ({ name, parameters }) => ({
      type: name,
      name: parameters.name,
    }),
  },
);

export const ReplayUserflowStepWithoutFlagsSchema = Schema.Struct({
  ...CustomStepParamsSchema.fields,
  name: UserflowStepTypeWithoutStepFlagsLiteral,
  parameters: Schema.optional(Schema.Undefined),
});

const UserflowStepTypeWithoutStepFlagsScheme = Schema.transform(
  LighthouseUserflowStepWithoutFlagsSchema,
  ReplayUserflowStepWithoutFlagsSchema,
  {
    strict: true,
    decode: ({ type }) => ({
      type: CustomStepParamsSchema.fields.type.literals[0],
      name: type,
      parameters: undefined,
    }),
    encode: ({ name }) => ({
      type: name,
    }),
  },
);

const ReplayUserflowStepSchema = Schema.Union(ReplayUserflowStepWithoutFlagsSchema, ReplayUserflowStepWithFlagsSchema);

export const decodeReplayUserflowStepSchema = Schema.decodeUnknownSync(ReplayUserflowStepSchema);
export const isUserflowStepTypeWithStepFlags = Schema.is(UserflowStepTypeWithStepFlagsLiteral);
export const isReplayUserflowStep = Schema.is(ReplayUserflowStepSchema);
export const isReplayUserflowStepWithFlags = Schema.is(ReplayUserflowStepWithFlagsSchema);

export const UserflowAuditStepSchema = Schema.Union(
  UserflowStepTypeWithStepFlagsScheme,
  UserflowStepTypeWithoutStepFlagsScheme,
  ReplayUserflowStepSchema,
);
