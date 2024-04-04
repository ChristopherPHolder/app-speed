import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { FormControl } from '@angular/forms';

import { StepProperty } from '../schema/types';

@Component({
  selector: 'builder-input-records',
  template: `
    <div>
      TODO
      @if (!schema.required) {
        <button mat-icon-button aria-label="Delete property from step" (click)='deleteProperty.emit()'>
          <mat-icon>delete</mat-icon>
        </button>
      }
      <p>{{ schema | json }}</p>
    </div>
  `,
  standalone: true,
  imports: [MatIconButton, MatIcon, JsonPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputRecordsComponent {
  @Input({required: true}) schema!: StepProperty;
  @Input({required: true}) control!: FormControl;
  @Output() deleteProperty = new EventEmitter<void>();
}
