import type { BuilderFieldSpec } from '@app-speed/audit/domain';
import { describe, expect, it } from 'vitest';
import { AUDIT_CUSTOM_STEP_TYPE, LIGHTHOUSE_AUDIT_STEP_TYPE } from '@app-speed/audit/domain';
import { AuditFormGroup, StepFormGroup } from './audit-builder-form';

describe('StepFormGroup', () => {
  it('keeps schema-driven step values serializable through the root audit form value', () => {
    const auditForm = new AuditFormGroup({
      title: 'Checkout audit',
      device: 'mobile',
      timeout: 30000,
      steps: [
        {
          type: 'waitForElement',
          selectors: [{ segments: ['[data-testid=checkout-button]'] }],
          count: 1,
          assertedEvents: [
            {
              type: 'navigation',
              title: 'Checkout',
              url: 'https://example.com/checkout',
            },
          ],
          attributes: {
            role: 'button',
          },
          properties: {
            disabled: 'false',
          },
        },
      ],
    });

    expect(auditForm.value).toEqual({
      title: 'Checkout audit',
      device: 'mobile',
      timeout: 30000,
      steps: [
        {
          type: 'waitForElement',
          selectors: [{ segments: ['[data-testid=checkout-button]'] }],
          count: 1,
          assertedEvents: [
            {
              type: 'navigation',
              title: 'Checkout',
              url: 'https://example.com/checkout',
            },
          ],
          attributes: {
            role: 'button',
          },
          properties: {
            disabled: 'false',
          },
        },
      ],
    });
  });

  it('derives the unified selector value from custom-step objects', () => {
    const formGroup = new StepFormGroup({
      type: 'customStep',
      step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
      name: 'Initial Navigation',
    });

    expect(formGroup.selectionControl.value).toBe(LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION);
    expect(formGroup.getRawValue()).toEqual({
      type: 'customStep',
      step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
      name: 'Initial Navigation',
    });
  });

  it('selecting a custom step produces the explicit object shape', () => {
    const formGroup = new StepFormGroup({ type: '' });

    formGroup.resetStepControls(LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT);

    expect(formGroup.selectionControl.value).toBe(LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT);
    expect(formGroup.getRawValue()).toMatchObject({
      type: 'customStep',
      step: LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
    });
    expect(formGroup.visibleFields(formGroup.spec.fields, formGroup)).toEqual([]);
    expect(formGroup.optionalFields(formGroup.spec.fields, formGroup).map((field) => field.path)).toEqual(['name']);
  });

  it('selecting clearCache produces a parameterless custom step', () => {
    const formGroup = new StepFormGroup({ type: '' });

    formGroup.resetStepControls(AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE);

    expect(formGroup.selectionControl.value).toBe(AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE);
    expect(formGroup.getRawValue()).toEqual({
      type: 'customStep',
      step: AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
    });
    expect(formGroup.visibleFields(formGroup.spec.fields, formGroup)).toEqual([]);
    expect(formGroup.optionalFields(formGroup.spec.fields, formGroup)).toEqual([]);
  });

  it('selecting addCookie exposes required fields first and optional properties separately', () => {
    const formGroup = new StepFormGroup({ type: '' });

    formGroup.resetStepControls(AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE);

    expect(formGroup.selectionControl.value).toBe(AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE);
    expect(formGroup.getRawValue()).toMatchObject({
      type: 'customStep',
      step: AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
      name: '',
      value: '',
      url: '',
    });
    expect(formGroup.visibleFields(formGroup.spec.fields, formGroup).map((field) => field.path)).toEqual([
      'name',
      'value',
      'url',
    ]);
    expect(formGroup.optionalFields(formGroup.spec.fields, formGroup).map((field) => field.path)).toEqual([
      'domain',
      'path',
      'secure',
      'httpOnly',
      'sameSite',
    ]);

    formGroup.addOptionalField(formGroup, findField(formGroup.spec.fields, 'sameSite'));

    expect(formGroup.visibleFields(formGroup.spec.fields, formGroup).map((field) => field.path)).toEqual([
      'name',
      'value',
      'url',
      'sameSite',
    ]);
    expect(formGroup.optionalFields(formGroup.spec.fields, formGroup).map((field) => field.path)).toEqual([
      'domain',
      'path',
      'secure',
      'httpOnly',
    ]);
  });

  it('selecting waitForTime produces a bounded required seconds field', () => {
    const formGroup = new StepFormGroup({ type: '' });

    formGroup.resetStepControls(AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_TIME);

    expect(formGroup.selectionControl.value).toBe(AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_TIME);
    expect(formGroup.getRawValue()).toEqual({
      type: 'customStep',
      step: AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_TIME,
      seconds: 1,
    });
    expect(formGroup.visibleFields(formGroup.spec.fields, formGroup).map((field) => field.path)).toEqual(['seconds']);
    expect(formGroup.optionalFields(formGroup.spec.fields, formGroup)).toEqual([]);
  });
});

function findField(fields: readonly BuilderFieldSpec[], path: string): BuilderFieldSpec {
  const field = fields.find((candidate) => candidate.path === path);

  expect(field).toBeDefined();

  if (!field) {
    throw new Error(`Missing field ${path}`);
  }

  return field;
}
