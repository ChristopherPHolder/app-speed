import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RxIf } from '@rx-angular/template/if';
import { RxFor } from '@rx-angular/template/for';

import { ToTitleCasePipe } from '../utils/toTitleCase.pipe';
import { AuditBuilderService } from './audit-builder.service';

import { DEVICE_TYPE } from '../schema/audit.constants';

@Component({
  selector: 'lib-audit-global',
  standalone: true,
  imports: [
    RxIf,
    RxFor,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    ToTitleCasePipe,
  ],
  template: `
    <div class='row'>
      <mat-form-field class="full-width">
        <mat-label>Audit Title</mat-label>
        <input matInput placeholder="Audit Title" [formControl]='builder.formGroup.controls.title'>
        <mat-error *rxIf="builder.formGroup.controls.title.hasError">Title <strong>required</strong></mat-error>
      </mat-form-field>
      <mat-card-actions class='cta'>
        <button class='cta__submit' mat-raised-button color="primary" type="submit">Analyze</button>
      </mat-card-actions>
    </div>
    <div class='row'>
      <mat-form-field class="full-width col">
        <mat-label>Device Type</mat-label>
        <mat-select [formControl]='builder.formGroup.controls.device' (selectionChange)='valueChange.emit($event)'>
          <mat-option *rxFor="let device of DEVICE_TYPES" [value]="device">{{ device | toTitleCase }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field class="full-width col end__col">
        <mat-label>Timeout</mat-label>
        <input
          matInput
          type="number"
          min='1'
          max='99999'
          placeholder="Timeout in ms"
          [formControl]='builder.formGroup.controls.timeout'
        >
        <mat-error *rxIf="builder.formGroup.controls.timeout.hasError">Invalid Value</mat-error>
      </mat-form-field>
    </div>
  `,
  styleUrls: ['./audit-globals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditGlobalsComponent {
  protected readonly DEVICE_TYPES = Object.values(DEVICE_TYPE);
  @Output() valueChange = new EventEmitter();
  builder = inject(AuditBuilderService)
}
