import { signal } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuditStep, DeviceType, STEP_TYPE } from '@app-speed/audit/domain';
import { AuditDetails } from '../audit-details';
import { InputType } from '../input-type';
import { PropertyName } from '../property-name';
import { EMPTY_STEP, findStepDetails, Step, StepDetails, StepSelection, stepSelectionFromStep } from '../step-details';
import { StepProperty } from '../step-property.model';

import { stepPropertyFactoryMap } from './step-property';

export type StepField<TControl extends AbstractControl = AbstractControl, TInputType extends InputType = InputType> = {
  name: PropertyName;
  property: StepProperty<TInputType>;
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
      device: new FormControl<DeviceType>(audit.device, {
        validators: [Validators.required],
        nonNullable: true,
      }),
      timeout: new FormControl<number>(audit.timeout ?? 30000, {
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
    this.controls.steps.insert(index, new StepFormGroup({ type: '' }));
  }
  removeStepAt(index: number) {
    this.controls.steps.removeAt(index);
  }
}
export class StepFormGroup extends FormGroup {
  readonly fields = signal<PropertyName[]>([]);
  readonly optionalFields = signal<PropertyName[]>([]);
  readonly selectionControl = new FormControl<StepSelection | ''>('', {
    validators: [Validators.required],
    nonNullable: true,
  });
  stepSchema: StepDetails = EMPTY_STEP;

  stepProperty<TInputType extends InputType = InputType>(propertyName: PropertyName): StepProperty<TInputType> {
    const stepProperty = this.stepSchema.properties.find((prop) => prop.name === propertyName);
    if (!stepProperty) {
      throw new Error('Invalid property name');
    }
    // TODO improve inference
    return stepProperty as StepProperty<TInputType>;
  }

  field<TControl extends AbstractControl = AbstractControl, TInputType extends InputType = InputType>(
    propertyName: PropertyName,
  ): StepField<TControl, TInputType> {
    const control = this.get(propertyName);

    if (!control) {
      throw new Error(`Missing control for property "${propertyName}"`);
    }

    const property = this.stepProperty<TInputType>(propertyName);

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

  inputField<TInputType extends 'string' | 'number'>(
    propertyName: PropertyName,
  ): StepField<FormControl<string | number>, TInputType> {
    const field = this.field<FormControl<string | number>, TInputType>(propertyName);

    if (field.property.inputType !== 'string' && field.property.inputType !== 'number') {
      throw new Error(`Expected input field, got ${field.property.inputType}`);
    }

    return field;
  }

  constructor(step: Step | AuditStep) {
    super({});
    this.selectionControl.setValue(stepSelectionFromStep(step));
    this.setupControls(this.selectionControl.value, step);
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

  private setupControls(stepSelection: StepSelection | '', step?: Step | AuditStep): void {
    const stepSchema = findStepDetails(stepSelection);
    this.stepSchema = stepSchema;
    this.addControl('type', stepPropertyFactoryMap.type(stepSchema.step));

    if (stepSchema.step.type === STEP_TYPE.CUSTOM_STEP) {
      this.addControl(
        'step',
        new FormControl(stepSchema.step.step, {
          validators: [Validators.required],
          nonNullable: true,
        }),
      );
    }

    const stepProperties = stepSchema.properties
      .filter((prop) => prop.required || (step && prop.name in step));
    stepProperties.forEach((stepProperty) =>
      this.addControl(stepProperty.name, stepPropertyFactoryMap[stepProperty.name](step)),
    );

    const stepActiveFields = stepProperties.map(({ name }) => name);
    this.fields.set(stepActiveFields);
    this.optionalFields.set(
      stepSchema.properties.filter(({ name }) => !stepActiveFields.includes(name)).map(({ name }) => name),
    );
  }

  resetStepControls(stepSelection: StepSelection | ''): void {
    if (this.selectionControl.value !== stepSelection) {
      this.selectionControl.setValue(stepSelection, { emitEvent: false });
    }

    Object.keys(this.controls).forEach((key) => {
      this.removeControl(key);
    });

    this.setupControls(stepSelection);
  }
}
