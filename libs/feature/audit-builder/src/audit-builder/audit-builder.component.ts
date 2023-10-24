import { ChangeDetectionStrategy, Component, inject, Input, Output } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';

import { preventDefault, RxActionFactory, RxActions } from '@rx-angular/state/actions';
import { RxEffects } from '@rx-angular/state/effects';
import { RxIf } from '@rx-angular/template/if';
import { RxFor } from '@rx-angular/template/for';

import { filter, map, withLatestFrom } from 'rxjs';

import { AuditBuilder, AuditDetails, UiActions } from './audit-builder.types';
import {
  BASE_FORM_CONTROL_OPTIONS,
  DEVICE_TYPES,
  STEP_TYPES,
  STEP_TYPES_VALIDATOR_PATTERN,
} from './audit-builder.constants';

@Component({
  selector: 'lib-audit-builder',
  standalone: true,
  imports: [
    RxIf,
    RxFor,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatExpansionModule,
  ],
  templateUrl: './audit-builder.component.html',
  styleUrls: ['./audit-builder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxActionFactory],
})
export class AuditBuilderComponent extends RxEffects {
  @Input({required: true}) set auditDetails(details: AuditDetails) {
    this.auditBuilderForm.controls.title.setValue(details.title);
    this.auditBuilderForm.controls.device.setValue(details.device);
    this.auditBuilderForm.controls.timeout.setValue(details.timeout);
    this.updateAuditSteps(details.steps);
  }

  updateAuditSteps(steps: []) {
    const formSteps = this.auditBuilderForm.controls.steps;
    if (JSON.stringify(formSteps.getRawValue()) === JSON.stringify(steps)) {
      return;
    }
    formSteps.clear();
    steps.forEach((step, index) => this.addStep(index, step));
  }

  ui: RxActions<UiActions> = inject(RxActionFactory<UiActions>).create({
    inputChange: preventDefault,
    formSubmit: preventDefault
  });

  public readonly deviceTypes = DEVICE_TYPES;

  public readonly stepTypeValidatorPattern = STEP_TYPES_VALIDATOR_PATTERN;

  public readonly auditBuilderForm = new FormGroup<AuditBuilder>({
    title: new FormControl('', BASE_FORM_CONTROL_OPTIONS),
    device: new FormControl('mobile', BASE_FORM_CONTROL_OPTIONS),
    timeout: new FormControl(30000, BASE_FORM_CONTROL_OPTIONS),
    steps: new FormArray<any>([])
  });

  filteredOptions(value: string) {
    const filterValue = value.toLowerCase();
    return STEP_TYPES.filter(option => option.toLowerCase().includes(filterValue));
  }

  @Output() auditSubmit = this.ui.formSubmit$.pipe(
    withLatestFrom(this.auditBuilderForm.statusChanges,this.auditBuilderForm.valueChanges),
    filter(([,formState,]) => formState === 'VALID'),
    map(([,, formValue]) => formValue)
  )

  @Output() auditInputChange = this.ui.inputChange$.pipe(
    withLatestFrom(this.auditBuilderForm.statusChanges,this.auditBuilderForm.valueChanges),
    map(([,, formValue]) => formValue)
  )

  private createFormGroup(data: any): FormGroup {
    return new FormGroup(
      Object.keys(data).reduce((accumulator, key) => ({
        ...accumulator, [key]: this.createFormControl(data[key])
      }), {})
    );
  }

  private createFormControl(value: any) {
    if (value instanceof Array) return this.createFormArray(value);
    if (typeof value === 'object') return this.createFormGroup(value);
    return this.createValueControl(value);
  }

  private createFormArray(items: any[]): FormArray<any> {
    return  new FormArray<any>(items.map(item => this.createFormGroup(item)));
  }

  private createValueControl(value: any): FormControl {
    return new FormControl(value, {
      validators: [Validators.required],
      nonNullable: true
    });
  }

  addStep(index: number, step?: any): void {
    this.auditBuilderForm.controls.steps.insert(index, this.createFormGroup(step || { type: '' }));
  }
}
