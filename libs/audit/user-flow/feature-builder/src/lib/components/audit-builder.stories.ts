import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { provideAuditBuilderIcons } from '@app-speed/audit/core/portal-ui/icons';
import { DEFAULT_AUDIT_DETAILS } from '../audit-details';
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
