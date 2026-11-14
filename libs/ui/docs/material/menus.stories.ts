import { MatIconButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

const guidance = `
A menu holds the secondary actions for one item, opened from a button.

**Rules**

- The trigger is usually an icon button with \`more_vert\` and an \`aria-label\` naming the item: "Actions for step 2".
- Place the trigger at the trailing end of the row or header it belongs to, aligned with that header — not floating
  over the content below.
- Items are verbs in sentence case: "Add step before", "Remove step".
- Order by frequency. Put destructive items last, after a divider.
- A leading icon is optional; if one item has it, all do.
- Two or fewer actions don't need a menu — show them as buttons.
- Don't put the primary action of a view in a menu.
`;

const meta: Meta = {
  title: 'Material/Menus',
  decorators: [moduleMetadata({ imports: [MatMenu, MatMenuItem, MatMenuTrigger, MatIconButton, MatIcon, MatDivider] })],
  parameters: { layout: 'padded', docs: { description: { component: guidance } } },
};

export default meta;
type Story = StoryObj;

/** An overflow menu on a row. */
export const Overflow: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; justify-content: space-between; max-width: 420px; padding: 8px 8px 8px 16px; border: 1px solid var(--mat-sys-outline-variant); border-radius: var(--mat-sys-corner-medium);">
        <span style="font: var(--mat-sys-title-medium);">Step 2 · Navigate</span>
        <button matIconButton type="button" [matMenuTriggerFor]="menu" aria-label="Actions for step 2">
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #menu="matMenu" xPosition="before">
          <button mat-menu-item type="button"><mat-icon aria-hidden="true">vertical_align_top</mat-icon><span>Add step before</span></button>
          <button mat-menu-item type="button"><mat-icon aria-hidden="true">vertical_align_bottom</mat-icon><span>Add step after</span></button>
          <mat-divider />
          <button mat-menu-item type="button"><mat-icon aria-hidden="true">delete</mat-icon><span>Remove step</span></button>
        </mat-menu>
      </div>
    `,
  }),
};
