import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {
  filmstripComparisonLabelError,
  type FilmstripComparisonLabelSettings,
  type TraceFilmstripSettings,
} from '@app-speed/convenience/trace/domain';
import { TraceFilmstripSettingsComponent } from './trace-filmstrip-settings.component';

export interface TraceFilmstripComparisonSettingsDialogData {
  readonly settings: TraceFilmstripSettings;
  readonly label: FilmstripComparisonLabelSettings;
  readonly durationMilliseconds: number;
}

export interface TraceFilmstripComparisonSettingsDialogResult {
  readonly settings: TraceFilmstripSettings;
  readonly label: FilmstripComparisonLabelSettings;
}

@Component({
  selector: 'lib-trace-filmstrip-comparison-settings-dialog',
  imports: [MatButton, MatDialogActions, MatDialogContent, MatDialogTitle, TraceFilmstripSettingsComponent],
  template: `
    <h2 mat-dialog-title>Advanced settings</h2>
    <mat-dialog-content>
      <lib-trace-filmstrip-settings
        [settings]="settings()"
        [durationMilliseconds]="data.durationMilliseconds"
        [comparisonLabel]="label()"
        (settingsChange)="settings.set($event)"
        (comparisonLabelChange)="label.set($event)"
      />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close()">Cancel</button>
      <button mat-flat-button type="button" [disabled]="labelInvalid()" (click)="save()">Done</button>
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
export class TraceFilmstripComparisonSettingsDialogComponent {
  protected readonly data = inject<TraceFilmstripComparisonSettingsDialogData>(MAT_DIALOG_DATA);
  protected readonly settings = signal(this.data.settings);
  protected readonly label = signal(this.data.label);
  protected readonly labelInvalid = computed(() => filmstripComparisonLabelError(this.label()) !== undefined);
  private readonly dialogRef = inject(
    MatDialogRef<TraceFilmstripComparisonSettingsDialogComponent, TraceFilmstripComparisonSettingsDialogResult>,
  );

  protected close(): void {
    this.dialogRef.close();
  }

  protected save(): void {
    if (this.labelInvalid()) return;
    this.dialogRef.close({
      settings: this.settings(),
      label: { ...this.label(), label: this.label().label.trim() },
    });
  }
}
