import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { StepFormGroup } from './audit-builder-form';
import { MatOptgroup, MatOption } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { distinctUntilChanged, skip, startWith, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { MatSelect } from '@angular/material/select';
import { getContractStepPresentation, STEP_SELECTION_OPTIONS_GROUPED } from '../contract-step-presentation';
import { ContractStepFieldsComponent } from './contract-step-fields.component';

@Component({
  selector: 'ui-audit-builder-step',
  template: `
    <mat-expansion-panel [expanded]="true">
      @let control = stepControl();
      <mat-expansion-panel-header>
        <mat-panel-title>
          @if (control.selectionControl.value; as stepType) {
            <span class="step-title">
              <mat-icon [svgIcon]="getStepPresentation(stepType).icon" class="step-source-icon" aria-hidden="true" />
              <span class="step-title__text">{{ getStepPresentation(stepType).label }}</span>
            </span>
          } @else {
            Audit Step Required!
          }
        </mat-panel-title>
      </mat-expansion-panel-header>
      <ng-content />
      <mat-form-field>
        <mat-label>Type</mat-label>
        <mat-select [formControl]="control.selectionControl">
          <mat-option value=""></mat-option>
          @for (optionGroup of stepTypeOptions; track optionGroup.label) {
            <mat-optgroup>
              <span class="option-group-label">
                <mat-icon [svgIcon]="optionGroup.icon" aria-hidden="true" />
                <span>{{ optionGroup.label }}</span>
              </span>
              @for (option of optionGroup.options; track option) {
                <mat-option [value]="option">{{ getStepPresentation(option).label }}</mat-option>
              }
            </mat-optgroup>
          }
        </mat-select>
      </mat-form-field>

      @if (control.hasContract) {
        <builder-contract-step-fields
          [variantId]="control.selectionControl.value"
          [fields]="control.contract.fields"
          [control]="control"
          [stepForm]="control"
        />
      }
    </mat-expansion-panel>
  `,
  imports: [
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatOptgroup,
    MatIcon,
    ContractStepFieldsComponent,
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

    .option-group-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditStepComponent {
  stepControl = input.required<StepFormGroup>();
  private readonly destroyRef = inject(DestroyRef);
  protected readonly stepTypeOptions = STEP_SELECTION_OPTIONS_GROUPED;

  constructor() {
    afterNextRender(() => this.handleStepTypeChange());
  }

  protected getStepPresentation(stepType: string) {
    return getContractStepPresentation(stepType);
  }

  private handleStepTypeChange(): void {
    const stepSelectionControl = this.stepControl().selectionControl;

    stepSelectionControl.valueChanges
      .pipe(
        startWith(stepSelectionControl.value),
        distinctUntilChanged(),
        skip(1),
        tap((newStepType) => this.stepControl().resetStepControls(newStepType)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
