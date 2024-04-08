import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { AuditBuilderService } from '../audit-builder/audit-builder.service';

import { InputStringArrayComponent } from './input-string-array.component';
import { InputStringComponent } from './input-string.component';
import { InputNumberComponent } from './input-number.component';
import { InputBooleanComponent } from './input-boolean.component';
import { InputOptionsComponent } from './input-options.component';
import { InputRecordsComponent } from './input-records.component';

import { INPUT_TYPE, PROPERTY_NAME } from '../schema/property.constants';

import { PropertyName, StepType } from '../schema/types';

@Component({
  selector: 'builder-step-property',
  standalone: true,
  imports: [
    InputStringComponent,
    InputNumberComponent,
    InputBooleanComponent,
    InputOptionsComponent,
    InputStringArrayComponent,
    InputRecordsComponent,
  ],
  template: `
    @switch (schema().inputType) {
      @case (INPUT_TYPE.STRING) {
        <builder-input-string 
          [schema]='schema()' 
          [control]='$any(control())'
          (deleteProperty)='handleDeleteProperty()'
        />
      }
      @case (INPUT_TYPE.NUMBER) {
        <builder-input-number
          [schema]='schema()'
          [control]='$any(control())'
          (deleteProperty)='handleDeleteProperty()'
        />
      }
      @case (INPUT_TYPE.BOOLEAN) {
        <builder-input-boolean
          [schema]='schema()'
          [control]='$any(control())'
          (deleteProperty)='handleDeleteProperty()'
        />
      }
      @case (INPUT_TYPE.OPTIONS) {
        <builder-input-options
          [schema]='schema()'
          [control]='$any(control())'
          (deleteProperty)='handleDeleteProperty()'
          (selectedChange)='handleSelectedChange($event)'
        />
      }
      @case (INPUT_TYPE.STRING_ARRAY) {
        <builder-input-string-array 
          [schema]='schema()' 
          [control]='$any(control())'
          (deleteProperty)='handleDeleteProperty()'
        />
      }
      @case (INPUT_TYPE.RECORDS) {
        <builder-input-records
          [schema]='schema()'
          [control]='$any(control())'
          (deleteProperty)='handleDeleteProperty()'
        />
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepPropertyComponent {
  protected readonly INPUT_TYPE = INPUT_TYPE;
  controlKey = input.required<PropertyName>();
  stepIndex = input.required<number>();
  private builder = inject(AuditBuilderService);

  control = computed(() => {
    return this.builder.formGroup.controls.steps.at(this.stepIndex()).get(this.controlKey())
  })

  schema = computed(() => {
    return this.builder.getStepPropertySchema(this.stepIndex(), this.controlKey());
  })

  handleSelectedChange(value: string): void {
    if (this.schema().name === PROPERTY_NAME.TYPE) {
      this.builder.changeStepType(this.stepIndex(), value as StepType);
    }
  }

  handleDeleteProperty(): void {
    this.builder.removeStepProperty(this.stepIndex(), this.schema().name);
  }
}
