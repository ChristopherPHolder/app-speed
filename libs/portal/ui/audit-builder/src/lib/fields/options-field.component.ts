import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatOptgroup } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { ControlContainer, FormControl, ReactiveFormsModule } from '@angular/forms';
import { StepFormGroup } from '../audit-builder-form';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ToTitleCasePipe } from '../utils/toTitleCase.pipe';
import { PropertyName, StepPropertyOption, StepPropertyOptionGroup } from '@app-speed/shared-user-flow-replay';

@Component({
  selector: 'ui-options-field',
  imports: [
    ReactiveFormsModule,
    MatLabel,
    MatFormField,
    MatSelect,
    MatOption,
    MatOptgroup,
    MatIconButton,
    MatIcon,
    ToTitleCasePipe,
  ],
  template: `
    <div>
      @if (control) {
        <mat-form-field>
          <mat-label>{{ label() | toTitleCase }}</mat-label>
          <mat-select [formControl]="control">
            @for (option of options; track option) {
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
        @if (!required) {
          <button
            mat-icon-button
            [disabled]="control.disabled"
            aria-label="Delete property from step"
            (click)="stepFromGroup.removeOptionalField(label())"
          >
            <mat-icon>delete</mat-icon>
          </button>
        }
      }
    </div>
  `,
  styles: `
    .option-group-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionsFieldComponent implements OnInit {
  label = input.required<PropertyName>();

  stepContainer = inject(ControlContainer);

  stepFromGroup!: StepFormGroup;
  control?: FormControl;
  required?: boolean;
  options!: readonly StepPropertyOption[];

  ngOnInit(): void {
    this.setupControl();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const property = this.stepFromGroup.stepProperty(this.label());
    this.required = property.required;
    this.options = property.options!;
  }

  setupControl(): void {
    if (!this.stepContainer.control) {
      return console.error('Missing Step Control', this.stepContainer, this.label());
    }
    this.stepFromGroup = this.stepContainer.control as StepFormGroup;
    const optionsControl = this.stepContainer.control.get(this.label());
    if (!optionsControl) {
      return console.error('Missing OptionsControl', this.stepContainer, this.label());
    }
    // @TODO improve this type
    this.control = optionsControl as FormControl;
  }

  protected isOptionGroup(option: StepPropertyOption): option is StepPropertyOptionGroup {
    return typeof option === 'object';
  }
}
