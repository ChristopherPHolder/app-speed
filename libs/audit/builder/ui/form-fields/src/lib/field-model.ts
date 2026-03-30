import type { AbstractControl, FormArray, FormControl } from '@angular/forms';

type FieldOptionValue = string | boolean;

type FieldOptionGroupModel = {
  label: string;
  icon: string;
  options: readonly FieldOptionValue[];
};

type FieldOptionModel = FieldOptionValue | FieldOptionGroupModel;

interface FieldPropertyModel {
  name: string;
  inputType: string;
  options?: readonly FieldOptionModel[];
}

interface FieldModel<TControl extends AbstractControl = AbstractControl> {
  name: string;
  property: FieldPropertyModel;
  control: TControl;
  removable: boolean;
}

export type InputFieldModel = FieldModel<FormControl>;
export type OptionsFieldModel = FieldModel<FormControl>;
export type ArrayFieldModel = FieldModel<FormArray<FormControl<string>>>;
