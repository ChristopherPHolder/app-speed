import { Injectable } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import {
  AUDIT_STEP_OPTION_GROUPS,
  LIGHTHOUSE_STEP_OPTIONS,
  PUPPETEER_REPLY_STEP_OPTIONS,
} from './audit-form-step.constants';

// TODO add a step options map
type StepPropControl = FormControl<string> | FormControl<number> | FormGroup | FormArray;
type ActionType = 'lighthouse' | 'puppeteer';
type FormType = 'string' | 'number' | 'array' | 'object';

@Injectable()
export class AuditStepControlService {
  private formGroup!: FormGroup;
  type!: FormControl<string>;
  actionType?: ActionType;
  stepProps?: {
    formType: FormType;
    formControl: StepPropControl;
  }[];
  additionalProps?: string[] | null;

  initStep(formGroup: FormGroup) {
    this.formGroup = formGroup;
    this.type = this.formGroup.get('type') as FormControl<string>;
    this.actionType = this.getStepType(this.type.value);

    this.additionalProps = this.getAdditionalProps();
    console.log('Additional Props', this.additionalProps);
  }

  reset(): void {
    this.stepPropKeys().forEach(name => {
      this.formGroup.removeControl(name, { emitEvent: true });
    });
  };

  private stepPropKeys(): string[] {
    return Object.keys(this.formGroup.controls).filter(k => k !== 'type')
  }

  private getStepType(stepType: string): ActionType | undefined {
    return !LIGHTHOUSE_STEP_OPTIONS.map((i) => i.value).includes(stepType) ? 'lighthouse'
      : PUPPETEER_REPLY_STEP_OPTIONS.map((i) => i.value).includes(stepType) ? 'puppeteer'
        : undefined;
  }

  private getAdditionalProps() {
    const propKeys = this.stepPropKeys();
    const stepPropOptions = AUDIT_STEP_OPTION_GROUPS
      .flatMap(group => group.options)
      .find(step => step.value === this.type.value)
      ?.properties?.flatMap(props => props.value) ?? null;
    return stepPropOptions?.filter(v => !propKeys.includes(v)) ?? null;
  }

  addProp(): void {
    console.log('Add Prop Value');
  };
}
