const puppeteerReplayStepTypes = {
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

const lighthouseReplayStepTypes  = {
  StartNavigation: 'startNavigation',
  EndNavigation: 'endNavigation',
  StartTimespan: 'startTimespan',
  EndTimespan: 'endTimespan',
  Snapshot: 'snapshot'
} as const;

const stepTypes = [
  ...Object.keys(puppeteerReplayStepTypes),
  ...Object.keys(lighthouseReplayStepTypes)
] as const;

export type StepType =
  | typeof lighthouseReplayStepTypes[keyof typeof lighthouseReplayStepTypes]
  | typeof puppeteerReplayStepTypes[keyof typeof puppeteerReplayStepTypes] ;

export const stepNameTypes = stepTypes.map(i => i.replace(/([A-Z])/g, ' $1').trim());


export const deviceTypes = [
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
];
