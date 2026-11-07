import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength, pattern, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { WorkspaceState } from './workspace-state.service';

export interface WorkspaceNameDialogData {
  readonly title: string;
  readonly name: string;
  readonly target:
    | { action: 'renameWorkspace' | 'createProject'; workspaceId: string }
    | { action: 'renameProject'; workspaceId: string; projectId: string };
}

@Component({
  selector: 'app-workspace-name-dialog',
  imports: [
    FormField,
    MatButton,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatError,
    MatFormField,
    MatLabel,
    MatInput,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <form (submit)="save($event)">
      <mat-dialog-content>
        <mat-form-field appearance="outline">
          <mat-label>{{ data.target.action === 'renameWorkspace' ? 'Workspace name' : 'Project name' }}</mat-label>
          <input matInput [formField]="nameForm.name" autocomplete="off" />
          <mat-error>Enter a name of 1–100 characters.</mat-error>
        </mat-form-field>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton mat-dialog-close type="button" [disabled]="state.saving()">Cancel</button>
        <button matButton="filled" type="submit" [disabled]="nameForm().invalid() || state.saving() || state.loading()">
          {{ data.target.action === 'createProject' ? 'Create project' : 'Save' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    mat-form-field {
      width: 100%;
      margin-top: 4px;
    }
    .error {
      color: var(--mat-sys-error);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceNameDialogComponent {
  protected readonly data = inject<WorkspaceNameDialogData>(MAT_DIALOG_DATA);
  protected readonly state = inject(WorkspaceState);
  private readonly dialog = inject(MatDialogRef<WorkspaceNameDialogComponent, boolean>);
  private readonly name = signal({ name: this.data.name });
  protected readonly nameForm = form(this.name, (fields) => {
    required(fields.name);
    maxLength(fields.name, 100);
    pattern(fields.name, /\S/);
  });
  protected readonly error = signal('');
  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.nameForm().invalid() || this.state.saving()) return;
    this.dialog.disableClose = true;
    try {
      if (await this.state.act({ ...this.data.target, name: this.name().name.trim() })) this.dialog.close(true);
      else this.error.set(this.state.error());
    } finally {
      this.dialog.disableClose = false;
    }
  }
}
