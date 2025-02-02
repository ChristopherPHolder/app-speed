import { Component, EventEmitter, inject, Output } from '@angular/core';
import { MatError, MatFormField, MatInput } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';

import { MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatFabButton } from '@angular/material/button';
import { RxIf } from '@rx-angular/template/if';
import { RxFor } from '@rx-angular/template/for';

import { AuditBuilderService } from './audit-builder.service';
import { ToTitleCasePipe } from '../utils/toTitleCase.pipe';
import { DEVICE_OPTIONS } from '@app-speed/shared-user-flow-replay';

@Component({
  selector: 'builder-audit-global',
  imports: [
    RxIf,
    RxFor,
    ReactiveFormsModule,
    ToTitleCasePipe,
    MatFormField,
    MatInput,
    MatSelect,
    MatOption,
    MatError,
    MatLabel,
    MatFabButton,
  ],
  template: `
    <div class="row">
      <mat-form-field class="full-width">
        <mat-label>Audit Title</mat-label>
        <input matInput placeholder="Audit Title" [formControl]="builder.formGroup.controls.title" />
        <mat-error *rxIf="!!builder.formGroup.controls.title.hasError">Title <strong>required</strong></mat-error>
      </mat-form-field>
      <button
        class="submit-btn"
        mat-fab
        [disabled]="builder.formGroup.disabled"
        [extended]="true"
        color="primary"
        type="submit"
      >
        Analyze
      </button>
    </div>
    <div class="row">
      <mat-form-field class="full-width col">
        <mat-label>Device Type</mat-label>
        <mat-select [formControl]="builder.formGroup.controls.device" (selectionChange)="valueChange.emit($event)">
          <mat-option *rxFor="let device of DEVICE_TYPES" [value]="device">{{ device | toTitleCase }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field class="full-width col">
        <mat-label>Timeout</mat-label>
        <input
          matInput
          type="number"
          min="1"
          max="99999"
          placeholder="Timeout in ms"
          [formControl]="builder.formGroup.controls.timeout"
        />
        <mat-error *rxIf="!!builder.formGroup.controls.timeout.hasError">Invalid Value</mat-error>
      </mat-form-field>
    </div>
  `,
  styleUrl: './audit-globals.styles.scss',
})
export class AuditGlobalsComponent {
  protected readonly DEVICE_TYPES = DEVICE_OPTIONS;
  @Output() valueChange = new EventEmitter();
  builder = inject(AuditBuilderService);
}
