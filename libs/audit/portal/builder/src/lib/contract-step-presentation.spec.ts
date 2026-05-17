import {
  AUDIT_BUILDER_STEP_VARIANTS,
  AUDIT_CUSTOM_STEP_TYPE,
  deriveBuilderStepContract,
  LIGHTHOUSE_AUDIT_STEP_TYPE,
  type BuilderFieldContract,
} from '@app-speed/audit/domain';
import { describe, expect, it } from 'vitest';
import { AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY, STEP_SELECTION_OPTIONS_GROUPED } from './contract-step-presentation';

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

  it('groups audit and custom steps separately in the selector', () => {
    expect(STEP_SELECTION_OPTIONS_GROUPED).toContainEqual({
      label: 'Audit Steps',
      icon: 'lighthouse-badge',
      options: [
        LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
        LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
        LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
        LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
        LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
      ],
    });

    expect(STEP_SELECTION_OPTIONS_GROUPED).toContainEqual({
      label: 'Custom Steps',
      icon: 'puppeteer-badge',
      options: [AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE, AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE],
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
