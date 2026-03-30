export const INPUT_TYPE = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  OPTIONS: 'options',
  STRING_ARRAY: 'stringArray',
  NUMBER_ARRAY: 'numberArray',
  RECORDS: 'records',
} as const;

export type InputType = (typeof INPUT_TYPE)[keyof typeof INPUT_TYPE];

export type InputValue = string | number | boolean | string[];
