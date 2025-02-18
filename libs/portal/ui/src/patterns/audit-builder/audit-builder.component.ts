import { ChangeDetectionStrategy, Component, inject, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { preventDefault, RxActionFactory, RxActions } from '@rx-angular/state/actions';
import { filter, map, Observable, withLatestFrom } from 'rxjs';
import { RxEffects } from '@rx-angular/state/effects';

import type { AppSpeedUserFlow, AppSpeedUserFlowStep } from '@app-speed/shared-utils';
import { AuditStepComponent } from '../audit-step/audit-step.component';

type UiActions = {
  inputChange: string;
  formSubmit: Event;
  formClick: Event;
};

const defaultAudit: AppSpeedUserFlow = {
  title: 'AppSpeed User-Flow Audit',
  steps: [
    {
      type: 'startNavigation',
      name: 'Initial Navigation',
    },
    {
      // This is an issue related to Puppeteer Replay
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      type: 'navigate',
      url: 'https://google.com',
    },
    {
      type: 'endNavigation',
    },
  ],
};

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-audit-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AuditStepComponent],
  templateUrl: './audit-builder.component.html',
  styleUrls: ['./audit-builder.component.scss', './../../component/input/input.scss', '../../component/box/box.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxActionFactory],
})
export class AuditBuilderComponent extends RxEffects {
  defaultAudit = defaultAudit;
  auditForm = new FormGroup({
    title: new FormControl<string>(defaultAudit.title, Validators.required),
    steps: new FormArray(defaultAudit.steps.map((step: AppSpeedUserFlowStep) => this.createStepGroup(step))),
  });

  ui: RxActions<UiActions> = inject(RxActionFactory<UiActions>).create({
    inputChange: String,
    formSubmit: preventDefault,
  });

  @Input()
  set auditDetails(details: AppSpeedUserFlow) {
    this.auditForm.get('title')?.setValue(details.title);
  }

  @Input()
  set disabled(disabled$: Observable<boolean>) {
    this.register(disabled$, (d) => (d ? this.auditForm.enable() : this.auditForm.disable()));
  }

  @Output() auditSubmit = this.ui.formSubmit$.pipe(
    withLatestFrom(this.auditForm.statusChanges, this.auditForm.valueChanges),
    filter(([, formState]) => formState === 'VALID'),
    map(([, , formValue]) => formValue),
  );

  addStep(location: 'before' | 'after', index: number) {
    const i = location === 'before' ? index : index + 1;
    this.defaultAudit.steps.splice(i, 0, { type: 'startNavigation' });
  }

  removeStep(location: number) {
    this.defaultAudit.steps.splice(location, 1);
  }

  private createStepGroup(step: AppSpeedUserFlowStep) {
    return new FormGroup({
      type: new FormControl<string>(step.type, Validators.required),
    });
  }
}
