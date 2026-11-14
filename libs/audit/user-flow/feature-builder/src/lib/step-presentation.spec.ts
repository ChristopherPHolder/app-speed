import {
  AUDIT_CUSTOM_STEP_TYPE,
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  PUPPETEER_REPLAY_USER_STEP_TYPE,
  type BuilderFieldSpec,
} from '@app-speed/audit/core/domain';
import {
  USER_FLOW_AUDIT_BUILDER_STEP_VARIANTS,
  LIGHTHOUSE_AUDIT_STEP_TYPE,
  deriveBuilderStepSpec,
} from '@app-speed/audit/user-flow/domain';
import { describe, expect, it } from 'vitest';
import {
  AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY,
  STEP_FIELD_PRESENTATION,
  STEP_SELECTION_OPTIONS_GROUPED,
  getStepFieldPresentation,
  getStepPresentation,
  humanizeStepToken,
} from './step-presentation';

describe('step presentation registry', () => {
  it('only defines overrides for exported builder variants', () => {
    const variantIds = new Set(USER_FLOW_AUDIT_BUILDER_STEP_VARIANTS.map((variant) => variant.id));

    Object.keys(AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY).forEach((variantId) => {
      expect(variantIds.has(variantId)).toBe(true);
    });
  });

  it('only overrides field paths that exist on the derived variant spec', () => {
    Object.keys(AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY).forEach((variantId) => {
      const variant = USER_FLOW_AUDIT_BUILDER_STEP_VARIANTS.find((candidate) => candidate.id === variantId);

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

  it('only describes shared fields that exist on a builder variant, with options the schema offers', () => {
    const fields = USER_FLOW_AUDIT_BUILDER_STEP_VARIANTS.flatMap((variant) =>
      flattenFields(deriveBuilderStepSpec(variant).fields),
    );

    for (const [path, presentation] of Object.entries(STEP_FIELD_PRESENTATION)) {
      const matches = fields.filter((field) => field.path === path);
      expect(matches.length, path).toBeGreaterThan(0);

      for (const option of Object.keys(presentation.options ?? {})) {
        expect(
          matches.every((field) => field.kind === 'enum' && field.options.includes(option)),
          `${path}: ${option}`,
        ).toBe(true);
      }
    }
  });

  it('labels a field the same way on every step type unless the step overrides it', () => {
    for (const variantId of ['click', 'navigate', 'waitForElement', 'keyDown']) {
      expect(getStepFieldPresentation(variantId, 'target')?.label).toBe('Target page');
      expect(getStepFieldPresentation(variantId, 'timeout')?.label).toBe('Timeout (ms)');
      expect(getStepFieldPresentation(variantId, 'assertedEvents')?.itemLabel).toBe('Asserted event');
    }

    expect(getStepFieldPresentation('click', 'button')?.options).toMatchObject({ primary: 'Primary' });
    expect(getStepFieldPresentation(AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_NETWORK_IDLE, 'timeout')?.description).toContain(
      'defaults to the audit timeout',
    );
    expect(getStepFieldPresentation('navigate', 'url')).toBeUndefined();
    expect(getStepFieldPresentation(AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE, 'url')?.label).toBe('Cookie URL');
  });

  it('writes derived labels in sentence case', () => {
    expect(humanizeStepToken('waitForElement')).toBe('Wait for element');
    expect(humanizeStepToken('deviceScaleFactor')).toBe('Device scale factor');
    expect(humanizeStepToken('url')).toBe('URL');
    expect(humanizeStepToken('assertedEvents[]')).toBe('Asserted events');
  });

  it('groups audit and custom steps separately in the selector', () => {
    expect(STEP_SELECTION_OPTIONS_GROUPED).toContainEqual({
      label: 'Audit steps',
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
      label: 'Custom steps',
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
      group: 'Custom steps',
      icon: 'puppeteer-badge',
      label: 'Wait for network idle',
      fields: {
        idleTime: {
          label: 'Idle time (ms)',
          description: 'Duration network activity must stay within the allowed concurrency; Puppeteer default: 500 ms.',
        },
        timeout: {
          label: 'Timeout (ms)',
          description: 'Maximum wait; defaults to the audit timeout; 0 disables the timeout.',
        },
        concurrency: {
          label: 'Allowed concurrent requests',
          description: 'Maximum active request count still considered idle; Puppeteer default: 0.',
        },
      },
    });
  });

  it('derives default labels, groups, and icons from variant ids', () => {
    expect(getStepPresentation(PUPPETEER_REPLAY_ASSERTION_STEP_TYPE.WAIT_FOR_ELEMENT)).toMatchObject({
      group: 'Assertion steps',
      icon: 'puppeteer-badge',
      label: 'Wait for element',
    });

    expect(getStepPresentation(PUPPETEER_REPLAY_USER_STEP_TYPE.SET_VIEWPORT)).toMatchObject({
      group: 'Action steps',
      icon: 'puppeteer-badge',
      label: 'Set viewport',
    });

    expect(getStepPresentation(LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION)).toMatchObject({
      group: 'Audit steps',
      icon: 'lighthouse-badge',
      label: 'Start navigation',
    });
  });
});

function flattenFieldPaths(fields: readonly BuilderFieldSpec[]): string[] {
  return flattenFields(fields).map((field) => field.path);
}

function flattenFields(fields: readonly BuilderFieldSpec[]): BuilderFieldSpec[] {
  return fields.flatMap((field) => {
    switch (field.kind) {
      case 'group':
        return [field, ...flattenFields(field.fields)];
      case 'array':
        return [field, ...flattenFields([field.element])];
      case 'record':
        return [field, ...flattenFields([field.value])];
      default:
        return [field];
    }
  });
}
