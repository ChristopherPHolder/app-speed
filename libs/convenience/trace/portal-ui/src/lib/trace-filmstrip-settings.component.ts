import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatError, MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import {
  comparisonLabelMaximumLength,
  filmstripComparisonLabelError,
  type FilmstripComparisonLabelSettings,
  type TraceFilmstripSettings,
} from '@app-speed/convenience/trace/domain';

@Component({
  selector: 'lib-trace-filmstrip-settings',
  imports: [MatCheckbox, MatError, MatFormField, MatHint, MatInput, MatLabel, MatSlideToggle],
  template: `
    <section class="settings" aria-label="Filmstrip settings">
      <div class="settings__grid">
        <div class="setting">
          <mat-slide-toggle
            [checked]="settings().useFixedInterval"
            (change)="patch({ useFixedInterval: $event.checked })"
            >Fixed intervals</mat-slide-toggle
          >
          <span>Use the most recent captured frame at every interval.</span>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Interval</mat-label>
          <input
            matInput
            type="number"
            min="10"
            max="2000"
            step="10"
            [disabled]="!settings().useFixedInterval"
            [value]="settings().intervalMilliseconds"
            (change)="setNumber('intervalMilliseconds', $event, 10, 2000, 10)"
          />
          <span matTextSuffix>ms</span>
          <mat-hint>10–2,000 ms</mat-hint>
        </mat-form-field>
        <div class="setting">
          <mat-slide-toggle [checked]="settings().useTimeRange" (change)="patch({ useTimeRange: $event.checked })"
            >Time range</mat-slide-toggle
          >
          <span>Offsets are measured from the first screenshot.</span>
        </div>
        <div class="range">
          <mat-form-field appearance="outline">
            <mat-label>Start</mat-label>
            <input
              matInput
              type="number"
              min="0"
              [max]="settings().endMilliseconds"
              [disabled]="!settings().useTimeRange"
              [value]="settings().startMilliseconds"
              (change)="setStart($event)"
            />
            <span matTextSuffix>ms</span>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>End</mat-label>
            <input
              matInput
              type="number"
              [min]="settings().startMilliseconds"
              [max]="durationMilliseconds()"
              [disabled]="!settings().useTimeRange"
              [value]="settings().endMilliseconds"
              (change)="setEnd($event)"
            />
            <span matTextSuffix>ms</span>
          </mat-form-field>
        </div>
        <mat-checkbox [checked]="settings().showTimestamps" (change)="patch({ showTimestamps: $event.checked })">
          Show timestamps in the strip and PNG
        </mat-checkbox>
        <mat-form-field appearance="outline">
          <mat-label>PNG image height</mat-label>
          <input
            matInput
            type="number"
            min="1"
            max="4000"
            step="1"
            [value]="settings().imageHeight"
            (change)="setNumber('imageHeight', $event, 1, 4000, 1)"
          />
          <span matTextSuffix>px</span>
        </mat-form-field>
      </div>
      @if (comparisonLabel(); as label) {
        <div class="comparison-label">
          <h3>Comparison label</h3>
          <mat-checkbox [checked]="label.includeLabel" (change)="patchLabel({ includeLabel: $event.checked })">
            Include label in comparison
          </mat-checkbox>
          <mat-form-field appearance="outline">
            <mat-label>Comparison label</mat-label>
            <input
              matInput
              type="text"
              [disabled]="!label.includeLabel"
              [required]="label.includeLabel"
              [attr.maxlength]="labelMaximumLength"
              [value]="label.label"
              [attr.aria-invalid]="labelError() ? 'true' : null"
              (input)="setLabel($event)"
            />
            <mat-hint align="end">{{ label.label.length }}/{{ labelMaximumLength }}</mat-hint>
            @if (labelError(); as error) {
              <mat-error>{{ error }}</mat-error>
            }
          </mat-form-field>
        </div>
      }
    </section>
  `,
  styles: `
    .settings {
      padding: 4px 0;
    }
    .settings__grid {
      display: grid;
      grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr);
      gap: 14px 24px;
      align-items: start;
    }
    .setting {
      display: grid;
      gap: 3px;
    }
    .setting span {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
    .range {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    mat-form-field {
      width: 100%;
    }
    .comparison-label {
      display: grid;
      margin-top: 22px;
      padding-top: 20px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      gap: 14px;
    }
    .comparison-label h3 {
      margin: 0;
      font: var(--mat-sys-title-medium);
    }
    @media (max-width: 680px) {
      .settings__grid,
      .range {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraceFilmstripSettingsComponent {
  readonly settings = input.required<TraceFilmstripSettings>();
  readonly durationMilliseconds = input.required<number>();
  readonly settingsChange = output<TraceFilmstripSettings>();
  readonly comparisonLabel = input<FilmstripComparisonLabelSettings>();
  readonly comparisonLabelChange = output<FilmstripComparisonLabelSettings>();
  protected readonly labelMaximumLength = comparisonLabelMaximumLength;

  protected patch(changes: Partial<TraceFilmstripSettings>): void {
    this.settingsChange.emit({ ...this.settings(), ...changes });
  }

  protected setStart(event: Event): void {
    this.setNumber('startMilliseconds', event, 0, this.settings().endMilliseconds, 1);
  }

  protected setEnd(event: Event): void {
    this.setNumber('endMilliseconds', event, this.settings().startMilliseconds, this.durationMilliseconds(), 1);
  }

  protected labelError(): string | undefined {
    const label = this.comparisonLabel();
    return label ? filmstripComparisonLabelError(label) : undefined;
  }

  protected patchLabel(changes: Partial<FilmstripComparisonLabelSettings>): void {
    const label = this.comparisonLabel();
    if (label) this.comparisonLabelChange.emit({ ...label, ...changes });
  }

  protected setLabel(event: Event): void {
    const target = event.currentTarget;
    if (target instanceof HTMLInputElement) this.patchLabel({ label: target.value });
  }

  protected setNumber(
    key: 'intervalMilliseconds' | 'startMilliseconds' | 'endMilliseconds' | 'imageHeight',
    event: Event,
    minimum: number,
    maximum: number,
    step: number,
  ): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) return;
    const raw = Number(target.value);
    if (!Number.isFinite(raw)) return;
    const value = Math.min(maximum, Math.max(minimum, Math.round(raw / step) * step));
    this.patch({ [key]: value });
  }
}
