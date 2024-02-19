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
import { EMPTY_STEP, STEP_OPTIONS } from '../schema/audit-step.schema';
import { STEP_TYPE } from '../schema/step-type.constants';
import { INPUT_TYPE, PROPERTY_NAME } from '../schema/step-property.constants';

type StepFormGroup = FormGroup<Partial<Record<PropertyName, FormControl | FormArray>>>;

type FallbackValue<T extends InputType> =
  T extends typeof INPUT_TYPE.STRING ? string :
  T extends typeof INPUT_TYPE.NUMBER ? number :
  T extends typeof INPUT_TYPE.BOOLEAN ? boolean :
  T extends typeof INPUT_TYPE.OPTIONS ? string :
  T extends typeof INPUT_TYPE.STRING_ARRAY ? string[] :
  T extends typeof INPUT_TYPE.RECORDS ? string : // TODO fix with proper type
  unknown;

type PropertyFallbackValueMap = { [K in InputType]: FallbackValue<K> };

interface ControlBuilderFunctionMap {
  [INPUT_TYPE.STRING]: (value: string) => FormControl<string>;
  [INPUT_TYPE.NUMBER]: (value: number) => FormControl<number>;
  [INPUT_TYPE.BOOLEAN]: (value: boolean) => FormControl<boolean>;
  [INPUT_TYPE.OPTIONS]: (value: string) => FormControl<string>;
  [INPUT_TYPE.STRING_ARRAY]: (value: string[]) => FormArray<FormControl<string>>;
  [INPUT_TYPE.RECORDS]: (value: string) => FormControl<string>; // Adjust for 'records'
}

type ControlBuilderFunction<T extends InputType> = ControlBuilderFunctionMap[T];

type PropertyControlBuilderMap = { [K in InputType]: ControlBuilderFunction<K> }

type InputValidatorFunction = (value: InputValue | undefined) => boolean;

type PropertyInputValidatorFunctionMap = { [K in InputType]: InputValidatorFunction };

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
    const stepSchema: StepDetails = this.getStepSchema(step['type']);
    if (!stepSchema) return;
    const stepFormGroup = this.getStepFormGroup(step, stepSchema);
    return this.formGroup.controls.steps.insert(index, stepFormGroup);
  }

  private getStepSchema(stepType: StepType): StepDetails {
    return STEP_OPTIONS.find(({type}) => type === stepType) || EMPTY_STEP;
  }

  private getStepFormGroup(step: Step, schema: StepDetails): FormGroup {
    const stepControls = this.getStepControls(step, schema);
    return new FormGroup(stepControls, { validators: [Validators.required] })
  }

  private getStepControls(step: Step, schema: StepDetails): Record<PropertyName, FormControl | FormArray> {
    const stepProperties = this.getStepProperties(step, schema);
    return stepProperties.reduce((controls, {name, inputType, value }) => {
      return {...controls, [name]: this.propertyControlBuilderMap[inputType](value as never)} // TODO fix typing error!
    }, {}) as Record<PropertyName, FormControl | FormArray>;
  }

  private getStepProperties(step: Step, schema: StepDetails): Array<Pick<StepProperty, 'name' | 'inputType'> & Record<'value', InputValue>>{
    const requiredOrPresent = (step: Step) => ({ required, name }: Pick<StepProperty, 'name' | 'required'>) => required || step[name] !== undefined;
    return schema.properties.filter(requiredOrPresent(step)).map(({inputType, name, defaultValue}) => ({
       name, value: this.getPropertyValue(inputType, step[name], defaultValue), inputType
    }));
  }

  private getPropertyValue(inputType: InputType, property?: InputValue, defaultValue?: InputValue): InputValue {
    const isValid = this.inputTypeValidatorMap[inputType];
    return isValid(property) ? property! : isValid(defaultValue) ? defaultValue! : this.propertyFallbackValueMap[inputType]!;
  }

  private typedKeys<T extends object>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
  }

  changeStepType(index: number, type: StepType) {
    const stepSchema = this.getStepSchema(type);
    const schemaPropertyNames = stepSchema.properties.map((property) => property.name);
    const stepPropertyNames = this.getStepPropertyKeys(index);
    const invalidPropertyNames = stepPropertyNames.filter((propertyName) => !schemaPropertyNames.includes(propertyName));
    const missingProperties = stepSchema.properties.filter((property) => property.required && !stepPropertyNames.includes(property.name));
    invalidPropertyNames.forEach((name) => this.formGroup.controls.steps.at(index).removeControl(name));
    missingProperties.forEach((propertySchema) => {
      const value = this.getPropertyValue(propertySchema.inputType, propertySchema.defaultValue);
      const control = this.propertyControlBuilderMap[propertySchema.inputType](value as never);
      this.formGroup.controls.steps.at(index).addControl(propertySchema.name, control);
    })
  }

  getStepOptionalProperties(index: number): PropertyName[] {
    const stepControl = this.formGroup.controls.steps.at(index);
    const stepProps = this.typedKeys(stepControl.controls);
    return  this.getStepSchema(stepControl.controls.type!.value).properties.filter(({name}) => !stepProps.includes(name)).map(({name}) => name);
  }

  getStepPropertyKeys(index: number): PropertyName[] {
    return this.typedKeys(this.formGroup.controls.steps.at(index).controls);
  }

  getStepPropertySchema(index: number, name: PropertyName): StepProperty {
    const stepType = this.formGroup.controls.steps.at(index).controls.type!.value!
    const stepPropertiesSchema = this.getStepSchema(stepType).properties
    return stepPropertiesSchema.find((schema) => schema.name === name)!;
  }

  removeStep(index: number): void {
    this.formGroup.controls.steps.removeAt(index);
  }

  addStep(index: number): void {
    const emptyStep = { [PROPERTY_NAME.TYPE]: STEP_TYPE.EMPTY } as never;
    this.formGroup.controls.steps.insert(index, this.getStepFormGroup(emptyStep, EMPTY_STEP))
  }

  addStepProperty(index: number, propertyName: PropertyName): void {
    const propertySchema = this.getStepPropertySchema(index, propertyName);
    const value = this.getPropertyValue(propertySchema.inputType, propertySchema.defaultValue);
    const control = this.propertyControlBuilderMap[propertySchema.inputType](value as never);
    this.formGroup.controls.steps.at(index).addControl(propertySchema.name, control);
  }

  removeStepProperty(index: number, propertyName: PropertyName): void {
    this.formGroup.controls.steps.at(index).removeControl(propertyName);
  }

  private readonly propertyControlBuilderMap: PropertyControlBuilderMap = {
    [INPUT_TYPE.STRING]: value => new FormControl<string>(value, { validators: [Validators.required], nonNullable: true }),
    [INPUT_TYPE.NUMBER]: value => new FormControl<number>(value, { validators: [Validators.required], nonNullable: true }),
    [INPUT_TYPE.BOOLEAN]: value => new FormControl<boolean>(value, { validators: [Validators.required], nonNullable: true }),
    [INPUT_TYPE.OPTIONS]: value => new FormControl<string>(value, { validators: [Validators.required], nonNullable: true }),
    [INPUT_TYPE.STRING_ARRAY]: value => new FormArray((value).map((i) => new FormControl<string>(i, { validators: [Validators.required], nonNullable: true }))),
    [INPUT_TYPE.RECORDS]: value => new FormControl<string>(value, { validators: [Validators.required], nonNullable: true }),
  }

  private readonly propertyFallbackValueMap: PropertyFallbackValueMap = {
    [INPUT_TYPE.STRING]: '',
    [INPUT_TYPE.NUMBER]: 0,
    [INPUT_TYPE.BOOLEAN]: false,
    [INPUT_TYPE.OPTIONS]: '',
    [INPUT_TYPE.STRING_ARRAY]: [''],
    [INPUT_TYPE.RECORDS]: '' // TODO
  };

  private readonly inputTypeValidatorMap: PropertyInputValidatorFunctionMap = {
    [INPUT_TYPE.STRING]: value => typeof value === 'string',
    [INPUT_TYPE.NUMBER]: value => typeof value === 'number',
    [INPUT_TYPE.BOOLEAN]: value => typeof value === 'boolean',
    [INPUT_TYPE.OPTIONS]: value => typeof value === 'string', // TODO
    [INPUT_TYPE.STRING_ARRAY]: value => Array.isArray(value) && value.every(item => typeof item === 'string'),
    [INPUT_TYPE.RECORDS]: value => typeof value === 'string', // TODO
  }
}
