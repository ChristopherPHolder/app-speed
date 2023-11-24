import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter, inject,
  Input,
  OnChanges, OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

import { RxFor } from '@rx-angular/template/for';
import { RxIf } from '@rx-angular/template/if';

import { AUDIT_STEP_OPTION_GROUPS } from './audit-form-step.constants';

import { StepFormGroup } from '../audit-builder/audit-builder.types';
import { MatCardModule } from '@angular/material/card';
import { AuditStepControlService } from './audit-step-control.service';
import { JsonPipe, NgForOf, NgIf } from '@angular/common';
import { tap } from 'rxjs';

@Component({
  selector: 'ui-audit-form-step',
  standalone: true,
  imports: [
    RxIf,
    RxFor,
    ReactiveFormsModule,
    MatExpansionModule,
    MatInputModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatDividerModule,
    MatCardModule,
    JsonPipe,
    NgForOf,
    NgIf,
  ],
  templateUrl: './audit-form-step.component.html',
  styleUrls: ['./audit-form-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AuditStepControlService]
})
export class AuditFormStepComponent {
  protected readonly AUDIT_STEP_OPTION_GROUPS = AUDIT_STEP_OPTION_GROUPS;

  @Input({required: true}) set stepFormGroup(formGroup: FormGroup<StepFormGroup>) {
    this.controller.set(formGroup);
  };
  @Output() valueChange = new EventEmitter();
  @Output() action = new EventEmitter();

  controller = inject(AuditStepControlService);
}
