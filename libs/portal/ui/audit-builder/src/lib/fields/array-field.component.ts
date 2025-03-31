import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { ControlContainer, FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { StepFormGroup } from '../audit-builder-form';
import { ToTitleCasePipe } from '../utils/toTitleCase.pipe';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { PropertyName } from '@app-speed/shared-user-flow-replay';

@Component({
  selector: 'ui-array-field',
  template: `
    <div>
      <h4>
        {{ label() | toTitleCase }}
        <button mat-icon-button [disabled]="control.disabled" aria-label="Add property to step" (click)="addControl()">
          <mat-icon>library_add</mat-icon>
        </button>
      </h4>
      @for (propertyControl of control.controls; track control) {
        <div style="display: flex;">
          <mat-icon style="padding-top: 16px;">subdirectory_arrow_right</mat-icon>
          <mat-form-field>
            <input matInput [formControl]="propertyControl" />
          </mat-form-field>
          @if (!(required && control.controls.length === 1)) {
            <button
              mat-icon-button
              [disabled]="control.disabled"
              aria-label="Delete property from step"
              (click)="removeControl($index)"
            >
              <mat-icon>delete</mat-icon>
            </button>
          }
        </div>
      }
    </div>
  `,
  imports: [ToTitleCasePipe, MatIconButton, MatIcon, MatFormField, MatInput, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArrayFieldComponent implements OnInit {
  label = input.required<PropertyName>();

  stepContainer = inject(ControlContainer);

  stepFromGroup!: StepFormGroup;
  control!: FormArray<FormControl<string>>;
  required?: boolean;
  options!: string[];
  type!: string;

  ngOnInit(): void {
    this.stepFromGroup = this.stepContainer.control as StepFormGroup;
    this.control = this.stepContainer.control!.get(this.label()) as FormArray<FormControl<string>>;

    const property = this.stepFromGroup.stepProperty(this.label());
    this.type = property.inputType;
    this.required = property.required;
  }

  addControl(): void {
    this.control.insert(
      this.control.controls.length - 1,
      new FormControl<string>('', {
        validators: [Validators.required, Validators.minLength(1)],
        nonNullable: true,
      }),
    );
  }

  removeControl(index: number): void {
    if (this.control.controls.length === 1) {
      this.stepFromGroup.removeOptionalField(this.label());
    } else {
      this.control.removeAt(index);
    }
  }
}
