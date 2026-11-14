import { MatProgressBar } from '@angular/material/progress-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

const guidance = `
Show progress whenever a wait is noticeable — roughly a second or more.

| Indicator | Use it for |
| --- | --- |
| Linear, indeterminate | A page, panel or table is loading and the duration is unknown. Pin it to the top edge of the region |
| Linear, determinate | Progress is measurable: steps of an audit, an upload |
| Circular, indeterminate | A small area or a single control is busy |
| Circular, determinate | A compact measure of completion |

**Rules**

- Prefer determinate when you can measure. Don't fake it.
- One indicator per region. Never a spinner inside a card inside a page with its own bar.
- Keep the layout stable while loading: reserve the space or keep the previous content and mark the region
  \`aria-busy="true"\`.
- Pair the indicator with text in a \`role="status"\` region so it is announced: "Loading audit history…".
- A button that starts work keeps its width, is disabled while busy, and changes its label: "Starting audit…".
- Indicators use \`primary\`. Don't recolour them to show status.
`;

const meta: Meta = {
  title: 'Material/Progress',
  decorators: [moduleMetadata({ imports: [MatProgressBar, MatProgressSpinner] })],
  parameters: { layout: 'padded', docs: { description: { component: guidance } } },
};

export default meta;
type Story = StoryObj;

/** Linear indicators. */
export const Linear: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 24px; max-width: 480px;">
        <mat-progress-bar mode="indeterminate" aria-label="Loading audit history" />
        <mat-progress-bar mode="determinate" value="66" aria-label="Audit progress" />
      </div>
    `,
  }),
};

/** Circular indicator with a status message. */
export const Circular: Story = {
  render: () => ({
    template: `
      <div role="status" style="display: flex; gap: 12px; align-items: center; font: var(--mat-sys-body-medium);">
        <mat-spinner diameter="20" aria-hidden="true" />
        Loading audit history…
      </div>
    `,
  }),
};
