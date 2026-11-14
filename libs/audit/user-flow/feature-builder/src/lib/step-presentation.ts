import {
  AUDIT_CUSTOM_STEP_TYPE,
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  PUPPETEER_REPLAY_USER_STEP_TYPE,
} from '@app-speed/audit/core/domain';
import { USER_FLOW_AUDIT_BUILDER_STEP_VARIANTS, LIGHTHOUSE_AUDIT_STEP_TYPE } from '@app-speed/audit/user-flow/domain';

export type StepPresentationGroup = 'Audit steps' | 'Custom steps' | 'Assertion steps' | 'Action steps';
export type StepPresentationIcon = 'lighthouse-badge' | 'puppeteer-badge';

export type StepFieldPresentation = {
  description?: string;
  label?: string;
  /** Names one item of a list or one entry of a map: "Frame index", "Attribute". */
  itemLabel?: string;
  /** Labels for the options of an enum, keyed by the option's value. */
  options?: Record<string, string>;
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

/**
 * How a field reads wherever it appears, keyed by field path. A field means the same thing on every
 * step type that has it, so it is described once here; a step type only overrides what differs.
 */
export const STEP_FIELD_PRESENTATION: Record<string, StepFieldPresentation> = {
  assertedEvents: { itemLabel: 'Asserted event' },
  'assertedEvents[].title': { label: 'Navigation title' },
  'assertedEvents[].url': { label: 'Navigation URL' },
  attributes: { itemLabel: 'Attribute' },
  button: {
    label: 'Mouse button',
    options: {
      primary: 'Primary',
      auxiliary: 'Auxiliary',
      secondary: 'Secondary',
      back: 'Back',
      forward: 'Forward',
    },
  },
  deviceType: {
    label: 'Pointer type',
    options: { mouse: 'Mouse', pen: 'Pen', touch: 'Touch' },
  },
  download: { label: 'Download (bytes/s)' },
  duration: { label: 'Duration (ms)' },
  frame: { itemLabel: 'Frame index' },
  height: { label: 'Height (px)' },
  httpOnly: { label: 'HttpOnly' },
  latency: { label: 'Latency (ms)' },
  offsetX: { label: 'Offset X (px)' },
  offsetY: { label: 'Offset Y (px)' },
  operator: {
    label: 'Compare count',
    options: { '>=': 'At least', '==': 'Exactly', '<=': 'At most' },
  },
  properties: { itemLabel: 'Property' },
  sameSite: { label: 'SameSite' },
  target: { label: 'Target page' },
  timeout: { label: 'Timeout (ms)' },
  upload: { label: 'Upload (bytes/s)' },
  width: { label: 'Width (px)' },
  x: { label: 'Scroll X (px)' },
  y: { label: 'Scroll Y (px)' },
};

export const AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY = {
  addCookie: {
    fields: {
      url: {
        label: 'Cookie URL',
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
  waitForNetworkIdle: {
    fields: {
      idleTime: {
        label: 'Idle time (ms)',
        description: 'Duration network activity must stay within the allowed concurrency; Puppeteer default: 500 ms.',
      },
      timeout: {
        label: 'Timeout (ms)',
        description: 'Maximum wait; defaults to the audit timeout; 0 disables the timeout.',
      },
      concurrency: {
        label: 'Allowed concurrent requests',
        description: 'Maximum active request count still considered idle; Puppeteer default: 0.',
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

export const getStepFieldPresentation = (variantId: string, fieldPath: string): StepFieldPresentation | undefined => {
  const shared = STEP_FIELD_PRESENTATION[fieldPath];
  const override = (AUDIT_BUILDER_STEP_PRESENTATION_REGISTRY as Partial<Record<string, StepPresentationOverride>>)[
    variantId
  ]?.fields?.[fieldPath];

  return shared || override ? { ...shared, ...override } : undefined;
};

const STEP_GROUP_ORDER: readonly StepPresentationGroup[] = [
  'Audit steps',
  'Custom steps',
  'Assertion steps',
  'Action steps',
];

export const STEP_SELECTION_OPTIONS_GROUPED: readonly StepSelectionOptionGroup[] = STEP_GROUP_ORDER.reduce<
  StepSelectionOptionGroup[]
>((groups, group) => {
  const variants = USER_FLOW_AUDIT_BUILDER_STEP_VARIANTS.map((variant) => variant.id).filter(
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

/** Turns a schema token into a sentence-case label: `waitForElement` becomes "Wait for element". */
export function humanizeStepToken(value: string): string {
  return value
    .replace(/\[\]/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^\w/, (character) => character.toUpperCase())
    .replace(/\burl\b/gi, 'URL');
}

function getStepGroup(variantId: string): StepPresentationGroup {
  if (
    Object.values(LIGHTHOUSE_AUDIT_STEP_TYPE).includes(
      variantId as (typeof LIGHTHOUSE_AUDIT_STEP_TYPE)[keyof typeof LIGHTHOUSE_AUDIT_STEP_TYPE],
    )
  ) {
    return 'Audit steps';
  }

  if (
    Object.values(AUDIT_CUSTOM_STEP_TYPE).includes(
      variantId as (typeof AUDIT_CUSTOM_STEP_TYPE)[keyof typeof AUDIT_CUSTOM_STEP_TYPE],
    )
  ) {
    return 'Custom steps';
  }

  if (
    Object.values(PUPPETEER_REPLAY_ASSERTION_STEP_TYPE).includes(
      variantId as (typeof PUPPETEER_REPLAY_ASSERTION_STEP_TYPE)[keyof typeof PUPPETEER_REPLAY_ASSERTION_STEP_TYPE],
    )
  ) {
    return 'Assertion steps';
  }

  if (
    Object.values(PUPPETEER_REPLAY_USER_STEP_TYPE).includes(
      variantId as (typeof PUPPETEER_REPLAY_USER_STEP_TYPE)[keyof typeof PUPPETEER_REPLAY_USER_STEP_TYPE],
    )
  ) {
    return 'Action steps';
  }

  throw new Error(`Unsupported presentation variant "${variantId}"`);
}

function getStepIcon(variantId: string): StepPresentationIcon {
  return getStepGroup(variantId) === 'Audit steps' ? 'lighthouse-badge' : 'puppeteer-badge';
}
