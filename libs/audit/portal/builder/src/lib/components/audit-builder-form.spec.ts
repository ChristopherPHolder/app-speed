import { describe, expect, it } from 'vitest';
import { AUDIT_CUSTOM_STEP_TYPE, LIGHTHOUSE_AUDIT_STEP_TYPE } from '@app-speed/audit/domain';
import { StepFormGroup } from './audit-builder-form';

describe('StepFormGroup', () => {
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
    expect(formGroup.fields()).toEqual(['name']);
  });

  it('selecting clearCache produces a parameterless custom step', () => {
    const formGroup = new StepFormGroup({ type: '' });

    formGroup.resetStepControls(AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE);

    expect(formGroup.selectionControl.value).toBe(AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE);
    expect(formGroup.getRawValue()).toEqual({
      type: 'customStep',
      step: AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
    });
    expect(formGroup.fields()).toEqual([]);
    expect(formGroup.optionalFields()).toEqual([]);
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
    expect(formGroup.fields()).toEqual(['name', 'value', 'url']);
    expect(formGroup.optionalFields()).toEqual(['domain', 'path', 'secure', 'httpOnly', 'sameSite']);

    formGroup.addOptionalField('sameSite');

    expect(formGroup.fields()).toEqual(['name', 'value', 'url', 'sameSite']);
    expect(formGroup.optionalFields()).toEqual(['domain', 'path', 'secure', 'httpOnly']);
  });
});
