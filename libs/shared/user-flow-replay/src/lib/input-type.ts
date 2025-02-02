export const INPUT_TYPE = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  OPTIONS: 'options',
  STRING_ARRAY: 'stringArray',
  RECORDS: 'records',
} as const;

export const INPUT_TYPE_VALIDATOR = {
  [INPUT_TYPE.STRING]: (value: unknown): value is string => typeof value === 'string',
  [INPUT_TYPE.NUMBER]: (value: unknown): value is number => typeof value === 'number',
  [INPUT_TYPE.BOOLEAN]: (value: unknown): value is boolean => typeof value === 'boolean',
  [INPUT_TYPE.OPTIONS]: (value: unknown): value is string => typeof value === 'string', // TODO
  [INPUT_TYPE.STRING_ARRAY]: (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'string'),
  [INPUT_TYPE.RECORDS]: (value: unknown): value is string => typeof value === 'string', // TODO
} as const;

export const INPUT_TYPE_DEFAULT = {
  [INPUT_TYPE.STRING]: '',
  [INPUT_TYPE.NUMBER]: 0,
  [INPUT_TYPE.BOOLEAN]: false,
  [INPUT_TYPE.OPTIONS]: '',
  [INPUT_TYPE.STRING_ARRAY]: [''] satisfies string[], // TODO improve typing
  [INPUT_TYPE.RECORDS]: '', // TODO
} as const;

export type InputType = (typeof INPUT_TYPE)[keyof typeof INPUT_TYPE];

export type InputValue = string | number | boolean | string[];
