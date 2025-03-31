import { INPUT_TYPE, InputType, InputValue } from './input-type';
import { PROPERTY_NAME, PropertyName } from './property-name';
import { STEP_OPTIONS } from './step-type';

export type StepProperty = {
  name: PropertyName;
  inputType: InputType;
  defaultValue?: InputValue;
  options?: (string | boolean)[];
  description?: string;
  required?: boolean;
};

export const requiredFeature = (property: StepProperty): StepProperty => ({ ...property, required: true });

export const type = {
  name: PROPERTY_NAME.TYPE,
  inputType: INPUT_TYPE.OPTIONS,
  required: true,
  options: STEP_OPTIONS,
} as const satisfies StepProperty;

export const timeout = {
  name: PROPERTY_NAME.TIMEOUT,
  inputType: INPUT_TYPE.NUMBER,
  defaultValue: 30000,
} as const satisfies StepProperty;

export const value = {
  name: PROPERTY_NAME.VALUE,
  inputType: INPUT_TYPE.STRING,
} as const satisfies StepProperty;

export const selectors = {
  name: PROPERTY_NAME.SELECTORS,
  inputType: INPUT_TYPE.STRING_ARRAY,
  description:
    "A list of alternative selectors that lead to selection of a single element to perform the step on. Currently, we support CSS selectors, ARIA selectors (start with 'aria/'), XPath selectors (start with xpath/) and text selectors (start with text/). Each selector could be a string or an array of strings. If it's a string, it means that the selector points directly to the target element. If it's an array, the last element is the selector for the target element and the preceding selectors point to the ancestor elements. If the parent element is a shadow root host, the subsequent selector is evaluated only against the shadow DOM of the host (i.e., parent.shadowRoot.querySelector). If the parent element is not a shadow root host, the subsequent selector is evaluated in the regular DOM (i.e., parent.querySelector).\n" +
    "During the execution, it's recommended that the implementation tries out all of the alternative selectors to improve reliability of the replay as some selectors might get outdated over time.",
  // TODO IMPLEMENT THIS
} as const satisfies StepProperty;

export const attributes = {
  name: PROPERTY_NAME.ATTRIBUTES,
  inputType: INPUT_TYPE.RECORDS,
  description: 'Whether to also check the element(s) for the given attributes.',
} as const satisfies StepProperty;

export const count = {
  name: PROPERTY_NAME.COUNT,
  inputType: INPUT_TYPE.NUMBER,
  defaultValue: 1,
} as const satisfies StepProperty;

export const visible = {
  name: PROPERTY_NAME.VISIBLE,
  inputType: INPUT_TYPE.BOOLEAN,
  description:
    'Whether to wait for elements matching this step to be hidden. This can be thought of as an inversion of this step.',
  options: [true, false],
} as const satisfies StepProperty;

export const operator = {
  name: PROPERTY_NAME.OPERATOR,
  inputType: INPUT_TYPE.OPTIONS,
  options: ['>=', '==', '<='],
  defaultValue: '==',
} as const satisfies StepProperty;

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.NavigationEvent.md
export const assertedEvents = {
  name: PROPERTY_NAME.ASSERTED_EVENTS,
  inputType: INPUT_TYPE.STRING_ARRAY, // TODO This is incorrect!
  // TODO
} as const satisfies StepProperty;

export const frame = {
  name: PROPERTY_NAME.FRAME,
  inputType: INPUT_TYPE.NUMBER_ARRAY,
  // TODO implement Frame Type ?? or at least description and docs
} as const satisfies StepProperty;

export const expression = {
  name: PROPERTY_NAME.EXPRESSION,
  inputType: INPUT_TYPE.STRING, // TODO Add description
} as const satisfies StepProperty;

export const target = {
  name: PROPERTY_NAME.TARGET,
  inputType: INPUT_TYPE.STRING,
  // TODO this should have a description and maybe a validator ??
} as const satisfies StepProperty;

export const properties = {
  name: PROPERTY_NAME.PROPERTIES,
  inputType: INPUT_TYPE.STRING, // TODO get correct typing and implement control
  // TODO IMPLEMENT THIS
} as const satisfies StepProperty;

export const button = {
  name: PROPERTY_NAME.BUTTON,
  inputType: INPUT_TYPE.OPTIONS,
  options: ['primary', 'auxiliary', 'secondary', 'back', 'forward'],
} as const satisfies StepProperty;

export const deviceType = {
  name: PROPERTY_NAME.DEVICE_TYPE,
  inputType: INPUT_TYPE.OPTIONS,
  options: ['mouse', 'pen', 'touch'],
} as const satisfies StepProperty;

export const duration = {
  name: PROPERTY_NAME.DURATION,
  inputType: INPUT_TYPE.NUMBER,
  defaultValue: 50,
} as const satisfies StepProperty;

export const offsetX = {
  name: PROPERTY_NAME.OFFSET_X,
  inputType: INPUT_TYPE.NUMBER,
  description:
    'in px, relative to the top-left corner of the element content box. Defaults to the center of the element',
} as const satisfies StepProperty;

export const offsetY = {
  name: PROPERTY_NAME.OFFSET_Y,
  inputType: INPUT_TYPE.NUMBER,
  description:
    'in px, relative to the top-left corner of the element content box. Defaults to the center of the element',
} as const satisfies StepProperty;

export const download = {
  name: PROPERTY_NAME.DOWNLOAD,
  inputType: INPUT_TYPE.NUMBER,
} as const satisfies StepProperty;

export const latency = {
  name: PROPERTY_NAME.LATENCY,
  inputType: INPUT_TYPE.NUMBER,
} as const satisfies StepProperty;

export const upload = {
  name: PROPERTY_NAME.UPLOAD,
  inputType: INPUT_TYPE.NUMBER,
} as const satisfies StepProperty;

const KEP_PROPERTY_OPTIONS = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'Power',
  'Eject',
  'Abort',
  'Help',
  'Backspace',
  'Tab',
  'Numpad5',
  'NumpadEnter',
  'Enter',
  '\r',
  '\n',
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'Pause',
  'CapsLock',
  'Escape',
  'Convert',
  'NonConvert',
  'Space',
  'Numpad9',
  'PageUp',
  'Numpad3',
  'PageDown',
  'End',
  'Numpad1',
  'Home',
  'Numpad7',
  'ArrowLeft',
  'Numpad4',
  'Numpad8',
  'ArrowUp',
  'ArrowRight',
  'Numpad6',
  'Numpad2',
  'ArrowDown',
  'Select',
  'Open',
  'PrintScreen',
  'Insert',
  'Numpad0',
  'Delete',
  'NumpadDecimal',
  'Digit0',
  'Digit1',
  'Digit2',
  'Digit3',
  'Digit4',
  'Digit5',
  'Digit6',
  'Digit7',
  'Digit8',
  'Digit9',
  'KeyA',
  'KeyB',
  'KeyC',
  'KeyD',
  'KeyE',
  'KeyF',
  'KeyG',
  'KeyH',
  'KeyI',
  'KeyJ',
  'KeyK',
  'KeyL',
  'KeyM',
  'KeyN',
  'KeyO',
  'KeyP',
  'KeyQ',
  'KeyR',
  'KeyS',
  'KeyT',
  'KeyU',
  'KeyV',
  'KeyW',
  'KeyX',
  'KeyY',
  'KeyZ',
  'MetaLeft',
  'MetaRight',
  'ContextMenu',
  'NumpadMultiply',
  'NumpadAdd',
  'NumpadSubtract',
  'NumpadDivide',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
  'F13',
  'F14',
  'F15',
  'F16',
  'F17',
  'F18',
  'F19',
  'F20',
  'F21',
  'F22',
  'F23',
  'F24',
  'NumLock',
  'ScrollLock',
  'AudioVolumeMute',
  'AudioVolumeDown',
  'AudioVolumeUp',
  'MediaTrackNext',
  'MediaTrackPrevious',
  'MediaStop',
  'MediaPlayPause',
  'Semicolon',
  'Equal',
  'NumpadEqual',
  'Comma',
  'Minus',
  'Period',
  'Slash',
  'Backquote',
  'BracketLeft',
  'Backslash',
  'BracketRight',
  'Quote',
  'AltGraph',
  'Props',
  'Cancel',
  'Clear',
  'Shift',
  'Control',
  'Alt',
  'Accept',
  'ModeChange',
  ' ',
  'Print',
  'Execute',
  '\u0000',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  'Meta',
  '*',
  '+',
  '-',
  '/',
  ';',
  '=',
  ',',
  '.',
  '`',
  '[',
  '\\',
  ']',
  "'",
  'Attn',
  'CrSel',
  'ExSel',
  'EraseEof',
  'Play',
  'ZoomOut',
  ')',
  '!',
  '@',
  '#',
  '$',
  '%',
  '^',
  '&',
  '(',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  ':',
  '<',
  '_',
  '>',
  '?',
  '~',
  '{',
  ',',
  '}',
  '"',
  'SoftLeft',
  'SoftRight',
  'Camera',
  'Call',
  'EndCall',
  'VolumeDown',
  'VolumeUp',
];

export const key = {
  name: PROPERTY_NAME.KEY,
  inputType: INPUT_TYPE.OPTIONS,
  options: KEP_PROPERTY_OPTIONS,
} as const satisfies StepProperty;

export const url = {
  name: PROPERTY_NAME.URL,
  inputType: INPUT_TYPE.STRING, // TODO SHOULD HAVE A VALIDATOR
} as const satisfies StepProperty;

export const x = {
  name: PROPERTY_NAME.X,
  inputType: INPUT_TYPE.NUMBER,
  description: 'Absolute scroll x position in px. Defaults to 0',
} as const satisfies StepProperty;

export const y = {
  name: PROPERTY_NAME.Y,
  inputType: INPUT_TYPE.NUMBER,
  description: 'Absolute scroll y position in px. Defaults to 0',
} as const satisfies StepProperty;

export const deviceScaleFactor = {
  name: PROPERTY_NAME.DEVICE_SCALE_FACTOR,
  inputType: INPUT_TYPE.NUMBER,
} as const satisfies StepProperty;

export const hasTouch = {
  name: PROPERTY_NAME.HAS_TOUCH,
  inputType: INPUT_TYPE.BOOLEAN,
} as const satisfies StepProperty;

export const height = {
  name: PROPERTY_NAME.HEIGHT,
  inputType: INPUT_TYPE.NUMBER,
} as const satisfies StepProperty;

export const isLandscape = {
  name: PROPERTY_NAME.IS_LANDSCAPE,
  inputType: INPUT_TYPE.BOOLEAN,
} as const satisfies StepProperty;

export const isMobile = {
  name: PROPERTY_NAME.IS_MOBILE,
  inputType: INPUT_TYPE.BOOLEAN,
} as const satisfies StepProperty;

export const width = {
  name: PROPERTY_NAME.WIDTH,
  inputType: INPUT_TYPE.NUMBER,
} as const satisfies StepProperty;

export const name = {
  name: PROPERTY_NAME.NAME,
  inputType: INPUT_TYPE.STRING,
} as const satisfies StepProperty;

export const STEP_PROPERTY = {
  type,
  name,
  timeout,
  value,
  selectors,
  attributes,
  count,
  visible,
  operator,
  assertEvents: assertedEvents,
  frame,
  expression,
  target,
  properties,
  button,
  deviceType,
  duration,
  offsetX,
  offsetY,
  download,
  latency,
  upload,
  key,
  url,
  x,
  y,
  deviceScaleFactor,
  hasTouch,
  height,
  isLandscape,
  isMobile,
  width,
};
