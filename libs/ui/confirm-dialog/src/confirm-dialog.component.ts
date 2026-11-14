import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

export interface ConfirmDialogData {
  /** A short statement or question naming the action. */
  readonly title: string;
  /** What will happen, in a sentence or two. */
  readonly message: string;
  /** The confirm button's label. Repeat the verb from the title. */
  readonly label: string;
  /** Defaults to "Cancel". */
  readonly cancelLabel?: string;
}

/**
 * Asks for confirmation before an action that can't be undone. Open it with `MatDialog`; it closes
 * with `true` when confirmed and `undefined` when dismissed.
 */
@Component({
  selector: 'ui-confirm-dialog',
  imports: [MatButton, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close type="button">{{ data.cancelLabel ?? 'Cancel' }}</button>
      <button matButton="filled" [mat-dialog-close]="true" type="button">{{ data.label }}</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
