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
import { KeyValuePipe, NgFor, NgIf } from '@angular/common';
import { AuditGlobalsComponent } from '../audit-globals/audit-globals.component';

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
    KeyValuePipe,
    NgIf,
    NgFor,
    AuditGlobalsComponent,
  ],
  templateUrl: './audit-builder.component.html',
  styleUrls: ['./audit-builder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxActionFactory],
})
export class AuditBuilderComponent extends RxEffects {
  public readonly STEP_TYPES = STEP_TYPES;
  public readonly STEP_TYPES_VALIDATOR_PATTERN = STEP_TYPES_VALIDATOR_PATTERN;
  public readonly ui: RxActions<UiActions> = inject(RxActionFactory<UiActions>).create({
    inputChange: preventDefault,
    formSubmit: preventDefault
  });

  public readonly auditBuilderForm = new FormGroup<AuditBuilder>({
    title: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true
    }),
    device: new FormControl('mobile', BASE_FORM_CONTROL_OPTIONS),
    timeout: new FormControl(30000, BASE_FORM_CONTROL_OPTIONS),
    steps: new FormArray<any>([])
  });

  @Input({required: true}) set auditDetails(details: AuditDetails) {
    this.auditBuilderForm.controls.title.setValue(details.title);
    this.auditBuilderForm.controls.device.setValue(details.device);
    this.auditBuilderForm.controls.timeout.setValue(details.timeout);
    this.updateAuditSteps(details.steps);
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

  public filteredOptions(options: string[], value: string) {
    const filterValue = value.toLowerCase();
    return options.filter(option => option.toLowerCase().includes(filterValue));
  }

  addStep(index: number, step?: any): void {
    this.auditBuilderForm.controls.steps.insert(index, this.createFormGroup(step || { type: '' }));
  }

  updateAuditSteps(steps: []) {
    const formSteps = this.auditBuilderForm.controls.steps;
    if (JSON.stringify(formSteps.getRawValue()) === JSON.stringify(steps)) {
      return;
    }
    formSteps.clear();
    steps.forEach((step, index) => this.addStep(index, step));
  }

  private createFormGroup(data: Record<string, string | NonNullable<unknown> | []>): FormGroup {
    const controls = Object.keys(data).reduce((acc, key) => ({
      ...acc, [key]: this.createFormControl(data[key])
    }), {});
    return new FormGroup(controls);
  }

  private createFormControl(value: string | [] | Record<string, string | NonNullable<unknown> | []>) {
    if (value instanceof Array) return this.createFormArray(value);
    if (typeof value === 'string') return this.createValueControl(value);
    return this.createFormGroup(value);
  }

  private createFormArray(items: []): FormArray {
    return  new FormArray(items.map(item => this.createFormControl(item)));
  }

  private createValueControl(value: string): FormControl<string> {
    return new FormControl<string>(value, BASE_FORM_CONTROL_OPTIONS);
  }

  public getStepControlsKeys(stepFormGroup: any) {
    return Object.keys(stepFormGroup.controls);
  }

  getControl(stepFormGroup: any, controlKey: any) {
    return stepFormGroup.get(controlKey) as FormControl;
  }

  isValueControl(control: FormControl) {
    return typeof control.value === 'string';
  }
}
