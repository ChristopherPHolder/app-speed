export type InputType = 'string' | 'number' | 'boolean' | 'records' | 'options' | 'stringArray';

export type StepProperties = {
  name: string;
  inputType: InputType;
  defaultValue?: string | number;
  options?: string[];
  description?: string;
  required?: boolean;
}

export type StepDetails = {
  type: string; // TODO This cloud be strongly typed ?
  properties: StepProperties[],
  description?: string
}
