import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import type { ErrorDialogModel } from './error-dialog.model';

@Component({
  selector: 'b-ui-error-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content class="mat-typography">
      <h3>Failed while validating audit details</h3>
      <pre>{{ data.message }}</pre>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="true" cdkFocusInitial>Modify</button>
    </mat-dialog-actions>
  `,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButton, MatDialogClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorDialog {
  readonly data = inject<ErrorDialogModel>(MAT_DIALOG_DATA);
}
