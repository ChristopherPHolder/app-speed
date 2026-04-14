import { Schema } from 'effect';
import {
  LIGHTHOUSE_AUDIT_STEP_TYPE,
  CustomStepParamsSchema,
  PuppeteerReplayStepTypeSchema,
  PUPPETEER_REPLAY_CUSTOM_STEP_TYPE,
} from '@app-speed/audit/model';
import { AuditStepTypeSchema } from './audit-step.schema';

export const UserflowStartNavigationStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION)),
  name: Schema.optional(Schema.NonEmptyString),
});
export const UserflowEndNavigationStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION)),
});

export const UserflowStartTimespanStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN)),
  name: Schema.optional(Schema.NonEmptyString),
});

export const UserflowEndTimespanStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN)),
});

export const UserflowSnapshotStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT)),
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
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
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
  type: PuppeteerReplayStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
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

export const ReplayUserflowStepSchema = Schema.Union(
  ReplayUserflowStepWithoutFlagsSchema,
  ReplayUserflowStepWithFlagsSchema,
);

export const isReplayUserflowStep = Schema.is(ReplayUserflowStepSchema);
export const isReplayUserflowStepWithFlags = Schema.is(ReplayUserflowStepWithFlagsSchema);

export const UserflowAuditStepSchema = Schema.Union(
  UserflowStepTypeWithStepFlagsScheme,
  UserflowStepTypeWithoutStepFlagsScheme,
  ReplayUserflowStepSchema,
);
