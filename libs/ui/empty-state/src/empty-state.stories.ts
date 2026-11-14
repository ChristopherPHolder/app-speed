import { MatButton } from '@angular/material/button';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { EmptyStateActionsDirective, EmptyStateComponent } from './empty-state.component';

const meta: Meta<EmptyStateComponent> = {
  title: 'Components/Empty state',
  component: EmptyStateComponent,
  decorators: [moduleMetadata({ imports: [EmptyStateActionsDirective, MatButton] })],
  args: { heading: 'No audits yet', icon: 'speed' },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Replaces content that is not there. The heading says what is missing, the description says why or what ' +
          'would appear, and the projected action is the way out. Keep the surrounding structure (page header, ' +
          'filters, table header) in place so the layout does not jump when content arrives.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <ui-empty-state [heading]="heading" [icon]="icon">
        Run your first audit to see it here.
        <button uiEmptyStateActions matButton="tonal" type="button">Run audit</button>
      </ui-empty-state>
    `,
  }),
};

export default meta;
type Story = StoryObj<EmptyStateComponent>;

/** Nothing has been created yet: offer the first step. */
export const FirstUse: Story = {};

/** Nothing matches the filters: say how to widen them. */
export const NoResults: Story = {
  render: () => ({
    template: `
      <ui-empty-state heading="No audits found" icon="search_off">
        Try another title or audit ID, or change the status and outcome filters.
      </ui-empty-state>
    `,
  }),
};
