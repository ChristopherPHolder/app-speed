import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { StepProperty } from '../schema/types';

@Component({
  selector: 'builder-input-string',
  standalone: true,
  imports: [ReactiveFormsModule, MatLabel, MatInput, MatFormField, MatIcon, MatIconButton],
  template: `
    <div>
      <mat-form-field>
        <mat-label>{{ schema.name }}</mat-label>
        <input matInput [formControl]='control'>
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
export class InputStringComponent {
  @Input({required: true}) schema!: StepProperty;
  @Input({required: true}) control!: FormControl<string>;
  @Output() deleteProperty = new EventEmitter<void>();
}
