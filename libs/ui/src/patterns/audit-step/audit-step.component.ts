import { ChangeDetectionStrategy, Component, inject, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AppSpeedUserFlowStep } from '@ufo/user-flow-replay';

@Component({
  selector: 'app-audit-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './audit-step.component.html',
  styleUrls: ['./audit-step.component.scss', './../../component/input/input.scss', '../../component/box/box.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditStepComponent {
  @Input({ required: true })
  set stepDetails(details: AppSpeedUserFlowStep) {
    this.stepForm = this.createFormGroup(details);
  }

  private fb = inject(FormBuilder);
  stepForm: FormGroup = this.createFormGroup({
    type: 'Audit Step'
  } as unknown as AppSpeedUserFlowStep);

  createFormGroup(step: AppSpeedUserFlowStep): FormGroup {
    return  this.fb.group(Object.fromEntries(Object.entries(step).map(([key, value]) =>
        typeof value === 'string' ? [key, [value]] : [key, [this.createFormGroup(value)]]
    )));
  }

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  isInputString(obj: any): boolean {
    return typeof obj['value'] === 'string';
  }

  get stepType() {
    return this.stepForm.controls['type'].value;
  }
}
