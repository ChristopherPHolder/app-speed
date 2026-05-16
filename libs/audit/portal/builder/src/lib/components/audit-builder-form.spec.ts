import { describe, expect, it } from 'vitest';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from '@app-speed/audit/domain';
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
});
