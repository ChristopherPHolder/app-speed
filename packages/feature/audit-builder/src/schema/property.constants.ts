import { FormArray, FormControl, Validators } from '@angular/forms';

export const INPUT_TYPE = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  OPTIONS: 'options',
  STRING_ARRAY: 'stringArray',
  RECORDS: 'records'
} as const;

export const PROPERTY_NAME = {
  NAME: 'name',
  TYPE: 'type',
  TIMEOUT: 'timeout',
  VALUE: 'value',
  SELECTORS: 'selectors',
  ATTRIBUTES: 'attributes',
  COUNT: 'count',
  VISIBLE: 'visible',
  OPERATOR: 'operator',
  ASSERTED_EVENTS: 'assertedEvents',
  FRAME: 'frame',
  EXPRESSION: 'expression',
  TARGET: 'target',
  PROPERTIES: 'properties',
  BUTTON: 'button',
  DEVICE_TYPE: 'deviceType',
  DURATION: 'duration',
  OFFSET_X: 'offsetX',
  OFFSET_Y: 'offsetY',
  DOWNLOAD: 'download',
  LATENCY: 'latency',
  UPLOAD: 'upload',
  KEY: 'key',
  URL: 'url',
  X: 'x',
  Y: 'y',
  DEVICE_SCALE_FACTOR: 'deviceScaleFactor',
  HAS_TOUCH: 'hasTouch',
  HEIGHT: 'height',
  IS_LANDSCAPE: 'isLandscape',
  IS_MOBILE: 'isMobile',
  WIDTH: 'width',
} as const;

export const PROPERTY_DEFAULT = {
  [INPUT_TYPE.STRING]: '',
  [INPUT_TYPE.NUMBER]: 0,
  [INPUT_TYPE.BOOLEAN]: false,
  [INPUT_TYPE.OPTIONS]: '',
  [INPUT_TYPE.STRING_ARRAY]: [''] satisfies string[], // TODO improve typing
  [INPUT_TYPE.RECORDS]: '' // TODO
} as const;

export const INPUT_TYPE_VALIDATOR = {
  [INPUT_TYPE.STRING]: (value: unknown): value is string => typeof value === 'string',
  [INPUT_TYPE.NUMBER]: (value: unknown): value is number => typeof value === 'number',
  [INPUT_TYPE.BOOLEAN]: (value: unknown): value is boolean => typeof value === 'boolean',
  [INPUT_TYPE.OPTIONS]: (value: unknown): value is string => typeof value === 'string', // TODO
  [INPUT_TYPE.STRING_ARRAY]: (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string'),
  [INPUT_TYPE.RECORDS]: (value: unknown): value is string => typeof value === 'string', // TODO
} as const;

export const PROPERTY_CONTROL_BUILDER = {
  [INPUT_TYPE.STRING]: (value: string) => new FormControl<string>(value, { validators: [Validators.required], nonNullable: true }),
  [INPUT_TYPE.NUMBER]: (value: number) => new FormControl<number>(value, { validators: [Validators.required], nonNullable: true }),
  [INPUT_TYPE.BOOLEAN]: (value: boolean) => new FormControl<boolean>(value, { validators: [Validators.required], nonNullable: true }),
  [INPUT_TYPE.OPTIONS]: (value: string) => new FormControl<string>(value, { validators: [Validators.required], nonNullable: true }),
  [INPUT_TYPE.STRING_ARRAY]: (value: string[]) => new FormArray((value).map((i) => new FormControl<string>(i, { validators: [Validators.required], nonNullable: true }))),
  [INPUT_TYPE.RECORDS]: (value: string) => new FormControl<string>(value, { validators: [Validators.required], nonNullable: true }),
} as const;
