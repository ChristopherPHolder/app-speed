import { describe, expect, it } from 'vitest';
import { CORE_AUDIT_BUILDER_STEP_VARIANTS, deriveBuilderStepSpec } from './builder-step-spec';

describe('deriveBuilderStepSpec', () => {
  it('derives a builder specification for every registered variant', () => {
    expect(() => CORE_AUDIT_BUILDER_STEP_VARIANTS.map(deriveBuilderStepSpec)).not.toThrow();
  });
});
