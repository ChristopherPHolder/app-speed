import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { RxFor } from '@rx-angular/template/for';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { StepProperty } from '@app-speed/shared-user-flow-replay';

@Component({
  selector: 'builder-input-options',
  imports: [RxFor, ReactiveFormsModule, MatLabel, MatFormField, MatSelect, MatOption, MatIcon, MatIconButton],
  template: `
    <div>
      <mat-form-field>
        <mat-label>{{ schema.name }} </mat-label>
        <mat-select [formControl]="control" (selectionChange)="selectedChange.emit($event.value)">
          @for (option of schema.options; track option) {
            <mat-option [value]="option">{{ option }}</mat-option>
          }
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
})
export class InputOptionsComponent {
  @Input({ required: true }) schema!: StepProperty;
  @Input({ required: true }) control!: FormControl<string>;
  @Output() deleteProperty = new EventEmitter<void>();
  @Output() selectedChange = new EventEmitter<string>();
}
