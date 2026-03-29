import { signal } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AuditDetails,
  DEVICE_OPTIONS,
  DeviceType,
  PropertyName,
  STEP_OPTIONS,
  StepDetails,
  StepProperty,
} from '@app-speed/audit/model';
import { AuditStep } from '@app-speed/audit/contracts';

import { stepPropertyFactoryMap } from './step-property';

export type StepField<TControl extends AbstractControl = AbstractControl> = {
  name: PropertyName;
  property: StepProperty;
  control: TControl;
  removable: boolean;
};

export class AuditFormGroup extends FormGroup<{
  title: FormControl<string>;
  device: FormControl<DeviceType>;
  timeout: FormControl<number>;
  steps: FormArray<StepFormGroup>;
}> {
  constructor(audit: AuditDetails) {
    super({
      title: new FormControl<string>(audit.title, {
        validators: [Validators.required],
        nonNullable: true,
      }),
      device: new FormControl<DeviceType>(DEVICE_OPTIONS[0], {
        validators: [Validators.required],
        nonNullable: true,
      }),
      timeout: new FormControl<number>(30000, {
        validators: [Validators.required],
        nonNullable: true,
      }),
      steps: new FormArray<StepFormGroup>(
        audit.steps.map((step) => new StepFormGroup(step)),
        { validators: [Validators.required] },
      ),
    });
  }

  addStepAt(index: number) {
    // @ts-expect-error expected as we add an invalid step type to allow user to choose
    this.controls.steps.insert(index, new StepFormGroup({ type: '' }));
  }
  removeStepAt(index: number) {
    this.controls.steps.removeAt(index);
  }
}

export class StepFormGroup extends FormGroup {
  readonly fields = signal<PropertyName[]>(['type']);
  readonly optionalFields = signal<PropertyName[]>([]);

  stepSchema!: StepDetails;

  stepProperty(propertyName: PropertyName) {
    const stepProperty = this.stepSchema.properties.find((prop) => prop.name === propertyName);
    if (!stepProperty) {
      throw new Error('Invalid property name');
    }
    return stepProperty;
  }

  field<TControl extends AbstractControl = AbstractControl>(propertyName: PropertyName): StepField<TControl> {
    const control = this.get(propertyName);

    if (!control) {
      throw new Error(`Missing control for property "${propertyName}"`);
    }

    const property = this.stepProperty(propertyName);

    return {
      name: propertyName,
      property,
      control: control as TControl,
      removable: !property.required,
    };
  }

  formControlField(propertyName: PropertyName): StepField<FormControl> {
    return this.field<FormControl>(propertyName);
  }

  stringArrayField(propertyName: PropertyName): StepField<FormArray<FormControl<string>>> {
    return this.field<FormArray<FormControl<string>>>(propertyName);
  }

  constructor(step: AuditStep) {
    const typeControl = stepPropertyFactoryMap.type(step);
    super({ type: typeControl });
    this.setupControls(step.type, step);
  }

  addOptionalField(field: PropertyName): void {
    this.addControl(field, stepPropertyFactoryMap[field]());
    this.fields.update((x) => x.concat(field));
    this.optionalFields.update((optionalFields) => optionalFields.filter((optionalField) => field !== optionalField));
    // handle adding field control
  }

  removeOptionalField(field: PropertyName): void {
    this.optionalFields.update((optionalFields) => optionalFields.concat(field));
    this.fields.update((activeFields) => activeFields.filter((activeField) => activeField !== field));
    this.removeControl(field);
  }

  private setupControls(stepType: string, step?: AuditStep): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const stepSchema = STEP_OPTIONS.find(({ type }) => type === stepType)!;
    this.stepSchema = stepSchema;

    const stepProperties = stepSchema.properties
      .filter((prop) => prop.name !== 'type')
      .filter((prop) => prop.required || (step && prop.name in step));
    stepProperties.forEach((stepProperty) =>
      this.addControl(stepProperty.name, stepPropertyFactoryMap[stepProperty.name](step)),
    );

    const stepActiveFields: PropertyName[] = ['type', ...stepProperties.map(({ name }) => name)];
    this.fields.set(stepActiveFields);
    this.optionalFields.set(
      stepSchema.properties.filter(({ name }) => !stepActiveFields.includes(name)).map(({ name }) => name),
    );
  }

  resetStepControls(stepType: string): void {
    Object.keys(this.controls)
      .filter((key) => key !== 'type')
      .forEach((key) => {
        this.removeControl(key);
      });
    this.setupControls(stepType);
  }
}
