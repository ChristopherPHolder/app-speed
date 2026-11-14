import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatBadge } from '@angular/material/badge';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

const guidance = `
Pick the lightest feedback that fits.

| Component | Use it for | Don't use it for |
| --- | --- | --- |
| Snackbar | Confirming a completed action: "Audit ID copied", "Changes saved". At most one action, such as Undo | Errors that need a decision; anything people must read |
| Tooltip | Naming an icon-only control or showing a truncated value in full | Essential information — it isn't available on touch |
| Badge | A small count or dot on an icon | Status of a row (use \`ui-status-chip\`) |
| Inline message (\`ui-message\`) | Errors, warnings and notes that belong to a region | Transient confirmations |
| Dialog | Decisions that block progress | Anything else |

**Rules**

- Snackbars are short (one line), appear at the bottom, and dismiss themselves after 4–10 seconds. They never stack.
- A snackbar message is announced politely; don't also render it elsewhere.
- Tooltips are plain text, a few words, with no interactive content.
- Feedback states what happened. Avoid "Success!" and "Error".
`;

@Component({
  selector: 'ui-docs-snackbar-trigger',
  imports: [MatButton],
  template: `<button matButton="outlined" type="button" (click)="open()">Copy audit ID</button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SnackbarTriggerComponent {
  private readonly snackBar = inject(MatSnackBar);
  protected open(): void {
    this.snackBar.open('Audit ID copied', undefined, { duration: 4000 });
  }
}

const meta: Meta = {
  title: 'Material/Feedback',
  decorators: [moduleMetadata({ imports: [SnackbarTriggerComponent, MatTooltip, MatBadge, MatIconButton, MatIcon] })],
  parameters: { layout: 'padded', docs: { description: { component: guidance } } },
};

export default meta;
type Story = StoryObj;

/** A confirmation snackbar. */
export const Snackbar: Story = {
  render: () => ({ template: `<ui-docs-snackbar-trigger />` }),
};

/** A tooltip naming an icon-only button. */
export const Tooltip: Story = {
  render: () => ({
    template: `
      <button matIconButton type="button" matTooltip="Refresh" aria-label="Refresh audit history">
        <mat-icon>refresh</mat-icon>
      </button>
    `,
  }),
};

/** A badge with a count. */
export const Badge: Story = {
  render: () => ({
    template: `
      <button matIconButton type="button" aria-label="Invitations, 2 pending">
        <mat-icon matBadge="2" aria-hidden="false">mail</mat-icon>
      </button>
    `,
  }),
};
