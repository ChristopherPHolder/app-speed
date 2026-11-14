import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { PageHeaderComponent } from '@app-speed/ui/page-header';
import { PageComponent } from './page.component';

const meta: Meta<PageComponent> = {
  title: 'Components/Page',
  component: PageComponent,
  decorators: [moduleMetadata({ imports: [PageHeaderComponent] })],
  argTypes: {
    width: { control: { type: 'inline-radio' }, options: ['narrow', 'medium', 'wide', 'full'] },
  },
  args: { width: 'wide' },
  parameters: {
    docs: {
      description: {
        component:
          'The centred content column of a page. It applies the page gutter for the window size class and caps the ' +
          'width, so features never set their own. Use `narrow` for reading and single-column forms, `medium` for ' +
          'builders and settings, `wide` for tables and galleries, and `full` only for content that scrolls ' +
          'horizontally by nature. Put one inside the shell `<main>` — never a second `<main>`.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <ui-page [width]="width">
        <ui-page-header heading="Audit history" description="Your audit runs, progress and results." />
        <div style="height: 160px; border-radius: var(--mat-sys-corner-medium); background: var(--mat-sys-surface-container-high);"></div>
      </ui-page>
    `,
  }),
};

export default meta;
type Story = StoryObj<PageComponent>;

export const Wide: Story = {};
export const Medium: Story = { args: { width: 'medium' } };
export const Narrow: Story = { args: { width: 'narrow' } };
