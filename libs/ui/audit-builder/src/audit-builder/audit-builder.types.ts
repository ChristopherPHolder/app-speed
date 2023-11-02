import { FormArray, FormControl, FormGroup } from '@angular/forms';

import { LIGHTHOUSE_REPLY_STEP_TYPES, PUPPETEER_REPLAY_STEP_TYPES } from './audit-builder.constants';

export type StepType =
  | typeof LIGHTHOUSE_REPLY_STEP_TYPES[keyof typeof LIGHTHOUSE_REPLY_STEP_TYPES]
  | typeof PUPPETEER_REPLAY_STEP_TYPES[keyof typeof PUPPETEER_REPLAY_STEP_TYPES] ;

export type DeviceOption = 'mobile' | 'tablet' | 'desktop';

export type UiActions = {
  inputChange: Event;
  formSubmit: Event;
  formClick: Event;
}

export interface AuditDetails  {
  title: string;
  device: DeviceOption;
  timeout: number
  steps: []
}

export interface StepFormGroup {
  type: FormControl<StepType | string>;
}

export interface AuditBuilder {
  title: FormControl<string>;
  device: FormControl<DeviceOption>;
  timeout: FormControl<number>;
  steps: FormArray<FormGroup<StepFormGroup>>;
}
