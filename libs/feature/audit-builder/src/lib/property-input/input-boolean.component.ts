import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { StepProperty } from '../schema/audit-builder.types';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'lib-input-boolean',
  standalone: true,
  imports: [
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
        <mat-select [formControl]='control'>
          <mat-option [value]="false">False</mat-option>
          <mat-option [value]="true">True</mat-option>
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
export class InputBooleanComponent {
  @Input({required: true}) schema!: StepProperty;
  @Input({required: true}) control!: FormControl<boolean>;
  @Output() deleteProperty = new EventEmitter<void>();
}
