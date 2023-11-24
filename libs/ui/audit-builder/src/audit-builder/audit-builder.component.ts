import { Component, inject, Input, Output } from '@angular/core';

import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';

import { eventValue, preventDefault, RxActionFactory, RxActions } from '@rx-angular/state/actions';
import { RxEffects } from '@rx-angular/state/effects';

import { RxFor } from '@rx-angular/template/for';

import { filter, map, withLatestFrom } from 'rxjs';
import { AuditBuilder, AuditDetails, UiActions } from './audit-builder.types';
import { BASE_FORM_CONTROL_OPTIONS } from './audit-builder.constants';
import { AuditGlobalsComponent } from '../audit-globals/audit-globals.component';
import { AuditFormStepComponent } from '../audit-form-step/audit-form-step.component';

@Component({
  selector: 'ui-audit-builder',
  standalone: true,
  imports: [
    RxFor,
    ReactiveFormsModule,
    MatCardModule,
    MatExpansionModule,
    AuditGlobalsComponent,
    AuditFormStepComponent,
  ],
  templateUrl: './audit-builder.component.html',
  styleUrls: ['./audit-builder.component.scss'],
  providers: [RxActionFactory],
})
export class AuditBuilderComponent extends RxEffects {

  public readonly ui: RxActions<UiActions> = inject(RxActionFactory<UiActions>).create({
    inputChange: eventValue,
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
  @Output() auditDetailsChange = this.ui.inputChange$.pipe(
    withLatestFrom(this.auditBuilderForm.statusChanges,this.auditBuilderForm.valueChanges),
    map(([,, formValue]) => formValue)
  )

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

  // TODO Create an Action Map
  public stepAction(action: string, index: number): void {
    if (action === 'add-before') {
      return this.addStep(index)
    }
    if (action === 'add-after') {
      return this.addStep(index + 1)
    }
    if (action === 'remove') {
      this.auditBuilderForm.controls.steps.removeAt(index)
    }
  }
}
