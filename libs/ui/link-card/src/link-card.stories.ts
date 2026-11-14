import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { LinkCardComponent } from './link-card.component';

const meta: Meta<LinkCardComponent> = {
  title: 'Components/Link card',
  component: LinkCardComponent,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  args: {
    link: '/audits/user-flow',
    icon: 'speed',
    heading: 'Run an audit',
    action: 'Create audit',
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A card that navigates. The whole surface is a single link, so it holds no other interactive content. ' +
          'Hover, focus and press show a state layer; the card does not move or gain a shadow. Lay several out in a ' +
          'grid — they stretch to equal height.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <ui-link-card [link]="link" [icon]="icon" [heading]="heading" [action]="action" [overline]="overline" style="max-width: 360px;">
        Measure a complete user journey with a repeatable sequence of browser steps.
      </ui-link-card>
    `,
  }),
};

export default meta;
type Story = StoryObj<LinkCardComponent>;

export const Default: Story = {};

export const WithOverline: Story = {
  args: {
    overline: 'Captured frames',
    icon: 'photo_library',
    heading: 'Extract screenshots',
    action: 'Open extractor',
  },
};

/** Cards in a grid share the row height. */
export const Grid: Story = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr)); gap: 16px;">
        <ui-link-card link="/audits/user-flow" icon="speed" heading="Run an audit" action="Create audit">
          Measure a complete user journey with a repeatable sequence of browser steps.
        </ui-link-card>
        <ui-link-card link="/audits/history" icon="history" heading="Review history" action="View history">
          Track scheduled, running and completed audits.
        </ui-link-card>
        <ui-link-card link="/convenience" icon="construction" heading="Use trace tools" action="Explore tools">
          Extract screenshots and build filmstrips from Chrome traces locally.
        </ui-link-card>
      </div>
    `,
    moduleMetadata: { imports: [LinkCardComponent] },
  }),
};
