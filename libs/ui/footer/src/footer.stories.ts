import { MatAnchor, MatButton } from '@angular/material/button';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { FooterComponent, FooterLinkDirective } from './footer.component';

const meta: Meta<FooterComponent> = {
  title: 'Components/Footer',
  component: FooterComponent,
  decorators: [moduleMetadata({ imports: [FooterLinkDirective, MatAnchor, MatButton] })],
  args: { navigationLabel: 'Legal' },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The site footer, shown on every page after `<main>`. Project each link with `uiFooterLink` on a ' +
          'Material text button, so links and actions such as cookie settings share the same states and target ' +
          'size. Content without a slot becomes the note under the links. The links wrap in compact windows.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<FooterComponent>;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-footer [navigationLabel]="navigationLabel">
        <a uiFooterLink matButton href="#legal-notice">Legal notice</a>
        <a uiFooterLink matButton href="#privacy">Privacy policy</a>
        <a uiFooterLink matButton href="#terms">Terms of service</a>
        <button uiFooterLink matButton type="button">Cookie settings</button>
        <a uiFooterLink matButton href="mailto:jane@example.com">Contact</a>
        <span>Made by Jane Example</span>
      </ui-footer>
    `,
  }),
};

/** Without a note the footer shows only its links. */
export const LinksOnly: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-footer [navigationLabel]="navigationLabel">
        <a uiFooterLink matButton href="#privacy">Privacy policy</a>
        <a uiFooterLink matButton href="#terms">Terms of service</a>
      </ui-footer>
    `,
  }),
};

/** In a compact window the links wrap onto several centred rows. */
export const Compact: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 360px">
        <ui-footer [navigationLabel]="navigationLabel">
          <a uiFooterLink matButton href="#legal-notice">Legal notice</a>
          <a uiFooterLink matButton href="#privacy">Privacy policy</a>
          <a uiFooterLink matButton href="#terms">Terms of service</a>
          <button uiFooterLink matButton type="button">Cookie settings</button>
          <a uiFooterLink matButton href="mailto:jane@example.com">Contact</a>
          <span>Made by Jane Example</span>
        </ui-footer>
      </div>
    `,
  }),
};
