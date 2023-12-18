import { ChangeDetectionStrategy, Component, computed, inject, Input, signal } from '@angular/core';


import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { RxFor } from '@rx-angular/template/for';
import { PropertyName, StepType } from './audit-builder.types';
import { AuditBuilderService } from './audit-builder.service';
import { INPUT_TYPE, PROPERTY_NAME } from './audit-builder.constants';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'lib-step-property',
  standalone: true,
  imports: [
    MatInputModule,
    ReactiveFormsModule,
    MatOptionModule,
    MatSelectModule,
    RxFor,
    MatIconModule,
    MatButtonModule,
    JsonPipe,
  ],
  template: `
      @switch (schema().inputType) {
          @case (INPUT_TYPE.STRING) {
              <div>
                  <mat-form-field>
                      <mat-label>{{ schema().name }}</mat-label>
                      <input matInput [formControl]='$any(control())'>
                  </mat-form-field>
                  @if (!schema().required) {
                      <button mat-icon-button aria-label="Delete property from step" (click)='handleDeleteProperty()'>
                          <mat-icon>delete</mat-icon>
                      </button>
                  }
              </div>
          }
          @case (INPUT_TYPE.NUMBER) {
              <div>
                  <mat-form-field>
                      <mat-label>{{ schema().name }}</mat-label>
                      <input matInput type="number" [formControl]='$any(control())'>
                  </mat-form-field>
                  @if (!schema().required) {
                      <button mat-icon-button aria-label="Delete property from step" (click)='handleDeleteProperty()'>
                          <mat-icon>delete</mat-icon>
                      </button>
                  }
              </div>
          }
          @case (INPUT_TYPE.BOOLEAN) {
              <div>
                  <mat-form-field>
                      <mat-label>{{ schema().name }}</mat-label>
                      <mat-select [formControl]='$any(control())'>
                          <mat-option [value]="false">False</mat-option>
                          <mat-option [value]="true">True</mat-option>
                      </mat-select>
                  </mat-form-field>

                  @if (!schema().required) {
                      <button mat-icon-button aria-label="Delete property from step" (click)='handleDeleteProperty()'>
                          <mat-icon>delete</mat-icon>
                      </button>
                  }
              </div>
          }
          @case (INPUT_TYPE.OPTIONS) {
              <div>
                  <mat-form-field>
                      <mat-label>{{ schema().name }}</mat-label>
                      <mat-select [formControl]='$any(control())' (selectionChange)='handleSelectedChange($event.value)'>
                          <mat-option *rxFor='let option of schema().options' [value]="option">{{option}}</mat-option>
                      </mat-select>
                  </mat-form-field>
                  @if (!schema().required) {
                      <button mat-icon-button aria-label="Delete property from step" (click)='handleDeleteProperty()'>
                          <mat-icon>delete</mat-icon>
                      </button>
                  }
              </div>
          }
          @case (INPUT_TYPE.STRING_ARRAY) {
              <div>
                  TODO
                  @if (!schema().required) {
                      <button mat-icon-button aria-label="Delete property from step" (click)='handleDeleteProperty()'>
                          <mat-icon>delete</mat-icon>
                      </button>
                  }
                  <p>
                      {{ schema() | json }}
                  </p>
              </div>
          }
          @case (INPUT_TYPE.RECORDS) {
              <div>
                  TODO
                  @if (!schema().required) {
                      <button mat-icon-button aria-label="Delete property from step" (click)='handleDeleteProperty()'>
                          <mat-icon>delete</mat-icon>
                      </button>
                  }
                  <p>
                      {{ schema() | json }}
                  </p>
              </div>
          }
      }
  `,
  styles: [],
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
