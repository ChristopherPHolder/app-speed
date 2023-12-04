import { StepProperties } from './audit-form-step.types';

export const TIMEOUT: StepProperties = {
  name: 'timeout',
  inputType: 'number'
} as const;

export const VALUE: StepProperties = {
  name: 'value',
  inputType: 'string'
} as const;

export const SELECTORS: StepProperties = {
  name: 'selectors',
  inputType: 'stringArray',
  description: 'A list of alternative selectors that lead to selection of a single element to perform the step on. Currently, we support CSS selectors, ARIA selectors (start with \'aria/\'), XPath selectors (start with xpath/) and text selectors (start with text/). Each selector could be a string or an array of strings. If it\'s a string, it means that the selector points directly to the target element. If it\'s an array, the last element is the selector for the target element and the preceding selectors point to the ancestor elements. If the parent element is a shadow root host, the subsequent selector is evaluated only against the shadow DOM of the host (i.e., parent.shadowRoot.querySelector). If the parent element is not a shadow root host, the subsequent selector is evaluated in the regular DOM (i.e., parent.querySelector).\n' +
    'During the execution, it\'s recommended that the implementation tries out all of the alternative selectors to improve reliability of the replay as some selectors might get outdated over time.'
  // TODO IMPLEMENT THIS
} as const;

export const ATTRIBUTES: StepProperties =  {
  name: 'attributes',
  inputType: 'records',
  description: 'Whether to also check the element(s) for the given attributes.',
} as const;

export const COUNT: StepProperties = {
  name: 'count',
  inputType: 'number',
  defaultValue: 1,
};

export const VISIBLE: StepProperties = {
  name: 'visible',
  inputType: 'boolean',
  description: 'Whether to wait for elements matching this step to be hidden. This can be thought of as an inversion of this step.'
}

export const OPERATOR: StepProperties = {
  name: 'operator',
  inputType: 'options',
  options: ['>=', '==', '<='],
  defaultValue: '=='
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.NavigationEvent.md
export const ASSERTED_EVENTS: StepProperties =   {
  name: 'assertedEvents',
  inputType: 'string', // TODO This is incorrect!
  // TODO
} as const;

export const FRAME: StepProperties = {
  name: 'frame',
  inputType: 'number',
  // TODO implement Frame Type ?? or at least description and docs
}

export const EXPRESSION: StepProperties = {
  name: 'expression',
  inputType: 'string', // TODO Add description
}

export const TARGET: StepProperties = {
  name: 'target',
  inputType: 'string',
  // TODO this should have a description and maybe a validator ??
}

export const PROPERTIES: StepProperties = {
  name: 'properties',
  inputType: 'string' // TODO get correct typing and implement control
  // TODO IMPLEMENT THIS
}

export const BUTTON: StepProperties = {
  name: 'button',
  inputType: 'options',
  options: ['primary', 'auxiliary', 'secondary', 'back', 'forward']
}

export const DEVICE_TYPE: StepProperties = {
  name: 'deviceType',
  inputType: 'options',
  options: ['mouse', 'pen', 'touch']
}

export const DURATION: StepProperties = {
  name: 'duration',
  inputType: 'number',
  defaultValue: 50
}

export const OFFSETX: StepProperties = {
  name: 'offsetX',
  inputType: 'number',
  description: 'in px, relative to the top-left corner of the element content box. Defaults to the center of the element'
}

export const OFFSETY: StepProperties = {
  name: 'offsety',
  inputType: 'number',
  description: 'in px, relative to the top-left corner of the element content box. Defaults to the center of the element'
}

export const DOWNLOAD: StepProperties = {
  name: 'download',
  inputType: 'number',
}

export const LATENCY: StepProperties = {
  name: 'latency',
  inputType: 'number'
}

export const UPLOAD: StepProperties = {
  name: 'upload',
  inputType: 'number'
}

export const KEY: StepProperties = {
  name: 'key',
  inputType: 'options',
  options: ["0", "1" , "2" , "3" , "4" , "5" , "6" , "7" , "8" , "9" , "Power" , "Eject" , "Abort" , "Help" , "Backspace" , "Tab" , "Numpad5" , "NumpadEnter" , "Enter" , "\r" , "\n" , "ShiftLeft" , "ShiftRight" , "ControlLeft" , "ControlRight" , "AltLeft" , "AltRight" , "Pause" , "CapsLock" , "Escape" , "Convert" , "NonConvert" , "Space" , "Numpad9" , "PageUp" , "Numpad3" , "PageDown" , "End" , "Numpad1" , "Home" , "Numpad7" , "ArrowLeft" , "Numpad4" , "Numpad8" , "ArrowUp" , "ArrowRight" , "Numpad6" , "Numpad2" , "ArrowDown" , "Select" , "Open" , "PrintScreen" , "Insert" , "Numpad0" , "Delete" , "NumpadDecimal" , "Digit0" , "Digit1" , "Digit2" , "Digit3" , "Digit4" , "Digit5" , "Digit6" , "Digit7" , "Digit8" , "Digit9" , "KeyA" , "KeyB" , "KeyC" , "KeyD" , "KeyE" , "KeyF" , "KeyG" , "KeyH" , "KeyI" , "KeyJ" , "KeyK" , "KeyL" , "KeyM" , "KeyN" , "KeyO" , "KeyP" , "KeyQ" , "KeyR" , "KeyS" , "KeyT" , "KeyU" , "KeyV" , "KeyW" , "KeyX" , "KeyY" , "KeyZ" , "MetaLeft" , "MetaRight" , "ContextMenu" , "NumpadMultiply" , "NumpadAdd" , "NumpadSubtract" , "NumpadDivide" , "F1" , "F2" , "F3" , "F4" , "F5" , "F6" , "F7" , "F8" , "F9" , "F10" , "F11" , "F12" , "F13" , "F14" , "F15" , "F16" , "F17" , "F18" , "F19" , "F20" , "F21" , "F22" , "F23" , "F24" , "NumLock" , "ScrollLock" , "AudioVolumeMute" , "AudioVolumeDown" , "AudioVolumeUp" , "MediaTrackNext" , "MediaTrackPrevious" , "MediaStop" , "MediaPlayPause" , "Semicolon" , "Equal" , "NumpadEqual" , "Comma" , "Minus" , "Period" , "Slash" , "Backquote" , "BracketLeft" , "Backslash" , "BracketRight" , "Quote" , "AltGraph" , "Props" , "Cancel" , "Clear" , "Shift" , "Control" , "Alt" , "Accept" , "ModeChange" , " " , "Print" , "Execute" , "\u0000" , "a" , "b" , "c" , "d" , "e" , "f" , "g" , "h" , "i" , "j" , "k" , "l" , "m" , "n" , "o" , "p" , "q" , "r" , "s" , "t" , "u" , "v" , "w" , "x" , "y" , "z" , "Meta" , "*" , "+" , "-" , "/" , ";" , "=" , "," , "." , "`" , "[" , "\\" , "]" , "'" , "Attn" , "CrSel" , "ExSel" , "EraseEof" , "Play" , "ZoomOut" , ")" , "!" , "@" , "#" , "$" , "%" , "^" , "&" , "(" , "A" , "B" , "C" , "D" , "E" , "F" , "G" , "H" , "I" , "J" , "K" , "L" , "M" , "N" , "O" , "P" , "Q" , "R" , "S" , "T" , "U" , "V" , "W" , "X" , "Y" , "Z" , ":" , "<" , "_" , ">" , "?" , "~" , "{" , "," , "}" , "\"" , "SoftLeft" , "SoftRight" , "Camera" , "Call" , "EndCall" , "VolumeDown" , "VolumeUp"]
}


export const URL: StepProperties = {
  name: 'url',
  inputType: 'string', // TODO SHOULD HAVE A VALIDATOR
}

export const X: StepProperties = {
  name: 'x',
  inputType: 'number',
  description: 'Absolute scroll x position in px. Defaults to 0'
}

export const Y: StepProperties = {
  name: 'y',
  inputType: 'number',
  description: 'Absolute scroll y position in px. Defaults to 0'
}

export const DEVICE_SCALE_FACTOR: StepProperties = {
  name: 'deviceScaleFactor',
  inputType: 'number',
}

export const HAS_TOUCH: StepProperties = {
  name: 'hasTouch',
  inputType: 'boolean'
}

export const HEIGHT: StepProperties = {
  name: 'height',
  inputType: 'number'
}

export const IS_LANDSCAPE: StepProperties = {
  name: 'isLandscape',
  inputType: 'boolean'
}

export const IS_MOBILE: StepProperties = {
  name: 'isMobile',
  inputType: 'boolean'
}

export const WIDTH: StepProperties = {
  name: 'width',
  inputType: 'number'
}
