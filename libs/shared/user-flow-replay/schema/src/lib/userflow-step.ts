import { Schema } from 'effect';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from '@app-speed/shared-user-flow-replay';
import { CustomStepParamsSchema } from './puppeteer-replay-step';

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
  ...CustomStepParamsSchema.fields,
  name: UserflowStepTypeWithStepFlagsLiteral,
  parameters: Schema.Struct({ name: Schema.NonEmptyString }),
});

const UserflowStepTypeWithStepFlagsScheme = Schema.transform(
  Schema.Struct({
    type: UserflowStepTypeWithStepFlagsLiteral,
    name: Schema.NonEmptyString,
  }),
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

const ReplayUserflowStepWithoutFlagsSchema = Schema.Struct({
  ...CustomStepParamsSchema.fields,
  name: UserflowStepTypeWithoutStepFlagsLiteral,
  parameters: Schema.Undefined,
});

const UserflowStepTypeWithoutStepFlagsScheme = Schema.transform(
  Schema.Struct({
    type: UserflowStepTypeWithoutStepFlagsLiteral,
  }),
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
export const isReplayUserflowStep = Schema.is(ReplayUserflowStepSchema);
export const isReplayUserflowStepWithFlags = Schema.is(ReplayUserflowStepWithFlagsSchema);

export const UserflowAuditStepSchema = Schema.Union(
  ReplayUserflowStepSchema,
  UserflowStepTypeWithStepFlagsScheme,
  UserflowStepTypeWithoutStepFlagsScheme,
);
