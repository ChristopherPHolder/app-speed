import { FormArray, FormGroup } from '@angular/forms';
import { AUDIT_CUSTOM_STEP_TYPE, type BuilderFieldSpec } from '@app-speed/audit/domain';
import { describe, expect, it } from 'vitest';
import { BuilderStepFormGroup, findStepSpec } from './step-form';

describe('BuilderStepFormGroup', () => {
  it('builds a step form from the derived spec and keeps optional fields omittable at root and nested struct arrays', () => {
    const form = createForm('waitForElement');
    const assertedEventsField = expectArrayField(findField(form.spec.fields, 'assertedEvents'));

    expect(form.getRawValue()).toEqual({
      type: 'waitForElement',
      count: 1,
      selectors: [],
    });
    expect(form.optionalFields(form.spec.fields, form).map((field) => field.path)).toEqual([
      'assertedEvents',
      'attributes',
      'frame',
      'operator',
      'properties',
      'target',
      'timeout',
      'visible',
    ]);

    form.addOptionalField(form, assertedEventsField);

    const assertedEventsControl = form.get('assertedEvents') as FormArray<FormGroup>;

    form.addArrayItem(assertedEventsControl, assertedEventsField);

    const assertedEventControl = assertedEventsControl.at(0) as FormGroup;
    const assertedEventGroup = expectGroupField(assertedEventsField.element);
    const titleField = findField(assertedEventGroup.fields, 'assertedEvents[].title');

    expect(assertedEventControl.getRawValue()).toEqual({ type: 'navigation' });
    expect(form.optionalFields(assertedEventGroup.fields, assertedEventControl).map((field) => field.path)).toEqual([
      'assertedEvents[].title',
      'assertedEvents[].url',
    ]);

    form.addOptionalField(assertedEventControl, titleField);

    expect(assertedEventControl.getRawValue()).toEqual({
      type: 'navigation',
      title: '',
    });

    form.removeOptionalField(assertedEventControl, titleField);

    expect(assertedEventControl.getRawValue()).toEqual({ type: 'navigation' });
  });

  it('derives Angular validators from the domain step metadata', () => {
    const waitForExpression = createForm('waitForExpression');
    const navigate = createForm('navigate');
    const click = createForm('click');
    const sleep = createForm(AUDIT_CUSTOM_STEP_TYPE.SLEEP);
    const selectorsField = expectArrayField(findField(click.spec.fields, 'selectors'));

    const expressionControl = waitForExpression.get('expression');
    const urlControl = navigate.get('url');
    const offsetXControl = click.get('offsetX');
    const secondsControl = sleep.get('seconds');

    expect(expressionControl?.hasError('required')).toBe(true);

    expect(urlControl?.hasError('required')).toBe(true);
    urlControl?.setValue('http://example.com');
    expect(urlControl?.hasError('pattern')).toBe(true);
    urlControl?.setValue('https://localhost:4200/example');
    expect(urlControl?.valid).toBe(true);
    urlControl?.setValue('about:blank');
    expect(urlControl?.valid).toBe(true);

    offsetXControl?.setValue(-1);
    expect(offsetXControl?.hasError('min')).toBe(true);
    offsetXControl?.setValue(1.5);
    expect(offsetXControl?.hasError('integer')).toBe(true);

    secondsControl?.setValue(0);
    expect(secondsControl?.hasError('min')).toBe(true);
    secondsControl?.setValue(61);
    expect(secondsControl?.hasError('max')).toBe(true);
    secondsControl?.setValue(1.5);
    expect(secondsControl?.hasError('integer')).toBe(true);
    secondsControl?.setValue(60);
    expect(secondsControl?.valid).toBe(true);

    const selectorsControl = click.get('selectors') as FormArray<FormGroup>;
    click.addArrayItem(selectorsControl, selectorsField);

    const selectorControl = selectorsControl.at(0) as FormGroup;
    const segmentsControl = selectorControl.get('segments');

    expect(segmentsControl?.hasError('minlength')).toBe(true);
  });
});

function createForm(variantId: string, value?: Record<string, unknown>): BuilderStepFormGroup {
  return new BuilderStepFormGroup(findStepSpec(variantId), value);
}

function findField(fields: readonly BuilderFieldSpec[], path: string): BuilderFieldSpec {
  const field = fields.find((candidate) => candidate.path === path);

  expect(field).toBeDefined();

  if (!field) {
    throw new Error(`Missing field ${path}`);
  }

  return field;
}

function expectArrayField(field: BuilderFieldSpec): Extract<BuilderFieldSpec, { kind: 'array' }> {
  expect(field.kind).toBe('array');

  if (field.kind !== 'array') {
    throw new Error(`Expected array field, got ${field.kind}`);
  }

  return field;
}

function expectGroupField(field: BuilderFieldSpec): Extract<BuilderFieldSpec, { kind: 'group' }> {
  expect(field.kind).toBe('group');

  if (field.kind !== 'group') {
    throw new Error(`Expected group field, got ${field.kind}`);
  }

  return field;
}
