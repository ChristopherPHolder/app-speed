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

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.initializeStepForm();
  }

  initializeStepForm() {
    this.stepForm = this.createFormGroup(this.stepData)
  }

  createFormGroup(step: AppSpeedUserFlowStep): FormGroup {
    const controls = Object.fromEntries(
      Object.entries(step).map(([key, value]) => {
        if (typeof value === 'string') {
          return [key, [value]];
        }
        console.log('Value', value)
        return [key, [this.createFormGroup(value)]];
      })
    );
    this.stepForm = this.fb.group(controls);
    return this.fb.group(controls);
  }

  getKeys(obj: any): string[] {
    console.log(obj);
    return Object.keys(obj);
  }

  isInputString(obj: any): boolean {
    return typeof obj['value'] === 'string';
  }

  get stepType() {
    return this.stepForm.controls['type'].value
  }
}

