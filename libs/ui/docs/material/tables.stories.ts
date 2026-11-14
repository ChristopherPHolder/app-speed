import { MatTableModule } from '@angular/material/table';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

const guidance = `
Tables are for data people compare across rows. If items are only scanned, a list is lighter.

**Rules**

- Use a real table: \`mat-table\` on a \`<table>\`, with \`<th scope="col">\` headers and an \`aria-label\` or caption.
- Text is start-aligned; numbers, durations and sizes are end-aligned with \`tabular-nums\` so digits line up.
- Header cells use \`label-large\` in \`on-surface-variant\`; body cells use \`body-medium\`.
- Rows are separated by an \`outline-variant\` divider. Skip zebra striping; if rows need grouping, use a
  \`surface-container\` group row.
- Row height is at least 48dp so row actions meet the target size.
- Put at most one or two icon actions at the end of a row; the rest go in a menu.
- Wide tables scroll horizontally **inside their own container**, never the page.
- In compact windows, show each row as a stacked list item instead of squeezing columns.
- Loading, empty and error states replace the body, not the whole table, so headers and filters stay put.
`;

const rows = [
  { title: 'Homepage', status: 'Succeeded', created: 'Sep 11, 2026', duration: '17.7 s' },
  { title: 'Checkout journey', status: 'Failed', created: 'Sep 2, 2026', duration: '1m 16s' },
  { title: 'Search results', status: 'Running', created: 'Sep 2, 2026', duration: '—' },
];

const meta: Meta = {
  title: 'Material/Tables',
  decorators: [moduleMetadata({ imports: [MatTableModule] })],
  parameters: { layout: 'padded', docs: { description: { component: guidance } } },
};

export default meta;
type Story = StoryObj;

/** A basic data table. */
export const Default: Story = {
  render: () => ({
    props: { rows, columns: ['title', 'status', 'created', 'duration'] },
    template: `
      <div style="overflow-x: auto; border: 1px solid var(--mat-sys-outline-variant); border-radius: var(--mat-sys-corner-medium);">
        <table mat-table [dataSource]="rows" aria-label="Audit runs">
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef scope="col">Audit</th>
            <td mat-cell *matCellDef="let row">{{ row.title }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef scope="col">Status</th>
            <td mat-cell *matCellDef="let row">{{ row.status }}</td>
          </ng-container>
          <ng-container matColumnDef="created">
            <th mat-header-cell *matHeaderCellDef scope="col">Created</th>
            <td mat-cell *matCellDef="let row">{{ row.created }}</td>
          </ng-container>
          <ng-container matColumnDef="duration">
            <th mat-header-cell *matHeaderCellDef scope="col" style="text-align: end;">Duration</th>
            <td mat-cell *matCellDef="let row" style="text-align: end; font-variant-numeric: tabular-nums;">{{ row.duration }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      </div>
    `,
  }),
};
