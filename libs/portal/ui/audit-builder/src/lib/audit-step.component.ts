import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from '@app-speed/shared-user-flow-replay';
import { StepFormGroup } from './audit-builder-form';
import { MatFabButton } from '@angular/material/button';
import { OptionsFieldComponent } from './fields/options-field.component';
import { distinctUntilChanged, skip, startWith, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToTitleCasePipe } from './utils/toTitleCase.pipe';
import { InputFieldComponent } from './fields/input-field.component';
import { ArrayFieldComponent } from './fields/array-field.component';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'ui-audit-builder-step',
  template: `
    <mat-expansion-panel [expanded]="true">
      @let control = stepControl();
      <mat-expansion-panel-header>
        <mat-panel-title>
          @if (control.controls['type'].value; as stepType) {
            <span class="step-title">
              <mat-icon
                [svgIcon]="isLighthouseStep(stepType) ? 'lighthouse-badge' : 'puppeteer-badge'"
                class="step-source-icon"
                aria-hidden="true"
              />
              <span class="step-title__text">{{ stepType | toTitleCase }}</span>
            </span>
          } @else {
            Audit Step Required!
          }
        </mat-panel-title>
      </mat-expansion-panel-header>
      <ng-content />
      <ng-container>
        @for (stepField of control.fields(); track stepField) {
          @let fieldType = control.stepProperty(stepField).inputType;
          @switch (fieldType) {
            @case ('options') {
              <ui-options-field
                [field]="control.formControlField(stepField)"
                (removeRequested)="control.removeOptionalField(stepField)"
              />
            }
            @case ('string') {
              <ui-input-field
                [field]="control.formControlField(stepField)"
                (removeRequested)="control.removeOptionalField(stepField)"
              />
            }
            @case ('number') {
              <ui-input-field
                [field]="control.formControlField(stepField)"
                (removeRequested)="control.removeOptionalField(stepField)"
              />
            }
            @case ('boolean') {
              <ui-options-field
                [field]="control.formControlField(stepField)"
                (removeRequested)="control.removeOptionalField(stepField)"
              />
            }
            @case ('stringArray') {
              <ui-array-field
                [field]="control.stringArrayField(stepField)"
                (removeRequested)="control.removeOptionalField(stepField)"
              />
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
        <div class="add-optional-field">
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
    ToTitleCasePipe,
    InputFieldComponent,
    ArrayFieldComponent,
    MatIcon,
  ],
  styles: `
    .step-title {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .step-title__text {
      min-width: 0;
    }

    .step-source-icon {
      width: 28px;
      height: 28px;
      flex: 0 0 28px;
    }

    .add-optional-field {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditStepComponent {
  stepControl = input.required<StepFormGroup>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly lighthouseStepTypes = new Set<string>(Object.values(LIGHTHOUSE_AUDIT_STEP_TYPE));

  constructor() {
    afterNextRender(() => this.handleStepTypeChange());
  }

  protected isLighthouseStep(stepType: string): boolean {
    return this.lighthouseStepTypes.has(stepType);
  }

  private handleStepTypeChange(): void {
    const stepTypeControl = this.stepControl().controls['type'];
    stepTypeControl.valueChanges
      .pipe(
        startWith(stepTypeControl.value),
        distinctUntilChanged(),
        skip(1),
        tap((newStepType) => this.stepControl().resetStepControls(newStepType)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
