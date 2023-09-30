import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AppSpeedUserFlowStep } from '@ufo/user-flow-replay';

@Component({
  selector: 'app-audit-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './audit-step.component.html',
  styleUrls: ['./audit-step.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditStepComponent implements OnInit {
  @Input() stepData: any;
  stepForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeStepForm();
  }

  initializeStepForm() {
    this.stepForm = this.createFormGroup(this.stepData)
  }

  createFormGroup(step: AppSpeedUserFlowStep): FormGroup {
    return  this.fb.group(Object.fromEntries(
      Object.entries(step).map(([key, value]) => (
        typeof value === 'string' ? [key, [value]] : [key, [this.createFormGroup(value)]]
      ))
    ));
  }

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  isInputString(obj: any): boolean {
    return typeof obj['value'] === 'string';
  }

  get stepType() {
    return this.stepForm.controls['type'].value
  }
}

