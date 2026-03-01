import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { ControlContainer, FormControl, ReactiveFormsModule } from '@angular/forms';
import { StepFormGroup } from '../audit-builder-form';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { RxIf } from '@rx-angular/template/if';
import { ToTitleCasePipe } from '../utils/toTitleCase.pipe';
import { PropertyName } from '@app-speed/shared-user-flow-replay';

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
        <mat-label>{{ label() | toTitleCase }}</mat-label>
        <input matInput [type]="type" [formControl]="control" />
        <mat-error *rxIf="control.hasError('required')">
          {{ label() | toTitleCase }} is <strong>required</strong>
        </mat-error>
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
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputFieldComponent implements OnInit {
  label = input.required<PropertyName>();

  stepContainer = inject(ControlContainer);

  stepFromGroup!: StepFormGroup;
  control!: FormControl;
  required?: boolean;
  options!: string[];
  type!: string;

  ngOnInit(): void {
    this.stepFromGroup = this.stepContainer.control as StepFormGroup;
    this.control = this.stepContainer.control!.get(this.label()) as FormControl;

    const property = this.stepFromGroup.stepProperty(this.label());
    this.type = property.inputType;
    this.required = property.required;
  }
}
