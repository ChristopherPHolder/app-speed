import { AUDIT_BUILDER_STEP_VARIANTS } from '@app-speed/audit/domain';

export type ContractStepPresentationGroup = 'Audit Steps' | 'Custom Steps' | 'Assertion Steps' | 'Action Steps';
export type ContractStepPresentationIcon = 'lighthouse-badge' | 'puppeteer-badge';

export type ContractFieldPresentation = {
  description?: string;
  label?: string;
};

export type ContractStepPresentation = {
  fields?: Record<string, ContractFieldPresentation>;
  group: ContractStepPresentationGroup;
  icon: ContractStepPresentationIcon;
  label: string;
};

export type ContractStepSelectionOptionGroup = {
  icon: ContractStepPresentationIcon;
  label: ContractStepPresentationGroup;
  options: readonly string[];
};

export const AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY = {
  waitForElement: {
    group: 'Assertion Steps',
    icon: 'puppeteer-badge',
    label: 'Wait For Element',
    fields: {
      selectors: {
        description: 'Alternative selector paths that identify the same element.',
      },
      'selectors[].segments': {
        description: 'Ancestor-to-target selector segments for a single selector path.',
        label: 'Selector Segments',
      },
      assertedEvents: {
        label: 'Asserted Events',
      },
      'assertedEvents[].type': {
        label: 'Event Type',
      },
      'assertedEvents[].title': {
        label: 'Navigation Title',
      },
      'assertedEvents[].url': {
        label: 'Navigation Url',
      },
      attributes: {
        description: 'Whether matching elements should also expose these attributes.',
      },
      properties: {
        description: 'Whether matching elements should also expose these properties.',
      },
      timeout: {
        label: 'Timeout (ms)',
      },
      target: {
        label: 'Target Page',
      },
    },
  },
  waitForExpression: {
    group: 'Assertion Steps',
    icon: 'puppeteer-badge',
    label: 'Wait For Expression',
    fields: {
      timeout: {
        label: 'Timeout (ms)',
      },
      target: {
        label: 'Target Page',
      },
    },
  },
  change: {
    group: 'Action Steps',
    icon: 'puppeteer-badge',
    label: 'Change',
  },
  click: {
    group: 'Action Steps',
    icon: 'puppeteer-badge',
    label: 'Click',
  },
  close: {
    group: 'Action Steps',
    icon: 'puppeteer-badge',
    label: 'Close',
  },
  doubleClick: {
    group: 'Action Steps',
    icon: 'puppeteer-badge',
    label: 'Double Click',
  },
  emulateNetworkConditions: {
    group: 'Action Steps',
    icon: 'puppeteer-badge',
    label: 'Emulate Network Conditions',
  },
  hover: {
    group: 'Action Steps',
    icon: 'puppeteer-badge',
    label: 'Hover',
  },
  keyDown: {
    group: 'Action Steps',
    icon: 'puppeteer-badge',
    label: 'Key Down',
  },
  keyUp: {
    group: 'Action Steps',
    icon: 'puppeteer-badge',
    label: 'Key Up',
  },
  navigate: {
    group: 'Action Steps',
    icon: 'puppeteer-badge',
    label: 'Navigate',
  },
  scroll: {
    group: 'Action Steps',
    icon: 'puppeteer-badge',
    label: 'Scroll',
  },
  setViewport: {
    group: 'Action Steps',
    icon: 'puppeteer-badge',
    label: 'Set Viewport',
  },
  startNavigation: {
    group: 'Audit Steps',
    icon: 'lighthouse-badge',
    label: 'Start Navigation',
  },
  endNavigation: {
    group: 'Audit Steps',
    icon: 'lighthouse-badge',
    label: 'End Navigation',
  },
  startTimespan: {
    group: 'Audit Steps',
    icon: 'lighthouse-badge',
    label: 'Start Timespan',
  },
  endTimespan: {
    group: 'Audit Steps',
    icon: 'lighthouse-badge',
    label: 'End Timespan',
  },
  snapshot: {
    group: 'Audit Steps',
    icon: 'lighthouse-badge',
    label: 'Snapshot',
  },
  clearCache: {
    group: 'Custom Steps',
    icon: 'puppeteer-badge',
    label: 'Clear Cache',
  },
  addCookie: {
    group: 'Custom Steps',
    icon: 'puppeteer-badge',
    label: 'Add Cookie',
    fields: {
      url: {
        label: 'Cookie Url',
      },
      sameSite: {
        label: 'Same Site',
      },
    },
  },
} as const satisfies Record<string, ContractStepPresentation>;

export const getContractStepPresentation = (variantId: string): ContractStepPresentation =>
  (AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY as Record<string, ContractStepPresentation>)[variantId] ?? {
    group: 'Action Steps',
    icon: 'puppeteer-badge',
    label: variantId,
  };

export const getContractFieldPresentation = (variantId: string, fieldPath: string): ContractFieldPresentation | undefined =>
  (AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY as Record<string, ContractStepPresentation>)[variantId]?.fields?.[fieldPath];

const CONTRACT_STEP_GROUP_ORDER: readonly ContractStepPresentationGroup[] = [
  'Audit Steps',
  'Custom Steps',
  'Assertion Steps',
  'Action Steps',
];

export const STEP_SELECTION_OPTIONS_GROUPED: readonly ContractStepSelectionOptionGroup[] = CONTRACT_STEP_GROUP_ORDER.reduce<
  ContractStepSelectionOptionGroup[]
>((groups, group) => {
  const variants = AUDIT_BUILDER_STEP_VARIANTS
    .map((variant) => variant.id)
    .filter((variantId) => getContractStepPresentation(variantId).group === group);

  if (variants.length === 0) {
    return groups;
  }

  groups.push({
    label: group,
    icon: getContractStepPresentation(variants[0] ?? '').icon,
    options: variants,
  });

  return groups;
}, []);
