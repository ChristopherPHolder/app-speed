import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import type { AuditStep, DeviceType } from '@app-speed/audit/domain';
import { AuditDetails } from '../audit-details';
import { BuilderStepFormGroup, findStepSpec } from '../step-form';

export type StepSelection = string;
export type Step = AuditStep | { type: '' };

export class AuditFormGroup extends FormGroup<{
  title: FormControl<string>;
  device: FormControl<DeviceType>;
  timeout: FormControl<number>;
  steps: FormArray<StepFormGroup>;
}> {
  constructor(audit: AuditDetails) {
    super({
      title: new FormControl<string>(audit.title, {
        validators: [Validators.required],
        nonNullable: true,
      }),
      device: new FormControl<DeviceType>(audit.device, {
        validators: [Validators.required],
        nonNullable: true,
      }),
      timeout: new FormControl<number>(audit.timeout ?? 30000, {
        validators: [Validators.required],
        nonNullable: true,
      }),
      steps: new FormArray<StepFormGroup>(
        audit.steps.map((step) => new StepFormGroup(step)),
        { validators: [Validators.required] },
      ),
    });
  }

  addStepAt(index: number) {
    if (this.disabled || this.controls.steps.disabled) {
      return;
    }

    this.controls.steps.insert(index, new StepFormGroup({ type: '' }));
  }

  removeStepAt(index: number) {
    if (this.disabled || this.controls.steps.disabled) {
      return;
    }

    this.controls.steps.removeAt(index);
  }
}

export class StepFormGroup extends BuilderStepFormGroup {
  readonly selectionControl = new FormControl<StepSelection | ''>('', {
    validators: [Validators.required],
    nonNullable: true,
  });

  constructor(step: Step | AuditStep) {
    super();

    const selection = stepSelectionFromStep(step);

    this.selectionControl.setValue(selection);
    this.resetStepControls(selection, isSelectedStep(step) ? step : undefined);
  }

  resetStepControls(stepSelection: StepSelection | '', step?: AuditStep): void {
    if (this.disabled) {
      return;
    }

    if (this.selectionControl.value !== stepSelection) {
      this.selectionControl.setValue(stepSelection, { emitEvent: false });
    }

    if (!stepSelection) {
      this.resetSpec();
      return;
    }

    this.resetSpec(findStepSpec(stepSelection), step as Record<string, unknown> | undefined);
  }

  override disable(opts?: { onlySelf?: boolean; emitEvent?: boolean }): void {
    super.disable(opts);
    this.selectionControl.disable(opts);
  }

  override enable(opts?: { onlySelf?: boolean; emitEvent?: boolean }): void {
    super.enable(opts);
    this.selectionControl.enable(opts);
  }
}

const stepSelectionFromStep = (step: Step | AuditStep): StepSelection | '' => {
  if (step.type === '') {
    return '';
  }

  return step.type === 'customStep' ? step.step : step.type;
};

const isSelectedStep = (step: Step | AuditStep): step is AuditStep => step.type !== '';
