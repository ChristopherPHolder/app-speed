import {
  AUDIT_BUILDER_STEP_VARIANTS,
  AUDIT_CUSTOM_STEP_TYPE,
  LIGHTHOUSE_AUDIT_STEP_TYPE,
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  PUPPETEER_REPLAY_USER_STEP_TYPE,
} from '@app-speed/audit/domain';

export type StepPresentationGroup = 'Audit Steps' | 'Custom Steps' | 'Assertion Steps' | 'Action Steps';
export type StepPresentationIcon = 'lighthouse-badge' | 'puppeteer-badge';

export type StepFieldPresentation = {
  description?: string;
  label?: string;
};

export type StepPresentation = {
  fields?: Record<string, StepFieldPresentation>;
  group: StepPresentationGroup;
  icon: StepPresentationIcon;
  label: string;
};

export type StepSelectionOptionGroup = {
  icon: StepPresentationIcon;
  label: StepPresentationGroup;
  options: readonly string[];
};

type StepPresentationOverride = {
  fields?: Record<string, StepFieldPresentation>;
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
  waitForTime: {
    fields: {
      seconds: {
        label: 'Seconds',
        description: 'Duration to wait before the next step.',
      },
    },
  },
} as const satisfies Partial<Record<string, StepPresentationOverride>>;

export const getStepPresentation = (variantId: string): StepPresentation => {
  const override = (AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY as Partial<Record<string, StepPresentationOverride>>)[
    variantId
  ];

  return {
    group: getStepGroup(variantId),
    icon: getStepIcon(variantId),
    label: override?.label ?? humanizeStepToken(variantId),
    fields: override?.fields,
  };
};

export const getStepFieldPresentation = (variantId: string, fieldPath: string): StepFieldPresentation | undefined =>
  (AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY as Partial<Record<string, StepPresentationOverride>>)[variantId]?.fields?.[
    fieldPath
  ];

const STEP_GROUP_ORDER: readonly StepPresentationGroup[] = [
  'Audit Steps',
  'Custom Steps',
  'Assertion Steps',
  'Action Steps',
];

export const STEP_SELECTION_OPTIONS_GROUPED: readonly StepSelectionOptionGroup[] = STEP_GROUP_ORDER.reduce<
  StepSelectionOptionGroup[]
>((groups, group) => {
  const variants = AUDIT_BUILDER_STEP_VARIANTS.map((variant) => variant.id).filter(
    (variantId) => getStepPresentation(variantId).group === group,
  );

  if (variants.length === 0) {
    return groups;
  }

  groups.push({
    label: group,
    icon: getStepPresentation(variants[0] ?? '').icon,
    options: variants,
  });

  return groups;
}, []);

export function humanizeStepToken(value: string): string {
  return value
    .replace(/\[\]/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (character) => character.toUpperCase());
}

function getStepGroup(variantId: string): StepPresentationGroup {
  if (
    Object.values(LIGHTHOUSE_AUDIT_STEP_TYPE).includes(
      variantId as (typeof LIGHTHOUSE_AUDIT_STEP_TYPE)[keyof typeof LIGHTHOUSE_AUDIT_STEP_TYPE],
    )
  ) {
    return 'Audit Steps';
  }

  if (
    Object.values(AUDIT_CUSTOM_STEP_TYPE).includes(
      variantId as (typeof AUDIT_CUSTOM_STEP_TYPE)[keyof typeof AUDIT_CUSTOM_STEP_TYPE],
    )
  ) {
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

function getStepIcon(variantId: string): StepPresentationIcon {
  return getStepGroup(variantId) === 'Audit Steps' ? 'lighthouse-badge' : 'puppeteer-badge';
}
