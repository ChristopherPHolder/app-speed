import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { StepProperty } from '../schema/types';

@Component({
  selector: 'builder-input-string-array',
  imports: [ReactiveFormsModule, MatIconButton, MatIcon, MatFormField, MatInput],
  template: `
    <!-- TODO Improve Styling For Input Section -->
    <!-- One potential solution is to simple add a -> icon next to the items -->
    <div>
      <!-- TODO Improve Styling For Input Section Title -->
      <h4>
        {{ schema.name }}
        <!-- TODO Add the functionality to add inputs -->
        <button
          mat-icon-button
          [disabled]="control.disabled"
          aria-label="Add property to step"
          (click)="addPropertyItem()"
        >
          <mat-icon>library_add</mat-icon>
        </button>
        @if (!schema.required) {
          <button
            mat-icon-button
            [disabled]="control.disabled"
            aria-label="Delete property from step"
            (click)="deleteProperty.emit()"
          >
            <mat-icon>delete</mat-icon>
          </button>
        }
      </h4>
      @for (propertyControl of control.controls; track control; let idx = $index) {
        <div style="display: flex;">
          <mat-icon style="padding-top: 16px;">subdirectory_arrow_right</mat-icon>
          <mat-form-field>
            <input matInput [formControl]="propertyControl" />
          </mat-form-field>
          @if (control.controls.length > 1) {
            <button
              mat-icon-button
              [disabled]="control.disabled"
              aria-label="Delete property from step"
              (click)="deletePropertyItemAt(idx)"
            >
              <mat-icon>delete</mat-icon>
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class InputStringArrayComponent {
  @Input({ required: true }) schema!: StepProperty;
  @Input({ required: true }) control!: FormArray<FormControl<string>>;
  @Output() deleteProperty = new EventEmitter<void>();

  addPropertyItem(): void {
    // TODO extract initial value from defaults
    this.control.push(new FormControl<string>('', { validators: [Validators.required], nonNullable: true }));
  }
  deletePropertyItemAt(index: number): void {
    this.control.removeAt(index);
  }
}
