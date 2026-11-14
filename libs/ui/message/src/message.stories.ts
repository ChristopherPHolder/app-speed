import { MatButton } from '@angular/material/button';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { MessageActionsDirective, MessageComponent } from './message.component';

const meta: Meta<MessageComponent> = {
  title: 'Components/Message',
  component: MessageComponent,
  decorators: [moduleMetadata({ imports: [MessageActionsDirective, MatButton] })],
  argTypes: {
    tone: { control: { type: 'inline-radio' }, options: ['info', 'success', 'warning', 'error'] },
  },
  args: { tone: 'error', announce: true },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An inline message that belongs to a region: a load error above a table, a warning on a result, a note ' +
          'in a form. Place it next to the thing it is about. Say what happened and what to do next; project a ' +
          'button with `uiMessageActions` when there is a next step. Errors are announced assertively ' +
          '(`role="alert"`), other tones politely (`role="status"`); set `announce` to false for a message that is ' +
          'on the page from the start. For transient confirmations use a snackbar instead.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `<ui-message [tone]="tone" [heading]="heading" [icon]="icon" [announce]="announce">Audit history didn't load. Try again.</ui-message>`,
  }),
};

export default meta;
type Story = StoryObj<MessageComponent>;

export const Default: Story = {};

/** The four tones. */
export const Tones: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 12px; max-width: 640px;">
        <ui-message tone="info" [announce]="false">Soft navigations report a subset of categories.</ui-message>
        <ui-message tone="success" [announce]="false">Changes saved.</ui-message>
        <ui-message tone="warning" [announce]="false">The page loaded too slowly to finish within the limit. Results may be incomplete.</ui-message>
        <ui-message tone="error" [announce]="false">Audit history didn't load. Try again.</ui-message>
      </div>
    `,
  }),
};

/** With a heading and an action. */
export const WithHeadingAndAction: Story = {
  render: () => ({
    template: `
      <ui-message tone="error" heading="This audit failed" [announce]="false" style="max-width: 640px;">
        The runner couldn't reach the page. Check the URL and run it again.
        <button uiMessageActions matButton type="button">Run again</button>
      </ui-message>
    `,
  }),
};
