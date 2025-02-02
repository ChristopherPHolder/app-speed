import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { StepProperty } from '@app-speed/shared-user-flow-replay';

@Component({
  selector: 'builder-input-number',
  imports: [ReactiveFormsModule, MatFormField, MatInput, MatIconButton, MatIcon, MatLabel],
  template: `
    <div>
      <mat-form-field>
        <mat-label>{{ schema.name }}</mat-label>
        <input matInput type="number" [formControl]="control" />
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
})
export class InputNumberComponent {
  @Input({ required: true }) schema!: StepProperty;
  @Input({ required: true }) control!: FormControl<number>;
  @Output() deleteProperty = new EventEmitter<void>();
}
