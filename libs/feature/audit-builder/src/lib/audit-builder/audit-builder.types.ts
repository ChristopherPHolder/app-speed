import { DEVICE_TYPE, INPUT_TYPE, PROPERTY_NAME, STEP_TYPE } from './audit-builder.constants';

export type PropertyName = typeof PROPERTY_NAME[keyof typeof PROPERTY_NAME];

export type DeviceType = typeof DEVICE_TYPE[keyof typeof DEVICE_TYPE];

export type Step = { [PROPERTY_NAME.TYPE]: StepType } & Partial<Record<PropertyName, InputType>>;

export interface AuditDetails  {
  title: string;
  device: DeviceType;
  timeout: number
  steps: Step[] // TODO fix type
}

export type InputType = typeof INPUT_TYPE[keyof typeof INPUT_TYPE];

export type InputValue = string | number | boolean | string[];

export type StepProperty = {
  name: PropertyName;
  inputType: InputType;
  defaultValue?: InputValue;
  options?: string[];
  description?: string;
  required?: boolean;
}

export type StepType = typeof STEP_TYPE[keyof typeof STEP_TYPE];
export type StepDetails = {
  type: StepType;
  properties: StepProperty[],
  description?: string
}
