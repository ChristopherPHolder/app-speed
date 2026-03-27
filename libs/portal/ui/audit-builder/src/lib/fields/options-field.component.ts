import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatOptgroup } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { StepField } from '../audit-builder-form';
import { MatIcon } from '@angular/material/icon';
import { ToTitleCasePipe } from '../utils/toTitleCase.pipe';
import { StepPropertyOption, StepPropertyOptionGroup } from '@app-speed/shared-user-flow-replay';

@Component({
  selector: 'ui-options-field',
  imports: [
    ReactiveFormsModule,
    MatLabel,
    MatFormField,
    MatSelect,
    MatOption,
    MatOptgroup,
    MatIcon,
    ToTitleCasePipe,
  ],
  template: `
    <div class="field-row">
      <mat-form-field>
        <mat-label>{{ field().name | toTitleCase }}</mat-label>
        <mat-select [formControl]="field().control">
          @for (option of options(); track option) {
            @if (isOptionGroup(option)) {
              <mat-optgroup>
                <span class="option-group-label">
                  <mat-icon [svgIcon]="option.icon" aria-hidden="true" />
                  <span>{{ option.label }}</span>
                </span>
                @for (groupOption of option.options; track groupOption) {
                  <mat-option [value]="groupOption">{{ groupOption }}</mat-option>
                }
              </mat-optgroup>
            } @else {
              <mat-option [value]="option">{{ option }}</mat-option>
            }
          }
        </mat-select>
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

    .option-group-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionsFieldComponent {
  field = input.required<StepField<FormControl>>();

  protected readonly options = computed(() => this.field().property.options ?? []);

  protected isOptionGroup(option: StepPropertyOption): option is StepPropertyOptionGroup {
    return typeof option === 'object';
  }
}
