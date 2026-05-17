import {
  AUDIT_BUILDER_STEP_VARIANTS,
  AUDIT_CUSTOM_STEP_TYPE,
  LIGHTHOUSE_AUDIT_STEP_TYPE,
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  PUPPETEER_REPLAY_USER_STEP_TYPE,
  deriveBuilderStepContract,
  type BuilderFieldContract,
} from '@app-speed/audit/domain';
import { describe, expect, it } from 'vitest';
import {
  AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY,
  STEP_SELECTION_OPTIONS_GROUPED,
  getContractStepPresentation,
} from './contract-step-presentation';

describe('contract step presentation registry', () => {
  it('only defines overrides for exported builder variants', () => {
    const variantIds = new Set(AUDIT_BUILDER_STEP_VARIANTS.map((variant) => variant.id));

    Object.keys(AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY).forEach((variantId) => {
      expect(variantIds.has(variantId)).toBe(true);
    });
  });

  it('only overrides field paths that exist on the derived variant contract', () => {
    Object.keys(AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY).forEach((variantId) => {
      const variant = AUDIT_BUILDER_STEP_VARIANTS.find((candidate) => candidate.id === variantId);

      expect(variant).toBeDefined();

      if (!variant) {
        throw new Error(`Missing builder variant ${variantId}`);
      }

      const contract = deriveBuilderStepContract(variant);
      const contractPaths = new Set(flattenFieldPaths(contract.fields));
      const presentation = AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY[variantId];

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

  it('derives default labels, groups, and icons from variant ids', () => {
    expect(getContractStepPresentation(PUPPETEER_REPLAY_ASSERTION_STEP_TYPE.WAIT_FOR_ELEMENT)).toMatchObject({
      group: 'Assertion Steps',
      icon: 'puppeteer-badge',
      label: 'Wait For Element',
    });

    expect(getContractStepPresentation(PUPPETEER_REPLAY_USER_STEP_TYPE.SET_VIEWPORT)).toMatchObject({
      group: 'Action Steps',
      icon: 'puppeteer-badge',
      label: 'Set Viewport',
    });

    expect(getContractStepPresentation(LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION)).toMatchObject({
      group: 'Audit Steps',
      icon: 'lighthouse-badge',
      label: 'Start Navigation',
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
