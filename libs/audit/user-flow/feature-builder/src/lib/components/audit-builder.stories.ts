import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { provideAuditBuilderIcons } from '@app-speed/audit/core/portal-ui/icons';
import { type AuditDetails, DEFAULT_AUDIT_DETAILS } from '../audit-details';
import { AuditBuilderComponent } from './audit-builder.component';

const meta: Meta<AuditBuilderComponent> = {
  title: 'Patterns/Audit Builder',
  component: AuditBuilderComponent,
  decorators: [applicationConfig({ providers: [provideAuditBuilderIcons()] })],
};

export default meta;
type Story = StoryObj<AuditBuilderComponent>;

export const Default: Story = {
  args: {
    initialAudit: DEFAULT_AUDIT_DETAILS,
    modifying: true,
  },
};

const READY_AUDIT = {
  ...DEFAULT_AUDIT_DETAILS,
  title: 'Checkout journey',
  steps: [
    DEFAULT_AUDIT_DETAILS.steps[0],
    { type: 'navigate', url: 'https://example.com' },
    DEFAULT_AUDIT_DETAILS.steps[2],
  ],
} as unknown as AuditDetails;

/** Everything filled in: the bar shows the step count and the action. */
export const ReadyToRun: Story = {
  args: { initialAudit: READY_AUDIT, modifying: true },
};

/** Run audit was selected with the title and the URL missing: the fields and the step are marked. */
export const BlockedRun: Story = {
  args: { initialAudit: DEFAULT_AUDIT_DETAILS, modifying: true },
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLButtonElement>('.submit-btn')?.click();
  },
};

/** The request is on its way. */
export const StartingAudit: Story = {
  args: { initialAudit: READY_AUDIT, modifying: true, submittingRequest: true },
};

/** The run was rejected: the reason sits beside the button that started it. */
export const RejectedRun: Story = {
  args: {
    initialAudit: READY_AUDIT,
    modifying: true,
    errorMessage: 'The runner is unavailable. Try again.',
  },
};

/** A finished audit, read-only, with Fork as its action. */
export const ReadOnly: Story = {
  args: { initialAudit: READY_AUDIT, modifying: false, primaryAction: 'fork', collapseSteps: true },
};

/** Every step removed: the list offers to add the first one. */
export const NoSteps: Story = {
  args: {
    modifying: true,
    initialAudit: { ...DEFAULT_AUDIT_DETAILS, title: 'Checkout journey', steps: [] } as unknown as AuditDetails,
  },
};

/** One step of every shape the form renders: scalars, flags, lists, groups and key/value properties. */
export const EveryFieldType: Story = {
  args: {
    modifying: true,
    initialAudit: {
      title: 'Checkout journey',
      device: 'mobile',
      timeout: 30000,
      steps: [
        { type: 'customStep', step: 'startNavigation', name: 'Checkout' },
        {
          type: 'navigate',
          url: 'https://example.com',
          assertedEvents: [{ type: 'navigation', title: 'Home', url: 'https://example.com' }],
        },
        {
          type: 'click',
          offsetX: 1,
          offsetY: 1,
          selectors: [{ segments: ['#checkout'] }],
          button: 'primary',
          frame: [0, 1],
        },
        {
          type: 'waitForElement',
          count: 1,
          selectors: [{ segments: ['#summary'] }],
          attributes: { 'aria-expanded': 'true' },
          operator: '>=',
          visible: true,
        },
        {
          type: 'setViewport',
          deviceScaleFactor: 1,
          hasTouch: false,
          height: 800,
          isLandscape: false,
          isMobile: true,
          width: 400,
        },
        { type: 'customStep', step: 'waitForNetworkIdle', idleTime: 500, timeout: 0, concurrency: 0 },
        { type: 'customStep', step: 'endNavigation' },
      ],
    },
  },
};
