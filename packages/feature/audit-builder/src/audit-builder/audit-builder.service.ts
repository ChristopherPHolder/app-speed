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
  StepType,
} from '../schema/types';
import { EMPTY_STEP, STEP_OPTIONS } from '../schema/step.schema';
import { STEP_TYPE } from '../schema/step.constants';
import {
  INPUT_TYPE_VALIDATOR,
  PROPERTY_CONTROL_BUILDER,
  PROPERTY_DEFAULT,
  PROPERTY_NAME,
} from '../schema/property.constants';

type StepFormGroup = FormGroup<Partial<Record<PropertyName, FormControl | FormArray>>>;

@Injectable({ providedIn: 'root' })
export class AuditBuilderService {
  public readonly formGroup = new FormGroup({
    title: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
    device: new FormControl<DeviceType>('mobile', { validators: [Validators.required], nonNullable: true }),
    timeout: new FormControl<number>(30000, { validators: [Validators.required], nonNullable: true }),
    steps: new FormArray<StepFormGroup>([]),
  });
  steps = this.formGroup.controls.steps;

  auditInit$(initialAuditDetails$: Observable<AuditDetails>): Observable<boolean> {
    return initialAuditDetails$.pipe(
      tap((details) => {
        this.formGroup.controls.title.setValue(details.title);
        this.formGroup.controls.device.setValue(details.device);
        this.formGroup.controls.timeout.setValue(details.timeout);
        details.steps.forEach((step, index) => this.initStep(step, index));
      }),
      map(() => true),
      first(),
    );
  }

  private initStep(step: Step, index: number): void {
    const stepSchema: StepDetails = this.getStepSchema(step['type']);
    if (!stepSchema) return;
    const stepFormGroup = this.getStepFormGroup(step, stepSchema);
    return this.formGroup.controls.steps.insert(index, stepFormGroup);
  }

  private getStepSchema(stepType: StepType): StepDetails {
    return STEP_OPTIONS.find(({ type }) => type === stepType) || EMPTY_STEP;
  }

  private getStepFormGroup(step: Step, schema: StepDetails): FormGroup {
    const stepControls = this.getStepControls(step, schema);
    return new FormGroup(stepControls, { validators: [Validators.required] });
  }

  private getStepControls(step: Step, schema: StepDetails): Record<PropertyName, FormControl | FormArray> {
    const stepProperties = this.getStepProperties(step, schema);
    return stepProperties.reduce((controls, { name, inputType, value }) => {
      return { ...controls, [name]: PROPERTY_CONTROL_BUILDER[inputType](value as never) }; // TODO fix typing error!
    }, {}) as Record<PropertyName, FormControl | FormArray>;
  }

  private getStepProperties(
    step: Step,
    schema: StepDetails,
  ): Array<Pick<StepProperty, 'name' | 'inputType'> & Record<'value', InputValue>> {
    const requiredOrPresent =
      (step: Step) =>
      ({ required, name }: Pick<StepProperty, 'name' | 'required'>) =>
        required || step[name] !== undefined;
    return schema.properties.filter(requiredOrPresent(step)).map(({ inputType, name, defaultValue }) => ({
      name,
      value: this.getPropertyValue(inputType, step[name], defaultValue),
      inputType,
    }));
  }

  private getPropertyValue(inputType: InputType, property?: InputValue, defaultValue?: InputValue): InputValue {
    const isValid = INPUT_TYPE_VALIDATOR[inputType];
    if (isValid(property)) {
      return property;
    }
    if (isValid(defaultValue)) {
      return defaultValue;
    }
    return PROPERTY_DEFAULT[inputType];
  }

  private typedKeys<T extends object>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
  }

  changeStepType(index: number, type: StepType) {
    const stepSchema = this.getStepSchema(type);
    const schemaPropertyNames = stepSchema.properties.map((property) => property.name);
    const stepPropertyNames = this.getStepPropertyKeys(index);
    const invalidPropertyNames = stepPropertyNames.filter(
      (propertyName) => !schemaPropertyNames.includes(propertyName),
    );
    const missingProperties = stepSchema.properties.filter(
      (property) => property.required && !stepPropertyNames.includes(property.name),
    );
    invalidPropertyNames.forEach((name) => this.formGroup.controls.steps.at(index).removeControl(name));
    missingProperties.forEach((propertySchema) => {
      const value = this.getPropertyValue(propertySchema.inputType, propertySchema.defaultValue);
      const control = PROPERTY_CONTROL_BUILDER[propertySchema.inputType](value as never);
      this.formGroup.controls.steps.at(index).addControl(propertySchema.name, control);
    });
  }

  getStepOptionalProperties(index: number): PropertyName[] {
    const stepControl = this.formGroup.controls.steps.at(index);
    const stepProps = this.typedKeys(stepControl.controls);
    return this.getStepSchema(stepControl.controls.type!.value)
      .properties.filter(({ name }) => !stepProps.includes(name))
      .map(({ name }) => name);
  }

  getStepPropertyKeys(index: number): PropertyName[] {
    return this.typedKeys(this.formGroup.controls.steps.at(index).controls);
  }

  getStepPropertySchema(index: number, name: PropertyName): StepProperty {
    const stepType = this.formGroup.controls.steps.at(index).controls.type!.value!;
    return this.getStepSchema(stepType).properties.find((schema) => schema.name === name)!;
  }

  removeStep(index: number): void {
    this.formGroup.controls.steps.removeAt(index);
  }

  addStep(index: number): void {
    const emptyStep = { [PROPERTY_NAME.TYPE]: STEP_TYPE.EMPTY } as never;
    this.formGroup.controls.steps.insert(index, this.getStepFormGroup(emptyStep, EMPTY_STEP));
  }

  addStepProperty(index: number, propertyName: PropertyName): void {
    const propertySchema = this.getStepPropertySchema(index, propertyName);
    const value = this.getPropertyValue(propertySchema.inputType, propertySchema.defaultValue);
    const control = PROPERTY_CONTROL_BUILDER[propertySchema.inputType](value as never);
    this.formGroup.controls.steps.at(index).addControl(propertySchema.name, control);
  }

  removeStepProperty(index: number, propertyName: PropertyName): void {
    this.formGroup.controls.steps.at(index).removeControl(propertyName);
  }
}
