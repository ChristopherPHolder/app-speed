import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';

import { StepProperty } from '@app-speed/shared-user-flow-replay';

@Component({
  selector: 'builder-input-boolean',
  template: `
    <div>
      <mat-form-field>
        <mat-label>{{ schema.name }}</mat-label>
        <mat-select [formControl]="control">
          <mat-option [value]="false">False</mat-option>
          <mat-option [value]="true">True</mat-option>
        </mat-select>
      </mat-form-field>
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
    </div>
  `,
  imports: [ReactiveFormsModule, MatFormField, MatLabel, MatSelect, MatOption, MatIcon, MatIconButton],
})
export class InputBooleanComponent {
  @Input({ required: true }) schema!: StepProperty;
  @Input({ required: true }) control!: FormControl<boolean>;
  @Output() deleteProperty = new EventEmitter<void>();
}
