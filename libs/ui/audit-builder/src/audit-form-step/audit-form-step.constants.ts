

// TODO RENAME TYPE
type AutoCompleteOptionGroup = {
  name: string;
  options: AutoCompleteOption[]
}

// TODO RENAME TYPE
type AutoCompleteOption = {
  value: string;
  properties?: any[]
}

export const LIGHTHOUSE_STEP_OPTIONS: AutoCompleteOption[] = [
  {
    value: 'startNavigation'
  },
  {
    value: 'endNavigation',
  },
  {
    value: 'startTimespan',
  },
  {
    value: 'endTimespan',
  },
  {
    value: 'snapshot',
  }
];

export const PUPPETEER_REPLY_STEP_OPTIONS: AutoCompleteOption[] = [
  {
    value: 'change',
  },
  {
    value: 'click',
  },
  {
    value: 'close',
  },
  {
    value: 'customStep',
  },
  {
    value: 'doubleClick',
  },
  // {
  //   value: 'emulateNetworkConditions',
  //   viewValue: 'Emulate Network Conditions'
  // },
  {
    value: 'hover',
  },
  {
    value: 'keyDown',
  },
  {
    value: 'keyUp',
  },
  {
    value: 'navigate',
    properties: [
      {
        // TODO add validation for url
        value: 'url',
        type: 'string',
        required: true,
      },
      {
        // TODO add max min values
        value: 'timeout',
        type: 'number',
        required: false,
      },
      {
        // TODO investigate additional details
        // https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.StepWithTarget.md#target
        value: 'target',
        type: 'string'
      },
      {
        // TODO investigate additional details
        // https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.NavigationEvent.md
        value: 'assertedEvents',
        type: 'array',
      }
    ]
  },
  {
    value: 'scroll',
  },
  // {
  //   value: 'setViewport',
  //   viewValue: 'Set Viewport'
  // },
  {
    value: 'waitForElement',
  },
  {
    value: 'waitForExpression',
  }
];

export const AUDIT_STEP_OPTION_GROUPS: AutoCompleteOptionGroup[] = [
  {
    name: 'Lighthouse Steps',
    options: LIGHTHOUSE_STEP_OPTIONS,
  },
  {
    name: 'Puppeteer Steps',
    options: PUPPETEER_REPLY_STEP_OPTIONS,
  }
]
