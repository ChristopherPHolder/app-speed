export const STEP_TYPE = {
  EMPTY: '',
  WAIT_FOR_ELEMENT: 'waitForElement',
  WAIT_FOR_EXPRESSION: 'waitForExpression',
  CHANGE: 'change',
  CLICK: 'click',
  CLOSE: 'close',
  DOUBLE_CLICK: 'doubleClick',
  EMULATE_NETWORK_CONDITIONS: 'emulateNetworkConditions',
  HOVER: 'hover',
  KEY_DOWN: 'keyDown',
  KEY_UP: 'keyUp',
  NAVIGATE: 'navigate',
  SCROLL: 'scroll',
  SET_VIEWPORT: 'setViewport',
} as const;

export const PROPERTY_NAME = {
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

export const INPUT_TYPE = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  OPTIONS: 'options',
  STRING_ARRAY: 'stringArray',
  RECORDS: 'records'
} as const;

export const DEVICE_TYPE = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop'
} as const;

export const DEFAULT_AUDIT_DETAILS = {
  title: '',
  device: 'mobile',
  timeout: 30000,
  steps: [
    { type: 'startNavigation', stepOptions: { name: 'Initial Navigation' } },
    { type:  'navigate', url: 'https://google.com' },
    { type: 'endNavigation' },
  ]
} as const;

