import { Injectable } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { first, map, Observable, tap } from 'rxjs';

import {
  AuditDetails,
  DeviceType,
  InputType,
  InputValue,
  PropertyName,
  Step,
  StepDetails,
  StepProperty,
} from './audit-builder.types';
import { EMPTY_STEP, STEP_OPTIONS } from './audit-step.scheme';
import { STEP_PROPERTY } from './step-properties.schema';

type StepFormGroup = FormGroup<Partial<Record<PropertyName, FormControl | FormArray>>>;

@Injectable({ providedIn: 'root' })
export class AuditBuilderService {
  public readonly formGroup = new FormGroup({
    title: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
    device: new FormControl<DeviceType>('mobile', { validators: [Validators.required], nonNullable: true }),
    timeout: new FormControl<number>(30000, { validators: [Validators.required], nonNullable: true }),
    steps: new FormArray<StepFormGroup>([])
  });
  steps = this.formGroup.controls.steps;

  auditInit$(initialAuditDetails$: Observable<AuditDetails>): Observable<boolean> {
    return initialAuditDetails$.pipe(
      tap((details) => {
        this.formGroup.controls.title.setValue(details?.title);
        this.formGroup.controls.device.setValue(details.device);
        this.formGroup.controls.timeout.setValue(details.timeout);
        details.steps.forEach((step, index) => this.initStep(step, index));
      }),
      map(() => true),
      first()
    );
  }

  private initStep(step: Step, index: number): void {
    const stepSchema: StepDetails = this.getStepSchema(step);
    if (!stepSchema) return;
    const stepFormGroup = this.getStepFormGroup(step, stepSchema);
    return this.formGroup.controls.steps.insert(index, stepFormGroup);
  }

  private getStepSchema(step: Step): StepDetails {
    return STEP_OPTIONS.find(({type}) => type === step['type']) || EMPTY_STEP;
  }

  private getStepFormGroup(step: Step, schema: StepDetails): FormGroup {
    const stepControls = this.getStepControls(step, schema);
    return new FormGroup(stepControls, { validators: [Validators.required] })
  }

  private getStepControls(step: Step, schema: StepDetails): Record<PropertyName, FormControl | FormArray> {
    const stepProperties = this.getStepProperties(step, schema);
    return stepProperties.reduce((controls, {name, inputType, value}) => {
      return {...controls, [name]: this.getPropertyControl(inputType, value)}
    }, {}) as Record<PropertyName, FormControl | FormArray>;
  }

  // TODO Convert to readonly Map
  private getPropertyControl(inputType: InputType, value: InputValue): FormControl | FormArray {
    const BASE_FORM_CONTROL_OPTIONS = { validators: [Validators.required], nonNullable: true }
    switch (inputType) {
      case 'string':
      case 'number':
      case 'boolean':
        return new FormControl(value, BASE_FORM_CONTROL_OPTIONS);
      case 'options':
        return new FormControl(value, BASE_FORM_CONTROL_OPTIONS);
      case 'stringArray':
        return new FormArray((value as string[]).map((i) => new FormControl<string>(i, BASE_FORM_CONTROL_OPTIONS)));
      case 'records': // TODO Still need to define how we handle key value pairs.
        return new FormControl<string>(value as string, BASE_FORM_CONTROL_OPTIONS);
    }
  }

  private getStepProperties(step: Step, schema: StepDetails): Array<Pick<StepProperty, 'name' | 'inputType'> & Record<'value', InputValue>>{
    const requiredOrPresent = (step: Step) => ({ required, name }: Pick<StepProperty, 'name' | 'required'>) => required || step[name] !== undefined;
    return schema.properties.filter(requiredOrPresent(step)).map(({inputType, name, defaultValue}) => ({
       name, value: this.getPropertyValue(inputType, step[name], defaultValue), inputType
    }));
  }

  private getPropertyValue(inputType: InputType, property?: InputValue, defaultValue?: InputValue): InputValue {
    const isValid = this.inputTypeValidatorMap[inputType]
    return isValid(property) ? property! : isValid(defaultValue) ? defaultValue! : this.propertyDefaultFallback[inputType]!;
  }

  getPropertySchema(name: PropertyName) {
    return Object.values(STEP_PROPERTY).find((schema) => schema.name === name)!;
  }

  private readonly propertyDefaultFallback: Record<InputType, InputValue> = {
    string: '',
    number: 0,
    boolean: false,
    options: '',
    stringArray: [''],
    records: '' // TODO
  }

  private readonly inputTypeValidatorMap: Record<InputType, (value?: InputValue | undefined) => boolean> = {
    string: value => typeof value === 'string',
    number: value => typeof value === 'number',
    boolean: value => typeof value === 'boolean',
    stringArray: value => Array.isArray(value) && value.every(item => typeof item === 'string'),
    options: value => typeof value === 'string', // TODO Should validate its in options array
    records: value => typeof value === 'string', // TODO
  }
}
