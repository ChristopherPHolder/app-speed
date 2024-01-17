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
    <div>
      <!-- TODO Improve Styling For Input Section Title -->
      <h4>{{ schema.name }}</h4>
      @if (!schema.required) {
        <button mat-icon-button aria-label="Delete property from step" (click)='deleteProperty.emit()'>
          <mat-icon>delete</mat-icon>
        </button>
      }
      @for (control of control.controls; track control) {
        <mat-form-field>
          <input matInput [formControl]='control'>
          <!-- TODO Add the ability to add and delete inputs -->
        </mat-form-field>
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
