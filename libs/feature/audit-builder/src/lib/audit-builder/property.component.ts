import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { NgSwitch, NgSwitchCase } from '@angular/common';

import { MatInputModule } from '@angular/material/input';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { RxFor } from '@rx-angular/template/for';
import { PropertyName, StepProperty } from './audit-builder.types';
import { AuditBuilderService } from './audit-builder.service';
import { INPUT_TYPE } from './audit-builder.constants';

@Component({
  selector: 'lib-step-property',
  standalone: true,
  imports: [
    NgSwitch,
    NgSwitchCase,
    MatInputModule,
    ReactiveFormsModule,
    MatOptionModule,
    MatSelectModule,
    RxFor,
  ],
  template: `
    <div [ngSwitch]="schema().inputType">
      
      <mat-form-field *ngSwitchCase="INPUT_TYPE.STRING">
        <mat-label>{{ schema().name }}</mat-label>
        <input matInput [formControl]='$any(control())'>
      </mat-form-field>
      
      <mat-form-field *ngSwitchCase="INPUT_TYPE.NUMBER">
        <mat-label>{{ schema().name }}</mat-label>
        <input matInput type="number" [formControl]='$any(control())'>
      </mat-form-field>

      <mat-form-field *ngSwitchCase="INPUT_TYPE.BOOLEAN">
        <mat-label>{{ schema().name }}</mat-label>
        <mat-select [formControl]='$any(control())' (selectionChange)='selectionChange.emit(schema().name)'>
          <mat-option [value]="false">False</mat-option>
          <mat-option [value]="true">True</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field *ngSwitchCase="INPUT_TYPE.OPTIONS">
        <mat-label>{{ schema().name }}</mat-label>
        <mat-select [formControl]='$any(control())' (selectionChange)='selectionChange.emit(schema().name)'>
          <mat-option *rxFor='let option of schema().options' [value]="option">{{option}}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepPropertyComponent {
  protected readonly INPUT_TYPE = INPUT_TYPE;
  @Input({required: true}) set controlKey(key: PropertyName) { this._controlKey.set(key) };
  @Input({required: true}) set stepIndex(index: number) { this._stepIndex.set(index) };
  private builder = inject(AuditBuilderService);
  private _stepIndex = signal<number | undefined>(undefined);

  private _controlKey = signal<PropertyName | undefined>(undefined);
  control = computed(() => {
    return this.builder.formGroup.controls.steps.at(this._stepIndex()!).get(this._controlKey()!)
  })

  schema = computed(() => {
    return this.builder.getPropertySchema(this._controlKey()!);
  })
  @Output() selectionChange = new EventEmitter<string>();
}
