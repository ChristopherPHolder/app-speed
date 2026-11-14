import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

const guidance = `
Tabs switch between **peer** views of the same subject, at the same level of hierarchy.

**Rules**

- Two to six tabs, each a one- or two-word noun in sentence case.
- Tabs don't navigate away, submit, or behave like steps. For a sequence use a stepper; for filtering use chips.
- Order by importance or natural sequence and keep it stable.
- Don't nest tab groups.
- When tabs don't fit, let them scroll. Don't shrink the labels or wrap to two rows.
- Content under a tab starts with its own heading only if the tab label isn't enough.
- Use \`mat-tab-nav-bar\` when each tab is a route, so the URL and the back button work.
`;

const meta: Meta = {
  title: 'Material/Tabs',
  decorators: [moduleMetadata({ imports: [MatTabGroup, MatTab] })],
  parameters: { layout: 'padded', docs: { description: { component: guidance } } },
};

export default meta;
type Story = StoryObj;

/** Primary tabs. */
export const Default: Story = {
  render: () => ({
    template: `
      <mat-tab-group>
        <mat-tab label="Performance"><p style="padding: 16px;">Metrics and diagnostics for load performance.</p></mat-tab>
        <mat-tab label="Accessibility"><p style="padding: 16px;">Checks for accessible names, contrast and structure.</p></mat-tab>
        <mat-tab label="SEO"><p style="padding: 16px;">Checks for discoverability.</p></mat-tab>
      </mat-tab-group>
    `,
  }),
};
