import {
  AuditCustomBuilderStepVariants,
  type BuilderStepVariantDefinition,
  deriveBuilderStepSpec,
  PuppeteerReplayBuilderStepVariants,
} from '@app-speed/audit/core/domain';

import { UserflowBuilderStepVariants } from './lighthouse-userflow/lighthouse-userflow-step';

export const USER_FLOW_AUDIT_BUILDER_STEP_VARIANTS: readonly BuilderStepVariantDefinition[] = [
  ...PuppeteerReplayBuilderStepVariants,
  ...UserflowBuilderStepVariants,
  ...AuditCustomBuilderStepVariants,
];

export { deriveBuilderStepSpec };
