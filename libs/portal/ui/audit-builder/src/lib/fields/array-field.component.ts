import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
    <div class="array-field">
      <div class="array-field__header">
        <h4>{{ field().name | toTitleCase }}</h4>
        <div class="array-field__actions">
          <button
            mat-icon-button
            [disabled]="field().control.disabled"
            aria-label="Add property to step"
            type="button"
            (click)="addControl()"
          >
            <mat-icon>library_add</mat-icon>
          </button>
          <ng-content select="[field-action]" />
        </div>
      </div>
      @for (propertyControl of field().control.controls; track propertyControl) {
        <div style="display: flex;">
          <mat-icon style="padding-top: 16px;">subdirectory_arrow_right</mat-icon>
          <mat-form-field>
            <input matInput [formControl]="propertyControl" />
          </mat-form-field>
          @if (field().control.controls.length > 1) {
            <button
              mat-icon-button
              [disabled]="field().control.disabled"
              aria-label="Delete property from step"
              type="button"
              (click)="removeControl($index)"
            >
              <mat-icon>delete</mat-icon>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .array-field {
      display: grid;
      gap: 8px;
    }

    .array-field__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .array-field__actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    h4 {
      margin: 0;
    }
  `,
  imports: [ToTitleCasePipe, MatIconButton, MatIcon, MatFormField, MatInput, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArrayFieldComponent {
  field = input.required<StepField<FormArray<FormControl<string>>>>();

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
    this.field().control.removeAt(index);
  }
}
