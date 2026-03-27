import { signal } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, FormRecord, Validators } from '@angular/forms';
import {
  AuditDetails,
  DEVICE_OPTIONS,
  DeviceType,
  PropertyName,
  STEP_OPTIONS,
  STEP_PROPERTY,
  StepDetails,
  StepProperty,
} from '@app-speed/audit/model';
import { AuditStep } from '@app-speed/audit/contracts';

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
    const typeControl = stepPropertyFactories.type(step);
    super({ type: typeControl });
    this.setupControls(step.type, step);
  }

  addOptionalField(field: PropertyName): void {
    this.addControl(field, stepPropertyFactories[field]());
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
      this.addControl(stepProperty.name, stepPropertyFactories[stepProperty.name](step)),
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
const stringFormControlFactory = (defaultValue: string) =>
  new FormControl(defaultValue, {
    validators: [Validators.required, Validators.minLength(1)],
    nonNullable: true,
  });

const numberFormControlFactory = (defaultValue: number) =>
  new FormControl<number>(defaultValue, {
    validators: [Validators.required, Validators.max(60_000), Validators.min(1)],
    nonNullable: true,
  });

const booleanFormControlFactory = (defaultValue: boolean) =>
  new FormControl<boolean>(defaultValue, {
    validators: [Validators.required],
    nonNullable: true,
  });

const stepPropertyFactories = {
  type: (step?: { type?: string }) => stringFormControlFactory(step?.type ?? ''),
  timeout: (step?: { timeout?: number }) =>
    numberFormControlFactory(step?.timeout ?? STEP_PROPERTY.timeout.defaultValue),
  value: (step?: { value?: string }) => stringFormControlFactory(step?.value ?? ''),
  selectors: (step?: { selectors?: string[] }) =>
    new FormArray<FormControl<string>>(
      (step?.selectors ?? ['']).map((selector) => stringFormControlFactory(selector)),
      { validators: [Validators.required, Validators.minLength(1)] },
    ),
  attributes: (..._args: any) => {
    console.warn('Warning Attribute step property is not yet implemented');
    return new FormRecord({}); // TODO
  },
  count: (step?: { count?: number }) => numberFormControlFactory(step?.count ?? 1),
  visible: (step?: { visible?: boolean }) => booleanFormControlFactory(step?.visible ?? true),
  operator: (step?: { operator?: string }) =>
    stringFormControlFactory(step?.operator ?? STEP_PROPERTY.operator.defaultValue),
  assertedEvents: (..._args: any) => {
    console.warn('Warning assertedEvents step property is not yet implemented');
    return new FormArray([]); // TODO
  },
  frame: (step?: { frame?: number[] }) =>
    new FormArray<FormControl<number>>(
      (step?.frame?.length ? step.frame : [0]).map((f) => numberFormControlFactory(f)),
      { validators: [Validators.required, Validators.min(1)] },
    ),
  expression: (step?: { expression?: string }) => stringFormControlFactory(step?.expression ?? ''),
  target: (step?: { target?: string }) => stringFormControlFactory(step?.target ?? ''),
  properties: (_step?: { property?: any }) => {
    console.warn('Warning properties step property is not yet implemented');
    return new FormArray([]); // TODO
  },
  button: (step?: { button?: string }) => stringFormControlFactory(step?.button ?? 'primary'),
  deviceType: (step?: { deviceType?: string }) => stringFormControlFactory(step?.deviceType ?? 'mouse'),
  duration: (step?: { duration?: number }) => numberFormControlFactory(step?.duration ?? 1),
  offsetX: (step?: { offsetX?: number }) => numberFormControlFactory(step?.offsetX ?? 1),
  offsetY: (step?: { offsetY?: number }) => numberFormControlFactory(step?.offsetY ?? 1),
  download: (step?: { download?: number }) => numberFormControlFactory(step?.download ?? 1),
  latency: (step?: { latency: number }) => numberFormControlFactory(step?.latency ?? 1),
  upload: (step?: { upload?: number }) => numberFormControlFactory(step?.upload ?? 1),
  key: (step?: { key?: string }) => stringFormControlFactory(step?.key ?? ''),
  url: (step?: { url?: string }) =>
    new FormControl<string>(step?.url ?? '', {
      // validators: [
      //   Validators.required,
      //   Validators.pattern(
      //     /^https:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&/=]*$/,
      //   ),
      // ],
      nonNullable: true,
    }),
  x: (step?: { x: number }) => numberFormControlFactory(step?.x ?? 1),
  y: (step?: { y: number }) => numberFormControlFactory(step?.y ?? 1),
  deviceScaleFactor: (step?: { deviceScaleFactor: number }) => numberFormControlFactory(step?.deviceScaleFactor ?? 1),
  hasTouch: (step?: { hasTouch?: boolean }) => booleanFormControlFactory(step?.hasTouch ?? false),
  height: (step?: { height: number }) => numberFormControlFactory(step?.height ?? 1),
  isLandscape: (step?: { isLandscape: boolean }) => booleanFormControlFactory(step?.isLandscape ?? false),
  isMobile: (step?: { isMobile: boolean }) => booleanFormControlFactory(step?.isMobile ?? false),
  width: (step?: { width: number }) => numberFormControlFactory(step?.width ?? 1),
  name: (step?: { name: string }) => stringFormControlFactory(step?.name ?? ''),
} as const satisfies Record<PropertyName, () => AbstractControl>;
