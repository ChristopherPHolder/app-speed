import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatError, MatInput } from '@angular/material/input';

import { RxIf } from '@rx-angular/template/if';
import { ToTitleCasePipe } from '../utils/toTitleCase.pipe';
import { StepProperty } from '@app-speed/shared-user-flow-replay';

@Component({
  selector: 'builder-input-string',
  imports: [
    ReactiveFormsModule,
    MatError,
    MatLabel,
    MatInput,
    MatFormField,
    MatIcon,
    MatIconButton,
    RxIf,
    ToTitleCasePipe,
  ],
  template: `
    <div>
      <mat-form-field>
        <mat-label>{{ schema.name }}</mat-label>
        <input matInput [formControl]="control" />
        <mat-error *rxIf="control.hasError('required')">
          {{ schema.name | toTitleCase }} is <strong>required</strong>
        </mat-error>
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
export class InputStringComponent {
  @Input({ required: true }) schema!: StepProperty;
  @Input({ required: true }) control!: FormControl<string>;
  @Output() deleteProperty = new EventEmitter<void>();
}
