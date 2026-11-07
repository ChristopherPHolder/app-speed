import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

export interface WorkspaceConfirmDialogData {
  readonly title: string;
  readonly message: string;
  readonly label: string;
}

@Component({
  selector: 'app-workspace-confirm-dialog',
  imports: [MatButton, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close type="button">Cancel</button>
      <button matButton="filled" [mat-dialog-close]="true" type="button">{{ data.label }}</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceConfirmDialogComponent {
  protected readonly data = inject<WorkspaceConfirmDialogData>(MAT_DIALOG_DATA);
}
