import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { StepFormGroup } from './audit-builder-form';
import { MatFabButton } from '@angular/material/button';
import { OptionsFieldComponent } from './fields/options-field.component';
import { ReactiveFormsModule } from '@angular/forms';
import { tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToTitleCasePipe } from './utils/toTitleCase.pipe';
import { InputFieldComponent } from './fields/input-field.component';
import { ArrayFieldComponent } from './fields/array-field.component';

@Component({
  selector: 'ui-audit-builder-step',
  template: `
    <mat-expansion-panel [expanded]="true">
      @let control = stepControl();
      <mat-expansion-panel-header>
        <mat-panel-title>
          @if (control.controls['type'].value; as stepType) {
            {{ stepType | toTitleCase }}
          } @else {
            Audit Step Required!
          }
        </mat-panel-title>
      </mat-expansion-panel-header>
      <ng-content />
      <ng-container [formGroup]="control">
        @for (stepField of control.fields(); track stepField) {
          @let fieldType = control.stepPropertyType(stepField);
          @switch (fieldType) {
            @case ('options') {
              <ui-options-field [label]="stepField" />
            }
            @case ('string') {
              <ui-input-field [label]='stepField' />
            }
            @case ('number') {
              <ui-input-field [label]='stepField' />
            }
            @case ('boolean') {
              <ui-options-field [label]="stepField" />
            }
            @case ('stringArray') {
              <ui-array-field [label]='stepField' />
            }
            @default {
              TODO not yet implemented {{ fieldType }} {{ fieldType }}
            }
          }

        }
      </ng-container>
      @let optionalFields = control.optionalFields();
      @if (optionalFields.length > 0) {
        <h4>Optional Properties</h4>
        <div class='add-optional-field'>
          @for (optionField of optionalFields; track optionField) {
            <button
              mat-fab
              [extended]="true"
              [disabled]="control.disabled"
              color="primary"
              type="button"
              (click)="control.addOptionalField(optionField)"
            >
              {{ optionField }}
            </button>
          }
        </div>
      }

    </mat-expansion-panel>
  `,
  imports: [
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatFabButton,
    OptionsFieldComponent,
    ReactiveFormsModule,
    ToTitleCasePipe,
    InputFieldComponent,
    ArrayFieldComponent,
  ],
  styles: `
    .add-optional-field {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditStepComponent implements OnInit {
  stepControl = input.required<StepFormGroup>();
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.stepControl()
      .controls['type'].valueChanges.pipe(
        tap((stepType) => this.stepControl().resetStepControls(stepType!)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
