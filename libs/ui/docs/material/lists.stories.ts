import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import {
  MatList,
  MatListItem,
  MatListItemIcon,
  MatListItemLine,
  MatListItemMeta,
  MatListItemTitle,
  MatNavList,
} from '@angular/material/list';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

const guidance = `
Lists are for scanning a set of similar items in a single column.

| Component | Use it for |
| --- | --- |
| \`mat-list\` | Read-only items: members, details |
| \`mat-nav-list\` | Items that navigate. Each item is an \`<a mat-list-item>\` |
| \`mat-action-list\` | Items that trigger an action. Each item is a \`<button mat-list-item>\` |
| \`mat-selection-list\` | Choosing one or several items |

**Rules**

- One, two or three lines per item — the same count for every item in a list.
- Leading slot: an icon, avatar or thumbnail that identifies the item. Trailing slot: metadata or a single control.
- Mark the current destination with \`[activated]\` and \`aria-current="page"\`.
- Separate groups with a divider and a \`label-medium\` group label, not items from each other.
- For data with several comparable attributes, use a table instead.
`;

const meta: Meta = {
  title: 'Material/Lists',
  decorators: [
    moduleMetadata({
      imports: [
        MatList,
        MatNavList,
        MatListItem,
        MatListItemIcon,
        MatListItemTitle,
        MatListItemLine,
        MatListItemMeta,
        MatDivider,
        MatIcon,
      ],
    }),
  ],
  parameters: { layout: 'padded', docs: { description: { component: guidance } } },
};

export default meta;
type Story = StoryObj;

/** A navigation list with the current destination activated. */
export const Navigation: Story = {
  render: () => ({
    template: `
      <mat-nav-list aria-label="Audit tools" style="max-width: 320px;">
        <a mat-list-item href="#" [activated]="true" aria-current="page" (click)="$event.preventDefault()">
          <mat-icon matListItemIcon>speed</mat-icon><span matListItemTitle>Run audit</span>
        </a>
        <a mat-list-item href="#" (click)="$event.preventDefault()">
          <mat-icon matListItemIcon>history</mat-icon><span matListItemTitle>Audit history</span>
        </a>
        <a mat-list-item href="#" (click)="$event.preventDefault()">
          <mat-icon matListItemIcon>construction</mat-icon><span matListItemTitle>Trace tools</span>
        </a>
      </mat-nav-list>
    `,
  }),
};

/** Two-line items with trailing metadata. */
export const TwoLine: Story = {
  render: () => ({
    template: `
      <mat-list aria-label="Members" style="max-width: 420px;">
        <mat-list-item>
          <mat-icon matListItemIcon>person</mat-icon>
          <span matListItemTitle>Chris</span>
          <span matListItemLine>chris@example.com</span>
          <span matListItemMeta>Admin</span>
        </mat-list-item>
        <mat-divider />
        <mat-list-item>
          <mat-icon matListItemIcon>person</mat-icon>
          <span matListItemTitle>Pat</span>
          <span matListItemLine>pat@example.com</span>
          <span matListItemMeta>Member</span>
        </mat-list-item>
      </mat-list>
    `,
  }),
};
