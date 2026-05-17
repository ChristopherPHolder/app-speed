import {
  AUDIT_BUILDER_STEP_VARIANTS,
  AUDIT_CUSTOM_STEP_TYPE,
  LIGHTHOUSE_AUDIT_STEP_TYPE,
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  PUPPETEER_REPLAY_USER_STEP_TYPE,
} from '@app-speed/audit/domain';

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

type ContractStepPresentationOverride = {
  fields?: Record<string, ContractFieldPresentation>;
  label?: string;
};

export const AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY = {
  waitForElement: {
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
    fields: {
      timeout: {
        label: 'Timeout (ms)',
      },
      target: {
        label: 'Target Page',
      },
    },
  },
  addCookie: {
    fields: {
      url: {
        label: 'Cookie Url',
      },
      sameSite: {
        label: 'Same Site',
      },
    },
  },
} as const satisfies Partial<Record<string, ContractStepPresentationOverride>>;

export const getContractStepPresentation = (variantId: string): ContractStepPresentation => {
  const override =
    (AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY as Partial<Record<string, ContractStepPresentationOverride>>)[variantId];

  return {
    group: getContractStepGroup(variantId),
    icon: getContractStepIcon(variantId),
    label: override?.label ?? humanizeToken(variantId),
    fields: override?.fields,
  };
};

export const getContractFieldPresentation = (variantId: string, fieldPath: string): ContractFieldPresentation | undefined =>
  (AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY as Partial<Record<string, ContractStepPresentationOverride>>)[variantId]?.fields?.[
    fieldPath
  ];

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

function getContractStepGroup(variantId: string): ContractStepPresentationGroup {
  if (Object.values(LIGHTHOUSE_AUDIT_STEP_TYPE).includes(variantId as (typeof LIGHTHOUSE_AUDIT_STEP_TYPE)[keyof typeof LIGHTHOUSE_AUDIT_STEP_TYPE])) {
    return 'Audit Steps';
  }

  if (Object.values(AUDIT_CUSTOM_STEP_TYPE).includes(variantId as (typeof AUDIT_CUSTOM_STEP_TYPE)[keyof typeof AUDIT_CUSTOM_STEP_TYPE])) {
    return 'Custom Steps';
  }

  if (
    Object.values(PUPPETEER_REPLAY_ASSERTION_STEP_TYPE).includes(
      variantId as (typeof PUPPETEER_REPLAY_ASSERTION_STEP_TYPE)[keyof typeof PUPPETEER_REPLAY_ASSERTION_STEP_TYPE],
    )
  ) {
    return 'Assertion Steps';
  }

  if (
    Object.values(PUPPETEER_REPLAY_USER_STEP_TYPE).includes(
      variantId as (typeof PUPPETEER_REPLAY_USER_STEP_TYPE)[keyof typeof PUPPETEER_REPLAY_USER_STEP_TYPE],
    )
  ) {
    return 'Action Steps';
  }

  throw new Error(`Unsupported presentation variant "${variantId}"`);
}

function getContractStepIcon(variantId: string): ContractStepPresentationIcon {
  return getContractStepGroup(variantId) === 'Audit Steps' ? 'lighthouse-badge' : 'puppeteer-badge';
}

function humanizeToken(value: string): string {
  return value
    .replace(/\[\]/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (character) => character.toUpperCase());
}
