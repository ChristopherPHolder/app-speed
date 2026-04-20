import type { AbstractControl, FormArray, FormControl } from '@angular/forms';
import type { InputType } from '@app-speed/audit/portal/model';

type FieldOptionValue = string | boolean;

type FieldOptionGroupModel = {
  label: string;
  icon: string;
  options: readonly FieldOptionValue[];
};

type FieldOptionModel = FieldOptionValue | FieldOptionGroupModel;

interface BaseFieldModel<TFieldType extends InputType = InputType> {
  name: string;
  inputType: TFieldType;
}

interface FieldPropertyModel extends BaseFieldModel {
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
