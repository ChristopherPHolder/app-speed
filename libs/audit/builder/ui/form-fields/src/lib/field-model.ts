import type { AbstractControl, FormArray, FormControl } from '@angular/forms';

type FieldOptionValue = string | boolean;

type FieldOptionGroupModel = {
  label: string;
  icon: string;
  options: readonly FieldOptionValue[];
};

type FieldOptionModel = FieldOptionValue | FieldOptionGroupModel;

// TODO should extend InputType from libs/audit/model/src/lib/builder/input-type.ts
interface BaseFieldModel<TFieldType extends string = string> {
  name: string;
  inputType: TFieldType;
}

interface FieldPropertyModel {
  name: string;
  inputType: string;
  options?: readonly FieldOptionModel[];
}

interface FieldModel<
  TControl extends AbstractControl = AbstractControl,
  TFieldProperty extends BaseFieldModel = FieldPropertyModel,
> {
  name: string;
  property: TFieldProperty;
  control: TControl;
  removable: boolean;
}

export type InputFieldModel = FieldModel<FormControl<string | number>, BaseFieldModel<'string' | 'number'>>;
export type OptionsFieldModel = FieldModel<FormControl>;
export type ArrayFieldModel = FieldModel<FormArray<FormControl<string>>>;
