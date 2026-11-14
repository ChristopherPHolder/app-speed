import { MatChip, MatChipListbox, MatChipOption, MatChipSet } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

const guidance = `
Chips are compact, and each kind has one job.

| Kind | Component | Use it for |
| --- | --- | --- |
| Filter | \`mat-chip-listbox\` + \`mat-chip-option\` | Narrowing a list. Single-select for mutually exclusive values, \`multiple\` otherwise |
| Assist | \`mat-chip-set\` + \`mat-chip\` | A contextual shortcut related to the content |
| Input | \`mat-chip-grid\` + \`mat-chip-row\` | Discrete values entered in a field: tags, recipients |
| Suggestion | \`mat-chip-listbox\` | Offering likely next inputs |

**Rules**

- Filter chips show their own selected state (a check mark and a tonal fill). Don't draw it with \`✓\` or \`+\`.
- Give every chip group an \`aria-label\` that says what it filters.
- A chip is not a status indicator and not a button. For status use \`ui-status-chip\`; for actions use a button.
- Keep labels to one or two words. Let chips wrap; don't truncate them.
- A multi-select filter that must keep at least one value should say so when the last one is removed, not silently
  ignore the click.
`;

const meta: Meta = {
  title: 'Material/Chips',
  decorators: [moduleMetadata({ imports: [MatChip, MatChipSet, MatChipListbox, MatChipOption, MatIcon] })],
  parameters: { layout: 'padded', docs: { description: { component: guidance } } },
};

export default meta;
type Story = StoryObj;

/** Single-select filter. */
export const FilterSingle: Story = {
  render: () => ({
    template: `
      <mat-chip-listbox aria-label="Filter by outcome">
        <mat-chip-option selected>All</mat-chip-option>
        <mat-chip-option>Succeeded</mat-chip-option>
        <mat-chip-option>Failed</mat-chip-option>
      </mat-chip-listbox>
    `,
  }),
};

/** Multi-select filter. */
export const FilterMultiple: Story = {
  render: () => ({
    template: `
      <mat-chip-listbox multiple aria-label="Filter by run status">
        <mat-chip-option selected>Queued</mat-chip-option>
        <mat-chip-option selected>Running</mat-chip-option>
        <mat-chip-option>Completed</mat-chip-option>
      </mat-chip-listbox>
    `,
  }),
};

/** Assist chips. */
export const Assist: Story = {
  render: () => ({
    template: `
      <mat-chip-set aria-label="Suggested actions">
        <mat-chip><mat-icon matChipAvatar aria-hidden="true">add</mat-icon>Timeout</mat-chip>
        <mat-chip><mat-icon matChipAvatar aria-hidden="true">add</mat-icon>Target</mat-chip>
      </mat-chip-set>
    `,
  }),
};
