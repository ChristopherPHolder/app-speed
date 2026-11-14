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
  type BuilderFieldSpec,
  type BuilderFieldValidationSpec,
  type BuilderStepSpec,
} from '@app-speed/audit/core/domain';
import { USER_FLOW_AUDIT_BUILDER_STEP_VARIANTS, deriveBuilderStepSpec } from '@app-speed/audit/user-flow/domain';

type BuilderScalarFieldSpec = Extract<BuilderFieldSpec, { kind: 'string' | 'number' | 'boolean' | 'enum' | 'literal' }>;

export class BuilderStepFormGroup extends FormGroup {
  private _spec: BuilderStepSpec | null;

  constructor(spec?: BuilderStepSpec, value?: Record<string, unknown>) {
    super(spec ? createRootControls(spec, value ?? spec.defaultValue) : {});
    this._spec = spec ?? null;
  }

  get spec(): BuilderStepSpec {
    if (!this._spec) {
      throw new Error('Missing step spec');
    }

    return this._spec;
  }

  get hasSpec(): boolean {
    return this._spec !== null;
  }

  optionalFields(fields: readonly BuilderFieldSpec[], control: FormGroup): BuilderFieldSpec[] {
    return fields.filter((field) => !field.required && !hasControl(control, fieldControlName(field)));
  }

  visibleFields(fields: readonly BuilderFieldSpec[], control: FormGroup): BuilderFieldSpec[] {
    return fields.filter((field) => field.required || hasControl(control, fieldControlName(field)));
  }

  addOptionalField(control: FormGroup, field: BuilderFieldSpec): void {
    if (control.disabled) {
      return;
    }

    control.addControl(fieldControlName(field), createControlForField(field));
    control.updateValueAndValidity();
  }

  removeOptionalField(control: FormGroup, field: BuilderFieldSpec): void {
    if (control.disabled) {
      return;
    }

    control.removeControl(fieldControlName(field));
    control.updateValueAndValidity();
  }

  addArrayItem(
    control: FormArray<AbstractControl>,
    field: Extract<BuilderFieldSpec, { kind: 'array' }>,
    value?: unknown,
  ): void {
    if (control.disabled) {
      return;
    }

    control.push(createControlForField(field.element, value));
    control.updateValueAndValidity();
  }

  removeArrayItem(control: FormArray<AbstractControl>, index: number): void {
    if (control.disabled) {
      return;
    }

    control.removeAt(index);
    control.updateValueAndValidity();
  }

  addRecordEntry(
    control: FormRecord<AbstractControl>,
    field: Extract<BuilderFieldSpec, { kind: 'record' }>,
    key: string,
    value?: unknown,
  ): boolean {
    if (control.disabled) {
      return false;
    }

    const normalizedKey = key.trim();

    if (normalizedKey.length === 0 || hasControl(control, normalizedKey)) {
      return false;
    }

    control.addControl(normalizedKey, createControlForField(field.value, value));
    control.updateValueAndValidity();

    return true;
  }

  removeRecordEntry(control: FormRecord<AbstractControl>, key: string): void {
    if (control.disabled) {
      return;
    }

    control.removeControl(key);
    control.updateValueAndValidity();
  }

  protected resetSpec(spec?: BuilderStepSpec, value?: Record<string, unknown>): void {
    Object.keys(this.controls).forEach((key) => {
      this.removeControl(key);
    });

    this._spec = spec ?? null;

    if (!spec) {
      return;
    }

    const controls = createRootControls(spec, value ?? spec.defaultValue);

    Object.entries(controls).forEach(([key, control]) => {
      this.addControl(key, control);
    });
  }
}

export const findStepSpec = (variantId: string): BuilderStepSpec => {
  const variant = USER_FLOW_AUDIT_BUILDER_STEP_VARIANTS.find((candidate) => candidate.id === variantId);

  if (!variant) {
    throw new Error(`Unsupported builder variant "${variantId}"`);
  }

  return deriveBuilderStepSpec(variant);
};

const createRootControls = (
  spec: BuilderStepSpec,
  value: Record<string, unknown>,
): Record<string, AbstractControl> => ({
  ...Object.fromEntries(
    Object.entries(spec.discriminators).map(([key, discriminator]) => [
      key,
      new FormControl(discriminator, {
        nonNullable: true,
        validators: [requiredScalarValueValidator],
      }),
    ]),
  ),
  ...Object.fromEntries(
    spec.fields
      .filter((field) => field.required || hasObjectKey(value, fieldControlName(field)))
      .map((field) => [fieldControlName(field), createControlForField(field, value[fieldControlName(field)])]),
  ),
});

const createControlForField = (field: BuilderFieldSpec, value?: unknown): AbstractControl => {
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

const createScalarControl = (field: BuilderScalarFieldSpec, value?: unknown): FormControl =>
  new FormControl(resolveScalarValue(field, value), {
    validators: buildScalarValidators(field),
    nonNullable: false,
  });

const createGroupControl = (
  field: Extract<BuilderFieldSpec, { kind: 'group' }>,
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
  field: Extract<BuilderFieldSpec, { kind: 'array' }>,
  value?: unknown,
): FormArray<AbstractControl> =>
  new FormArray<AbstractControl>(
    initialArrayItems(field, value).map((item) => createControlForField(field.element, item)),
    {
      validators: buildArrayValidators(field.validation),
    },
  );

// Selector paths always start with an editable input, including imported empty paths.
const initialArrayItems = (field: Extract<BuilderFieldSpec, { kind: 'array' }>, value: unknown): unknown[] => {
  const items = asArray(value);
  if (items.length > 0) return items;
  if (field.path === 'selectors' || field.path === 'selectors[].segments') return [undefined];
  return items;
};

const createRecordControl = (
  field: Extract<BuilderFieldSpec, { kind: 'record' }>,
  value?: unknown,
): FormRecord<AbstractControl> =>
  new FormRecord<AbstractControl>(
    Object.fromEntries(
      Object.entries(asRecord(value) ?? {}).map(([key, itemValue]) => [
        key,
        createControlForField(field.value, itemValue),
      ]),
    ),
  );

const resolveScalarValue = (field: BuilderScalarFieldSpec, value: unknown): unknown => {
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

const buildScalarValidators = (field: BuilderScalarFieldSpec): ValidatorFn[] => {
  const { validation } = field;
  const validators: ValidatorFn[] = [];

  if (mustHoldValue(field)) {
    validators.push(requiredScalarValueValidator);
  }

  if (field.kind === 'enum') {
    validators.push(oneOfValidator(field.options));
  }

  if (typeof validation?.minLength === 'number') {
    validators.push(Validators.minLength(validation.minLength));
  }

  if (typeof validation?.minimum === 'number') {
    validators.push(Validators.min(validation.minimum));
  }

  if (typeof validation?.maximum === 'number') {
    validators.push(Validators.max(validation.maximum));
  }

  if (typeof validation?.pattern === 'string') {
    validators.push(Validators.pattern(validation.pattern));
  }

  if (validation?.integer) {
    validators.push(integerValidator);
  }

  return validators;
};

/**
 * A control only exists for a required field or for an optional one that was added, so whatever it
 * holds is sent. Numbers and enums have no valid blank, and neither does a string with a minimum
 * length; a blank optional value there would be rejected by the schema, not treated as absent.
 */
const mustHoldValue = (field: BuilderScalarFieldSpec): boolean =>
  field.required || field.kind === 'number' || field.kind === 'enum' || (field.validation?.minLength ?? 0) > 0;

const buildArrayValidators = (validation: BuilderFieldValidationSpec | undefined): ValidatorFn[] => {
  if (typeof validation?.minItems !== 'number') {
    return [];
  }

  return [collectionMinLengthValidator(validation.minItems)];
};

const requiredScalarValueValidator: ValidatorFn = (control): ValidationErrors | null => {
  const value = control.value;

  return value === null || value === undefined || value === '' ? { required: true } : null;
};

const oneOfValidator =
  (options: readonly unknown[]): ValidatorFn =>
  (control): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    return options.includes(value) ? null : { oneOf: true };
  };

const integerValidator: ValidatorFn = (control): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return Number.isInteger(value) ? null : { integer: true };
};

const collectionMinLengthValidator =
  (minItems: number): ValidatorFn =>
  (control): ValidationErrors | null => {
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

export const stepFieldControlName = (field: BuilderFieldSpec): string => {
  const pathSegments = field.path.split('.');
  const terminalSegment = pathSegments[pathSegments.length - 1] ?? field.path;

  return terminalSegment.replace(/\[\]|\.\*/g, '').replace('*', '');
};

const fieldControlName = stepFieldControlName;

const hasObjectKey = (value: unknown, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(asRecord(value) ?? {}, key);

const hasControl = (control: FormGroup | FormRecord<AbstractControl>, key: string): boolean => key in control.controls;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
