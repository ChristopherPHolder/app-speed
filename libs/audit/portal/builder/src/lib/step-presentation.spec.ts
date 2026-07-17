import {
  AUDIT_BUILDER_STEP_VARIANTS,
  AUDIT_CUSTOM_STEP_TYPE,
  LIGHTHOUSE_AUDIT_STEP_TYPE,
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  PUPPETEER_REPLAY_USER_STEP_TYPE,
  deriveBuilderStepSpec,
  type BuilderFieldSpec,
} from '@app-speed/audit/domain';
import { describe, expect, it } from 'vitest';
import {
  AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY,
  STEP_SELECTION_OPTIONS_GROUPED,
  getStepPresentation,
} from './step-presentation';

describe('step presentation registry', () => {
  it('only defines overrides for exported builder variants', () => {
    const variantIds = new Set(AUDIT_BUILDER_STEP_VARIANTS.map((variant) => variant.id));

    Object.keys(AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY).forEach((variantId) => {
      expect(variantIds.has(variantId)).toBe(true);
    });
  });

  it('only overrides field paths that exist on the derived variant spec', () => {
    Object.keys(AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY).forEach((variantId) => {
      const variant = AUDIT_BUILDER_STEP_VARIANTS.find((candidate) => candidate.id === variantId);

      expect(variant).toBeDefined();

      if (!variant) {
        throw new Error(`Missing builder variant ${variantId}`);
      }

      const spec = deriveBuilderStepSpec(variant);
      const specPaths = new Set(flattenFieldPaths(spec.fields));
      const presentation = AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY[variantId];

      Object.keys(presentation.fields ?? {}).forEach((path) => {
        expect(specPaths.has(path)).toBe(true);
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
      options: [
        AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
        AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
        AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_TIME,
        AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_NETWORK_IDLE,
      ],
    });
  });

  it('presents waitForNetworkIdle settings with the agreed labels and descriptions', () => {
    expect(getStepPresentation(AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_NETWORK_IDLE)).toEqual({
      group: 'Custom Steps',
      icon: 'puppeteer-badge',
      label: 'Wait For Network Idle',
      fields: {
        idleTime: {
          label: 'Idle Time (ms)',
          description: 'Duration network activity must stay within the allowed concurrency; Puppeteer default: 500 ms.',
        },
        timeout: {
          label: 'Timeout (ms)',
          description: 'Maximum wait; defaults to the audit timeout; 0 disables the timeout.',
        },
        concurrency: {
          label: 'Allowed Concurrent Requests',
          description: 'Maximum active request count still considered idle; Puppeteer default: 0.',
        },
      },
    });
  });

  it('derives default labels, groups, and icons from variant ids', () => {
    expect(getStepPresentation(PUPPETEER_REPLAY_ASSERTION_STEP_TYPE.WAIT_FOR_ELEMENT)).toMatchObject({
      group: 'Assertion Steps',
      icon: 'puppeteer-badge',
      label: 'Wait For Element',
    });

    expect(getStepPresentation(PUPPETEER_REPLAY_USER_STEP_TYPE.SET_VIEWPORT)).toMatchObject({
      group: 'Action Steps',
      icon: 'puppeteer-badge',
      label: 'Set Viewport',
    });

    expect(getStepPresentation(LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION)).toMatchObject({
      group: 'Audit Steps',
      icon: 'lighthouse-badge',
      label: 'Start Navigation',
    });
  });
});

function flattenFieldPaths(fields: readonly BuilderFieldSpec[]): string[] {
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
