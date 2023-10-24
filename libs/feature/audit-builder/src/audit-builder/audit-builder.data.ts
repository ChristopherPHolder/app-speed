export const PUPPETEER_REPLAY_STEP_TYPES = {
  Change: 'change',
  Click: 'click',
  Close: 'close',
  CustomStep: 'customStep',
  DoubleClick: 'doubleClick',
  EmulateNetworkConditions: 'emulateNetworkConditions',
  Hover: 'hover',
  KeyDown: 'keyDown',
  KeyUp: 'keyUp',
  Navigate: 'navigate',
  Scroll: 'scroll',
  SetViewport: 'setViewport',
  WaitForElement: 'waitForElement',
  WaitForExpression: 'waitForExpression',
} as const;

// TODO reuse shared type
export const LIGHTHOUSE_REPLY_STEP_TYPES  = {
  StartNavigation: 'startNavigation',
  EndNavigation: 'endNavigation',
  StartTimespan: 'startTimespan',
  EndTimespan: 'endTimespan',
  Snapshot: 'snapshot'
} as const;

export const DEVICE_TYPES = [
  {
    value: 'mobile',
    viewValue: 'Mobile'
  },
  {
    value: 'tablet',
    viewValue: 'Tablet'
  },
  {
    value: 'desktop',
    viewValue: 'Desktop'
  }
] as const;

const stepTypes = [
  ...Object.keys(PUPPETEER_REPLAY_STEP_TYPES),
  ...Object.keys(LIGHTHOUSE_REPLY_STEP_TYPES)
] as const;

export const stepNameTypes = stepTypes.map(i => i.replace(/([A-Z])/g, ' $1').trim());
