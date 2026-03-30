import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ToTitleCasePipe } from '@app-speed/audit/portal/ui';
import type { InputFieldModel } from './field.model';

@Component({
  selector: 'b-ui-input-field',
  imports: [MatError, MatFormField, MatInput, MatLabel, ReactiveFormsModule, ToTitleCasePipe],
  template: `
    <div class="field-row">
      <mat-form-field>
        <mat-label>{{ field().name | toTitleCase }}</mat-label>
        <input matInput [type]="type()" [formControl]="field().control" />
        @if (field().control.hasError('required')) {
          <mat-error>{{ field().name | toTitleCase }} is <strong>required</strong></mat-error>
        }
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
export class InputField {
  field = input.required<InputFieldModel>();

  protected readonly type = computed(() => (this.field().property.inputType === 'number' ? 'number' : 'text'));
}
