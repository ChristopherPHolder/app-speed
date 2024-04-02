import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { StepProperty } from '../schema/types';

@Component({
  selector: 'builder-input-number',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  template: `
    <div>
      <mat-form-field>
        <mat-label>{{ schema.name }}</mat-label>
        <input matInput type="number" [formControl]='control'>
      </mat-form-field>
      @if (!schema.required) {
        <button mat-icon-button aria-label="Delete property from step" (click)='deleteProperty.emit()'>
          <mat-icon>delete</mat-icon>
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputNumberComponent {
  @Input({required: true}) schema!: StepProperty;
  @Input({required: true}) control!: FormControl<number>;
  @Output() deleteProperty = new EventEmitter<void>();
}
