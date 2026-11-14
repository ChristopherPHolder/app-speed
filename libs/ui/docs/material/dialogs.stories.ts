import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { type Meta, type StoryObj } from '@storybook/angular';

const guidance = `
A dialog interrupts. Use one only when the person must decide or provide something before continuing.

| Situation | Use |
| --- | --- |
| Confirm a destructive or irreversible action | Dialog (\`ui-confirm-dialog\`) |
| Collect a small amount of input for one task | Dialog with a short form |
| Report that something succeeded | Snackbar, not a dialog |
| Show an error tied to a field or region | Inline message, not a dialog |
| Present long or multi-step content | A page, not a dialog |

**Rules**

- Open dialogs with \`MatDialog\`. It handles focus trapping, \`Escape\`, the scrim and returning focus.
- The title is a short statement or question naming the action: "Delete project?".
- The body says what will happen in one or two sentences.
- At most two actions, aligned to the end. Dismiss first as a text button, then the confirming action as a filled
  button. The confirm label repeats the verb from the title.
- Never open a dialog from a dialog.
- In compact windows a dialog with a form should take the full width; keep it to one column.
`;

@Component({
  selector: 'ui-docs-dialog-content',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButton],
  template: `
    <h2 mat-dialog-title>Delete project?</h2>
    <mat-dialog-content>Storefront and its audit history will be removed. This can't be undone.</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton type="button" mat-dialog-close>Cancel</button>
      <button matButton="filled" type="button" [mat-dialog-close]="true">Delete project</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DialogContentComponent {}

@Component({
  selector: 'ui-docs-dialog-trigger',
  imports: [MatButton],
  template: `<button matButton="outlined" type="button" (click)="open()">Delete project</button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DialogTriggerComponent {
  private readonly dialog = inject(MatDialog);
  protected open(): void {
    this.dialog.open(DialogContentComponent, { maxWidth: 400 });
  }
}

const meta: Meta = {
  title: 'Material/Dialogs',
  parameters: { layout: 'padded', docs: { description: { component: guidance } } },
};

export default meta;
type Story = StoryObj;

/** A confirmation dialog. Open it to check focus handling. */
export const Confirmation: Story = {
  render: () => ({
    moduleMetadata: { imports: [DialogTriggerComponent] },
    template: `<ui-docs-dialog-trigger />`,
  }),
};
