import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { StepField } from '../audit-builder-form';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { RxIf } from '@rx-angular/template/if';
import { ToTitleCasePipe } from '../utils/toTitleCase.pipe';

@Component({
  selector: 'ui-input-field',
  imports: [
    MatError,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    RxIf,
    ToTitleCasePipe,
  ],
  template: `
    <div>
      <mat-form-field>
        <mat-label>{{ field().name | toTitleCase }}</mat-label>
        <input matInput [type]="type()" [formControl]="field().control" />
        <mat-error *rxIf="field().control.hasError('required')">
          {{ field().name | toTitleCase }} is <strong>required</strong>
        </mat-error>
      </mat-form-field>
      @if (field().removable) {
        <button
          mat-icon-button
          [disabled]="field().control.disabled"
          aria-label="Delete property from step"
          (click)="removeRequested.emit()"
        >
          <mat-icon>delete</mat-icon>
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputFieldComponent {
  field = input.required<StepField<FormControl>>();
  removeRequested = output<void>();

  protected readonly type = computed(() => (this.field().property.inputType === 'number' ? 'number' : 'text'));
}
