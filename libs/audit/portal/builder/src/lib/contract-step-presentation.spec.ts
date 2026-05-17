import { AUDIT_BUILDER_STEP_VARIANTS, deriveBuilderStepContract, type BuilderFieldContract } from '@app-speed/audit/domain';
import { describe, expect, it } from 'vitest';
import { AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY } from './contract-step-presentation';

describe('contract step presentation registry', () => {
  it('defines portal presentation for every exported builder variant', () => {
    expect(Object.keys(AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY)).toEqual(
      AUDIT_BUILDER_STEP_VARIANTS.map((variant) => variant.id),
    );
  });

  it('only overrides field paths that exist on the derived variant contract', () => {
    AUDIT_BUILDER_STEP_VARIANTS.forEach((variant) => {
      const contract = deriveBuilderStepContract(variant);
      const contractPaths = new Set(flattenFieldPaths(contract.fields));
      const presentation = AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY[variant.id];

      Object.keys(presentation.fields ?? {}).forEach((path) => {
        expect(contractPaths.has(path)).toBe(true);
      });
    });
  });
});

function flattenFieldPaths(fields: readonly BuilderFieldContract[]): string[] {
  return fields.flatMap((field) => {
    switch (field.kind) {
      case 'group':
        return [field.path, ...flattenFieldPaths(field.fields)];
      case 'array':
        return [field.path, ...flattenFieldPaths([field.element])];
      case 'record':
        return [field.path, ...flattenFieldPaths([field.value])];
      default:
        return [field.path];
    }
  });
}
