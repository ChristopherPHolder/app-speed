import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import type { Meta, StoryObj } from '@storybook/angular';
import { ConfirmDialogComponent, type ConfirmDialogData } from './confirm-dialog.component';

@Component({
  selector: 'ui-docs-confirm-dialog-trigger',
  imports: [MatButton],
  template: `
    <button matButton="outlined" type="button" (click)="open()">Delete project</button>
    <p role="status">{{ result() }}</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ConfirmDialogTriggerComponent {
  private readonly dialog = inject(MatDialog);
  protected readonly result = signal('');

  protected open(): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        maxWidth: 400,
        data: {
          title: 'Delete project?',
          message: "Storefront and its audit history will be removed. This can't be undone.",
          label: 'Delete project',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => this.result.set(confirmed ? 'Confirmed' : 'Dismissed'));
  }
}

const meta: Meta<ConfirmDialogTriggerComponent> = {
  title: 'Components/Confirm dialog',
  component: ConfirmDialogTriggerComponent,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Asks for confirmation before an action that cannot be undone. Open it with `MatDialog` and pass ' +
          '`ConfirmDialogData`; it closes with `true` when confirmed. The title names the action, the message says ' +
          'what is lost, and the confirm label repeats the verb from the title. Do not use it for routine actions.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<ConfirmDialogTriggerComponent>;

export const Default: Story = {};
