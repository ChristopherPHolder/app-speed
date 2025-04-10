import { Schema } from 'effect';
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
  ScrollPageStepSchema,
  ScrollStepSchema,
  SetViewStepSchema,
  WaitForElementStepSchema,
  WaitForExpressionStepSchema,
} from './puppeteer-replay-step';
import {
  UserflowEndNavigationStepSchema,
  UserflowEndTimespanStepSchema,
  UserflowSnapshotStepSchema,
  UserflowStartNavigationStepSchema,
  UserflowStartTimespanStepSchema,
} from './userflow-step';

const AuditStepSchema = Schema.Union(
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
  ScrollPageStepSchema,
  ScrollStepSchema,
  SetViewStepSchema,
  WaitForElementStepSchema,
  WaitForExpressionStepSchema,
  UserflowStartNavigationStepSchema,
  UserflowEndNavigationStepSchema,
  UserflowStartTimespanStepSchema,
  UserflowEndTimespanStepSchema,
  UserflowSnapshotStepSchema,
);

export const AuditStepsSchema = Schema.NonEmptyArray(AuditStepSchema);
// .pipe(
// Schema.filter(
//   (steps) => {
//     return steps.some((step) => Schema.is(NavigateStepSchema)(step));
//   },
//   {
//     identifier: 'MissingNavigation',
//     message: () => 'Audit requires at least one navigation',
//   },
// ),
// Schema.filter(
//   (steps) => {
//     const navigationStepIndex = steps.findIndex((step) => Schema.is(NavigateStepSchema)(step));
//     const snapshotStepIndex = steps.findIndex((step) => Schema.is(UserflowSnapshotStepSchema)(step));
//     return snapshotStepIndex === -1 || navigationStepIndex < snapshotStepIndex;
//   },
//   {
//     identifier: 'SnapshotBeforeNavigation',
//     message: () => 'Snapshot step cannot come before navigation',
//   },
// ),
// Schema.filter(
//   (steps) => {
//     return steps.some((step) => Schema.is(UserflowStepSchema)(step));
//   },
//   {
//     identifier: 'MissingUserflowStep',
//     message: () => 'Audit requires at least one userflow step',
//   },
// ),
// );

export const isAuditStepSchema = Schema.is(AuditStepsSchema);
