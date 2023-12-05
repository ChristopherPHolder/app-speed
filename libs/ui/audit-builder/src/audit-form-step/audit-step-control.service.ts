import { Injectable } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import {
  AUDIT_STEP_OPTION_GROUPS,
  LIGHTHOUSE_STEP_OPTIONS,
  PUPPETEER_REPLY_STEP_OPTIONS,
} from './audit-form-step.constants';

// TODO add a step options map
type ActionType = 'lighthouse' | 'puppeteer';
type ControlType = 'string' | 'number' | 'array' | 'object';

type StepProp = {
  name: string;
  type: ControlType;
  control: FormControl;
  subProps?: {
    name: string,
    type: ControlType,
    control: FormControl;
  }[]
};

@Injectable()
export class AuditStepControlService {
  private formGroup!: FormGroup;
  type!: FormControl<string>;
  actionType?: ActionType;
  stepProps: StepProp[] = [];
  additionalProps?: any[] | null;

  set(formGroup: FormGroup) {
    this.formGroup = formGroup;
    this.type = this.formGroup.get('type') as FormControl<string>;
    this.actionType = this.getStepType(this.type.value);
    this.stepProps = this.getStepProps(this.formGroup);
    this.additionalProps = this.getAdditionalProps();
  }

  reset(): void {
    this.stepPropKeys(this.formGroup).filter(k => k !== 'type').forEach(name => this.formGroup.removeControl(name));
    this.stepProps = this.getStepProps(this.formGroup);
    this.additionalProps = this.getAdditionalProps();
  };

  private stepPropKeys(control: FormGroup | FormArray): string[] {
    return Object.keys(control.controls)
  }

  private getStepType(stepType: string): ActionType | undefined {
    return !LIGHTHOUSE_STEP_OPTIONS.map((i) => i.value).includes(stepType) ? 'lighthouse'
      : PUPPETEER_REPLY_STEP_OPTIONS.map((i) => i.value).includes(stepType) ? 'puppeteer'
        : undefined;
  }

  private getStepProps(_control: FormGroup | FormArray): StepProp[] {
    return this.stepPropKeys(_control).filter(k => k !== 'type').map(name => {
      const control = _control.get(name) as FormControl;
      const type = this.getStepPropsControlType(control);
      const subProps = type === 'string' ? undefined : this.getStepProps(control as unknown as FormGroup | FormArray)
      return { name, type, control, subProps };
    });

  }

  private getStepPropsControlType(control: FormControl): ControlType {
    return control.constructor === FormGroup ? 'object' : control.constructor === FormArray ? 'array' : 'string';
  }

  private getAdditionalProps() {
    const propKeys = this.stepPropKeys(this.formGroup);
    const stepPropOptions = AUDIT_STEP_OPTION_GROUPS
      .flatMap(group => group.options)
      .find(step => step.value === this.type.value)
      ?.properties?.flat() ?? null;
    return stepPropOptions?.filter(v => !propKeys.includes(v.value)) ?? null;
  }

  getPropControler(prop: any) {
    if (prop.type === 'object') {
      return new FormGroup('');
    }
    if (prop.type === 'array') {
      return new FormArray([]);
    }
    return new FormControl('');
  }

  addProp(prop: any): void {
    const control = this.getPropControler(prop);
    this.formGroup.addControl(prop.value, control);
    this.stepProps = this.getStepProps(this.formGroup);
    this.additionalProps = this.getAdditionalProps();
    console.log('Add Prop Value', prop);
  };
}
