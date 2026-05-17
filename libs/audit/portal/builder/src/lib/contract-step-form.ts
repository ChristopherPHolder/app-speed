import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  FormRecord,
  type ValidationErrors,
  type ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  AUDIT_BUILDER_STEP_VARIANTS,
  deriveBuilderStepContract,
  type BuilderFieldContract,
  type BuilderFieldValidationContract,
  type BuilderStepContract,
} from '@app-speed/audit/domain';

export class BuilderStepFormGroup extends FormGroup {
  private _contract: BuilderStepContract | null;

  constructor(contract?: BuilderStepContract, value?: Record<string, unknown>) {
    super(contract ? createRootControls(contract, value ?? contract.defaultValue) : {});
    this._contract = contract ?? null;
  }

  get contract(): BuilderStepContract {
    if (!this._contract) {
      throw new Error('Missing step contract');
    }

    return this._contract;
  }

  get hasContract(): boolean {
    return this._contract !== null;
  }

  optionalFields(fields: readonly BuilderFieldContract[], control: FormGroup): BuilderFieldContract[] {
    return fields.filter((field) => !field.required && !hasControl(control, fieldControlName(field)));
  }

  visibleFields(fields: readonly BuilderFieldContract[], control: FormGroup): BuilderFieldContract[] {
    return fields.filter((field) => field.required || hasControl(control, fieldControlName(field)));
  }

  addOptionalField(control: FormGroup, field: BuilderFieldContract): void {
    control.addControl(fieldControlName(field), createControlForField(field));
    control.updateValueAndValidity();
  }

  removeOptionalField(control: FormGroup, field: BuilderFieldContract): void {
    control.removeControl(fieldControlName(field));
    control.updateValueAndValidity();
  }

  addArrayItem(
    control: FormArray<AbstractControl>,
    field: Extract<BuilderFieldContract, { kind: 'array' }>,
    value?: unknown,
  ): void {
    control.push(createControlForField(field.element, value));
    control.updateValueAndValidity();
  }

  removeArrayItem(control: FormArray<AbstractControl>, index: number): void {
    control.removeAt(index);
    control.updateValueAndValidity();
  }

  addRecordEntry(
    control: FormRecord<AbstractControl>,
    field: Extract<BuilderFieldContract, { kind: 'record' }>,
    key: string,
    value?: unknown,
  ): boolean {
    const normalizedKey = key.trim();

    if (normalizedKey.length === 0 || hasControl(control, normalizedKey)) {
      return false;
    }

    control.addControl(normalizedKey, createControlForField(field.value, value));
    control.updateValueAndValidity();

    return true;
  }

  removeRecordEntry(control: FormRecord<AbstractControl>, key: string): void {
    control.removeControl(key);
    control.updateValueAndValidity();
  }

  protected resetContract(contract?: BuilderStepContract, value?: Record<string, unknown>): void {
    Object.keys(this.controls).forEach((key) => {
      this.removeControl(key);
    });

    this._contract = contract ?? null;

    if (!contract) {
      return;
    }

    const controls = createRootControls(contract, value ?? contract.defaultValue);

    Object.entries(controls).forEach(([key, control]) => {
      this.addControl(key, control);
    });
  }
}

export const findContract = (variantId: string): BuilderStepContract => {
  const variant = AUDIT_BUILDER_STEP_VARIANTS.find((candidate) => candidate.id === variantId);

  if (!variant) {
    throw new Error(`Unsupported builder variant "${variantId}"`);
  }

  return deriveBuilderStepContract(variant);
};

const createRootControls = (
  contract: BuilderStepContract,
  value: Record<string, unknown>,
): Record<string, AbstractControl> => ({
  ...Object.fromEntries(
    Object.entries(contract.discriminators).map(([key, discriminator]) => [
      key,
      new FormControl(discriminator, {
        nonNullable: true,
        validators: [requiredScalarValueValidator],
      }),
    ]),
  ),
  ...Object.fromEntries(
    contract.fields
      .filter((field) => field.required || hasObjectKey(value, fieldControlName(field)))
      .map((field) => [fieldControlName(field), createControlForField(field, value[fieldControlName(field)])]),
  ),
});

export const createControlForField = (field: BuilderFieldContract, value?: unknown): AbstractControl => {
  switch (field.kind) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'enum':
    case 'literal':
      return createScalarControl(field, value);
    case 'group':
      return createGroupControl(field, value);
    case 'array':
      return createArrayControl(field, value);
    case 'record':
      return createRecordControl(field, value);
  }
};

const createScalarControl = (
  field: Extract<BuilderFieldContract, { kind: 'string' | 'number' | 'boolean' | 'enum' | 'literal' }>,
  value?: unknown,
): FormControl => {
  const validators = buildScalarValidators(field.required, field.validation);

  return new FormControl(resolveScalarValue(field, value), {
    validators,
    nonNullable: false,
  });
};

const createGroupControl = (
  field: Extract<BuilderFieldContract, { kind: 'group' }>,
  value?: unknown,
): FormGroup<Record<string, AbstractControl>> =>
  new FormGroup<Record<string, AbstractControl>>(
    Object.fromEntries(
      field.fields
        .filter((childField) => childField.required || hasObjectKey(value, fieldControlName(childField)))
        .map((childField) => [
          fieldControlName(childField),
          createControlForField(childField, asRecord(value)?.[fieldControlName(childField)]),
        ]),
    ),
  );

const createArrayControl = (
  field: Extract<BuilderFieldContract, { kind: 'array' }>,
  value?: unknown,
): FormArray<AbstractControl> =>
  new FormArray<AbstractControl>(
    asArray(value).map((item) => createControlForField(field.element, item)),
    {
      validators: buildArrayValidators(field.validation),
    },
  );

const createRecordControl = (
  field: Extract<BuilderFieldContract, { kind: 'record' }>,
  value?: unknown,
): FormRecord<AbstractControl> =>
  new FormRecord<AbstractControl>(
    Object.fromEntries(
      Object.entries(asRecord(value) ?? {}).map(([key, itemValue]) => [key, createControlForField(field.value, itemValue)]),
    ),
  );

const resolveScalarValue = (
  field: Extract<BuilderFieldContract, { kind: 'string' | 'number' | 'boolean' | 'enum' | 'literal' }>,
  value: unknown,
): unknown => {
  if (value !== undefined) {
    return value;
  }

  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  switch (field.kind) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'literal':
      return field.value;
    case 'enum':
      return '';
  }
};

const buildScalarValidators = (
  required: boolean,
  validation: BuilderFieldValidationContract | undefined,
): ValidatorFn[] => {
  const validators: ValidatorFn[] = [];

  if (required) {
    validators.push(requiredScalarValueValidator);
  }

  if (typeof validation?.minLength === 'number') {
    validators.push(Validators.minLength(validation.minLength));
  }

  if (typeof validation?.minimum === 'number') {
    validators.push(Validators.min(validation.minimum));
  }

  if (typeof validation?.pattern === 'string') {
    validators.push(Validators.pattern(validation.pattern));
  }

  if (validation?.integer) {
    validators.push(integerValidator);
  }

  return validators;
};

const buildArrayValidators = (validation: BuilderFieldValidationContract | undefined): ValidatorFn[] => {
  if (typeof validation?.minItems !== 'number') {
    return [];
  }

  return [collectionMinLengthValidator(validation.minItems)];
};

const requiredScalarValueValidator: ValidatorFn = (control): ValidationErrors | null => {
  const value = control.value;

  return value === null || value === undefined || value === '' ? { required: true } : null;
};

const integerValidator: ValidatorFn = (control): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return Number.isInteger(value) ? null : { integer: true };
};

const collectionMinLengthValidator = (minItems: number): ValidatorFn => (control): ValidationErrors | null => {
  const value = control.value;
  const length = Array.isArray(value) ? value.length : 0;

  return length >= minItems
    ? null
    : {
        minlength: {
          actualLength: length,
          requiredLength: minItems,
        },
      };
};

export const contractFieldControlName = (field: BuilderFieldContract): string => {
  const pathSegments = field.path.split('.');
  const terminalSegment = pathSegments[pathSegments.length - 1] ?? field.path;

  return terminalSegment.replace(/\[\]|\.\*/g, '').replace('*', '');
};

const fieldControlName = contractFieldControlName;

const hasObjectKey = (value: unknown, key: string): boolean => Object.prototype.hasOwnProperty.call(asRecord(value) ?? {}, key);

const hasControl = (control: FormGroup | FormRecord<AbstractControl>, key: string): boolean => key in control.controls;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
