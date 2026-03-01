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

export const isAuditStepSchema = Schema.is(AuditStepsSchema);
