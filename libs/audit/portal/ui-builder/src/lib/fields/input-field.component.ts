import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { StepField } from '../audit-builder-form';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RxIf } from '@rx-angular/template/if';
import { ToTitleCasePipe } from '../utils/toTitleCase.pipe';

@Component({
  selector: 'ui-input-field',
  imports: [
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    RxIf,
    ToTitleCasePipe,
  ],
  template: `
    <div class="field-row">
      <mat-form-field>
        <mat-label>{{ field().name | toTitleCase }}</mat-label>
        <input matInput [type]="type()" [formControl]="field().control" />
        <mat-error *rxIf="field().control.hasError('required')">
          {{ field().name | toTitleCase }} is <strong>required</strong>
        </mat-error>
      </mat-form-field>
      <ng-content select="[field-action]" />
    </div>
  `,
  styles: `
    .field-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputFieldComponent {
  field = input.required<StepField<FormControl>>();

  protected readonly type = computed(() => (this.field().property.inputType === 'number' ? 'number' : 'text'));
}
