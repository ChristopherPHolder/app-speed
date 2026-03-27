import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { StepField } from '../audit-builder-form';
import { ToTitleCasePipe } from '../utils/toTitleCase.pipe';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'ui-array-field',
  template: `
    <div>
      <h4>
        {{ field().name | toTitleCase }}
        <button
          mat-icon-button
          [disabled]="field().control.disabled"
          aria-label="Add property to step"
          (click)="addControl()"
        >
          <mat-icon>library_add</mat-icon>
        </button>
      </h4>
      @for (propertyControl of field().control.controls; track propertyControl) {
        <div style="display: flex;">
          <mat-icon style="padding-top: 16px;">subdirectory_arrow_right</mat-icon>
          <mat-form-field>
            <input matInput [formControl]="propertyControl" />
          </mat-form-field>
          @if (!(field().property.required && field().control.controls.length === 1)) {
            <button
              mat-icon-button
              [disabled]="field().control.disabled"
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
export class ArrayFieldComponent {
  field = input.required<StepField<FormArray<FormControl<string>>>>();
  removeRequested = output<void>();

  addControl(): void {
    this.field().control.insert(
      this.field().control.controls.length - 1,
      new FormControl<string>('', {
        validators: [Validators.required, Validators.minLength(1)],
        nonNullable: true,
      }),
    );
  }

  removeControl(index: number): void {
    if (this.field().control.controls.length === 1) {
      this.removeRequested.emit();
    } else {
      this.field().control.removeAt(index);
    }
  }
}
