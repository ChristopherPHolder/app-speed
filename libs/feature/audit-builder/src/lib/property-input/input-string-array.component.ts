import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { StepProperty } from '../schema/audit-builder.types';

@Component({
  selector: 'lib-input-string-array',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `
    <!-- TODO Improve Styling For Input Section -->
    <!-- One potential solution is to simple add a -> icon next to the items -->
    <div>
      <!-- TODO Improve Styling For Input Section Title -->
      <h4>
        {{ schema.name }}
        @if (!schema.required) {
          <!-- TODO Add the functionality to add inputs -->
          <button mat-icon-button aria-label="Add property to step">
            <mat-icon>library_add</mat-icon>
          </button>
          <button mat-icon-button aria-label="Delete property from step" (click)='deleteProperty.emit()'>
            <mat-icon>delete</mat-icon>
          </button>
        }
      </h4>
      @for (control of control.controls; track control) {
        <mat-icon>subdirectory_arrow_right</mat-icon>
        <mat-form-field>
          <input matInput [formControl]='control'>
          <!-- TODO Add the functionality to delete inputs -->
        </mat-form-field>
        <button mat-icon-button aria-label="Delete property from step">
          <mat-icon>delete</mat-icon>
        </button>
      }
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputStringArrayComponent {
  @Input({required: true}) schema!: StepProperty;
  @Input({required: true}) control!: FormArray<FormControl<string>>;
  @Output() deleteProperty = new EventEmitter<void>();
}
