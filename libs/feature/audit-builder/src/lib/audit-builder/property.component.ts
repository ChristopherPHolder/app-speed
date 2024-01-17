import { ChangeDetectionStrategy, Component, computed, inject, Input, signal } from '@angular/core';

import { AuditBuilderService } from './audit-builder.service';

import { InputStringArrayComponent } from '../property-input/input-string-array.component';
import { InputStringComponent } from '../property-input/input-string.component';
import { InputNumberComponent } from '../property-input/input-number.component';
import { InputBooleanComponent } from '../property-input/input-boolean.component';
import { InputOptionsComponent } from '../property-input/input-options.component';
import { InputRecordsComponent } from '../property-input/input-records.component';

import { INPUT_TYPE, PROPERTY_NAME } from '../schema/step-property.constants';

import { PropertyName, StepType } from '../schema/audit-builder.types';

@Component({
  selector: 'lib-step-property',
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
        <lib-input-string 
          [schema]='schema()' 
          [control]='$any(control())'
          (deleteProperty)='handleDeleteProperty()'
        />
      }
      @case (INPUT_TYPE.NUMBER) {
        <lib-input-number
          [schema]='schema()'
          [control]='$any(control())'
          (deleteProperty)='handleDeleteProperty()'
        />
      }
      @case (INPUT_TYPE.BOOLEAN) {
        <lib-input-boolean
          [schema]='schema()'
          [control]='$any(control())'
          (deleteProperty)='handleDeleteProperty()'
        />
      }
      @case (INPUT_TYPE.OPTIONS) {
        <lib-input-options
          [schema]='schema()'
          [control]='$any(control())'
          (deleteProperty)='handleDeleteProperty()'
          (selectedChange)='handleSelectedChange($event)'
        />
      }
      @case (INPUT_TYPE.STRING_ARRAY) {
        <lib-input-string-array 
          [schema]='schema()' 
          [control]='$any(control())'
          (deleteProperty)='handleDeleteProperty()'
        />
      }
      @case (INPUT_TYPE.RECORDS) {
        <lib-input-records
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
  @Input({required: true}) set controlKey(key: PropertyName) { this._controlKey.set(key) };
  @Input({required: true}) set stepIndex(index: number) { this._stepIndex.set(index) };
  private builder = inject(AuditBuilderService);
  _stepIndex = signal<number | undefined>(undefined);

  private _controlKey = signal<PropertyName | undefined>(undefined);
  control = computed(() => {
    return this.builder.formGroup.controls.steps.at(this._stepIndex()!).get(this._controlKey()!)
  })

  schema = computed(() => {
    return this.builder.getStepPropertySchema(this._stepIndex()!, this._controlKey()!);
  })

  handleSelectedChange(value: string) {
    if (this.schema().name === PROPERTY_NAME.TYPE) {
      this.builder.changeStepType(this._stepIndex()!, value as StepType);
    }
  }
  handleDeleteProperty() {
    this.builder.removeStepProperty(this._stepIndex()!, this.schema()!.name);
  }
}
