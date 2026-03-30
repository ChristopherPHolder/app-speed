import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatOption, MatOptgroup } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatSelect } from '@angular/material/select';
import { ToTitleCasePipe } from '@app-speed/audit/portal/ui';
import type { OptionsFieldModel } from './field.model';

type OptionFieldOption = NonNullable<OptionsFieldModel['property']['options']>[number];
type OptionFieldOptionGroup = Exclude<OptionFieldOption, string | boolean>;

@Component({
  selector: 'ui-options-field',
  imports: [ReactiveFormsModule, MatLabel, MatFormField, MatSelect, MatOption, MatOptgroup, MatIcon, ToTitleCasePipe],
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
export class OptionsField {
  field = input.required<OptionsFieldModel>();

  protected readonly options = computed(() => this.field().property.options ?? []);

  protected isOptionGroup(option: OptionFieldOption): option is OptionFieldOptionGroup {
    return typeof option === 'object';
  }
}
