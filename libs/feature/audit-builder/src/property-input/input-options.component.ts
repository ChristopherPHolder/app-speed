import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { RxFor } from '@rx-angular/template/for';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { StepProperty } from '../schema/types';

@Component({
  selector: 'builder-input-options',
  standalone: true,
  imports: [
    RxFor,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatOptionModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  template: `
    <div>
      <mat-form-field>
        <mat-label>{{ schema.name }}</mat-label>
        <mat-select [formControl]='control' (selectionChange)='selectedChange.emit($event.value)'>
          <mat-option *rxFor='let option of schema.options' [value]="option">{{option}}</mat-option>
        </mat-select>
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
export class InputOptionsComponent {
  @Input({required: true}) schema!: StepProperty;
  @Input({required: true}) control!: FormControl<string>;
  @Output() deleteProperty = new EventEmitter<void>();
  @Output() selectedChange = new EventEmitter<string>();
}
