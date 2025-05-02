import { Schema } from 'effect';
import { DeviceSchema } from '@app-speed/shared-user-flow-replay';
import {
  isUserflowStep,
  UserflowEndNavigationStepSchema,
  UserflowEndTimespanStepSchema,
  UserflowSnapshotStepSchema,
  UserflowStartNavigationStepSchema,
  UserflowStartTimespanStepSchema,
} from './userflow-step';
import {
  ChangeStepSchema,
  ClickStepSchema,
  CloseStepSchema,
  CustomStepWithFrameSchema,
  CustomStepWithTargetSchema,
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
} from './puppeteer-replay-step';

export const AuditStepSchema = Schema.Union(
  // Puppeteer
  ChangeStepSchema,
  ClickStepSchema,
  CloseStepSchema,
  CustomStepWithTargetSchema,
  CustomStepWithFrameSchema,
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
  // UserFlow
  UserflowStartNavigationStepSchema,
  UserflowEndNavigationStepSchema,
  UserflowStartTimespanStepSchema,
  UserflowEndTimespanStepSchema,
  UserflowSnapshotStepSchema,
).annotations({
  title: 'AuditStep',
});

export type AuditStep = typeof AuditStepSchema.Type;
const AuditStepsSchema = Schema.NonEmptyArray(AuditStepSchema);

const RequiresAuditStepSchemaFilter = Schema.filter<typeof AuditStepsSchema>(
  (steps) => !!steps.filter((step) => isUserflowStep(step)).length || 'Requires at least one audit steps',
);

export const ReplayUserflowAuditSchema = Schema.Struct({
  title: Schema.NonEmptyString,
  device: DeviceSchema,
  timeout: Schema.optional(Schema.NonNegativeInt),
  steps: Schema.NonEmptyArray(AuditStepSchema).pipe(RequiresAuditStepSchemaFilter).annotations({ title: 'AuditSteps' }),
}).annotations({ title: 'ReplayUserflowAudit' });

export type ReplayUserflowAudit = typeof ReplayUserflowAuditSchema.Type;
