import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { StepProperty } from '../schema/types';

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
        <!-- TODO Add the functionality to add inputs -->
        <button
          mat-icon-button
          aria-label='Add property to step'
          (click)='addPropertyItem()'
        >
          <mat-icon>library_add</mat-icon>
        </button>
        @if (!schema.required) {
          <button
            mat-icon-button
            aria-label='Delete property from step'
            (click)='deleteProperty.emit()'
          >
            <mat-icon>delete</mat-icon>
          </button>
        }
      </h4>
      @for (control of control.controls; track control; let idx = $index) {
        <div style='display: flex;'>
          <mat-icon style='padding-top: 16px;'>subdirectory_arrow_right</mat-icon>
          <mat-form-field>
            <input matInput [formControl]='control'>
          </mat-form-field>
          <!-- TODO Add the functionality to delete inputs item -->
          <button mat-icon-button aria-label='Delete property from step' (click)='deletePropertyItemAt(idx)'>
            <mat-icon>delete</mat-icon>
          </button>
        </div>
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

  addPropertyItem() {
    // TODO extract initial value from defaults
    this.control.push(new FormControl<string>('', { validators: [Validators.required], nonNullable: true }))
  }
  deletePropertyItemAt(index: number) {
    this.control.removeAt(index);
  }
}
