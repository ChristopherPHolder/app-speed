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
import { getStepPresentation, STEP_SELECTION_OPTIONS_GROUPED } from '../step-presentation';
import { StepFieldsComponent } from './step-fields.component';

@Component({
  selector: 'ui-audit-builder-step',
  template: `
    <mat-expansion-panel class="mat-elevation-z0" [expanded]="expanded()">
      @let control = stepControl();
      <mat-expansion-panel-header>
        <mat-panel-title>
          @if (stepNumber(); as number) {
            <span class="step-number"><span class="step-number__label">Step </span>{{ number }}</span>
          }
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
      <mat-form-field appearance="outline">
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
      @if (control.hasSpec) {
        <builder-step-fields
          [variantId]="control.selectionControl.value"
          [fields]="control.spec.fields"
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
    StepFieldsComponent,
  ],
  styles: `
    :host {
      display: block;
      position: relative;
    }

    mat-expansion-panel {
      margin: 0;
      background: #fff;
      border: 1px solid #e1e5ea;
      box-shadow: none;
      border-radius: 10px;
    }

    .step-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      min-width: 28px;
      height: 28px;
      padding-inline: 4px;
      box-sizing: border-box;
      margin-right: 12px;
      border: 1px solid var(--mat-sys-outline-variant, #c4c7ce);
      border-radius: 50%;
      color: var(--mat-sys-on-surface-variant, #45464f);
      font-size: 13px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .step-number__label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

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
  expanded = input(true);
  stepNumber = input<number>();
  private readonly destroyRef = inject(DestroyRef);
  protected readonly stepTypeOptions = STEP_SELECTION_OPTIONS_GROUPED;

  constructor() {
    afterNextRender(() => this.handleStepTypeChange());
  }

  protected getStepPresentation(stepType: string) {
    return getStepPresentation(stepType);
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
