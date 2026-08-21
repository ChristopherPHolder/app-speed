import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import type { TraceFilmstripSettings } from '@app-speed/convenience/trace/domain';
import { TraceFilmstripSettingsComponent } from './trace-filmstrip-settings.component';

export interface TraceFilmstripSettingsDialogData {
  readonly settings: TraceFilmstripSettings;
  readonly durationMilliseconds: number;
}

@Component({
  selector: 'lib-trace-filmstrip-settings-dialog',
  imports: [MatButton, MatDialogActions, MatDialogContent, MatDialogTitle, TraceFilmstripSettingsComponent],
  template: `
    <h2 mat-dialog-title>Advanced settings</h2>
    <mat-dialog-content>
      <lib-trace-filmstrip-settings
        [settings]="settings()"
        [durationMilliseconds]="data.durationMilliseconds"
        (settingsChange)="settings.set($event)"
      />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close()">Cancel</button>
      <button mat-flat-button type="button" (click)="save()">Done</button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      width: min(720px, 82vw);
      padding-top: 8px;
    }
    lib-trace-filmstrip-settings {
      display: block;
    }
    @media (max-width: 680px) {
      mat-dialog-content {
        width: auto;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraceFilmstripSettingsDialogComponent {
  protected readonly data = inject<TraceFilmstripSettingsDialogData>(MAT_DIALOG_DATA);
  protected readonly settings = signal(this.data.settings);
  private readonly dialogRef = inject(MatDialogRef<TraceFilmstripSettingsDialogComponent>);

  protected close(): void {
    this.dialogRef.close();
  }

  protected save(): void {
    this.dialogRef.close(this.settings());
  }
}
