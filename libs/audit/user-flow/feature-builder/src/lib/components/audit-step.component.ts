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
import { provideBuilderFormFieldDefaults } from './form-field-defaults';
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
            Choose a step type
          }
        </mat-panel-title>
      </mat-expansion-panel-header>
      <mat-form-field appearance="outline">
        <mat-label>Step type</mat-label>
        <mat-select [formControl]="control.selectionControl">
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
    <!-- Step actions sit beside the panel header, not inside it, so they don't toggle the panel. -->
    <div class="step-actions"><ng-content /></div>
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
  providers: [provideBuilderFormFieldDefaults()],
  styles: `
    :host {
      --step-header-height: 56px;
      display: block;
      position: relative;
    }

    mat-expansion-panel {
      --mat-expansion-header-collapsed-state-height: var(--step-header-height);
      --mat-expansion-header-expanded-state-height: var(--step-header-height);
      margin: 0;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface);
      box-shadow: none;
    }

    mat-panel-title {
      /* Leave room for the step actions that overlay the header. */
      margin-inline-end: var(--ui-space-12);
    }

    .step-actions {
      position: absolute;
      /* Centre the 40dp icon button on the header. */
      top: calc((var(--step-header-height) - 40px) / 2);
      inset-inline-end: var(--ui-space-12);
    }

    .step-actions:empty {
      display: none;
    }

    .step-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      min-width: 28px;
      height: 28px;
      padding-inline: var(--ui-space-1);
      box-sizing: border-box;
      margin-inline-end: var(--ui-space-3);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-full);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
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
      gap: var(--ui-space-3);
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
      gap: var(--ui-space-2);
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
