import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { StepFormGroup } from './audit-builder-form';
import { MatFabButton, MatIconButton } from '@angular/material/button';
import { MatOption, MatOptgroup } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { distinctUntilChanged, skip, startWith, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ArrayField, InputField, OptionsField } from '@app-speed/audit/portal/ui/form-fields';
import { MatIcon } from '@angular/material/icon';
import { MatSelect } from '@angular/material/select';
import { ToTitleCasePipe } from '@app-speed/audit/portal/ui';
import { AUDIT_STEP_SELECTION_OPTIONS, STEP_SELECTION_OPTIONS_GROUPED } from '../step-property.model';

@Component({
  selector: 'ui-audit-builder-step',
  template: `
    <mat-expansion-panel [expanded]="true">
      @let control = stepControl();
      <mat-expansion-panel-header>
        <mat-panel-title>
          @if (control.selectionControl.value; as stepType) {
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
                  <mat-option [value]="option">{{ option }}</mat-option>
                }
              </mat-optgroup>
            }
          </mat-select>
        </mat-form-field>
        @for (stepField of control.fields(); track stepField) {
          @let fieldType = control.stepProperty(stepField).inputType;
          @switch (fieldType) {
            @case ('options') {
              @let field = control.formControlField(stepField);
              <ui-options-field [field]="field">
                @if (field.removable) {
                  <button
                    field-action
                    mat-icon-button
                    [disabled]="field.control.disabled"
                    aria-label="Delete property from step"
                    type="button"
                    (click)="control.removeOptionalField(stepField)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </ui-options-field>
            }
            @case ('string') {
              @let field = control.inputField(stepField);
              <ui-input-field [field]="field">
                @if (field.removable) {
                  <button
                    field-action
                    mat-icon-button
                    [disabled]="field.control.disabled"
                    aria-label="Delete property from step"
                    type="button"
                    (click)="control.removeOptionalField(stepField)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </ui-input-field>
            }
            @case ('number') {
              @let field = control.inputField(stepField);
              <ui-input-field [field]="field">
                @if (field.removable) {
                  <button
                    field-action
                    mat-icon-button
                    [disabled]="field.control.disabled"
                    aria-label="Delete property from step"
                    type="button"
                    (click)="control.removeOptionalField(stepField)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </ui-input-field>
            }
            @case ('boolean') {
              @let field = control.formControlField(stepField);
              <ui-options-field [field]="field">
                @if (field.removable) {
                  <button
                    field-action
                    mat-icon-button
                    [disabled]="field.control.disabled"
                    aria-label="Delete property from step"
                    type="button"
                    (click)="control.removeOptionalField(stepField)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </ui-options-field>
            }
            @case ('stringArray') {
              @let field = control.stringArrayField(stepField);
              <ui-array-field [field]="field">
                @if (field.removable) {
                  <button
                    field-action
                    mat-icon-button
                    [disabled]="field.control.disabled"
                    aria-label="Delete property from step"
                    type="button"
                    (click)="control.removeOptionalField(stepField)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </ui-array-field>
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
    ReactiveFormsModule,
    MatFabButton,
    MatIconButton,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatOptgroup,
    OptionsField,
    ToTitleCasePipe,
    InputField,
    ArrayField,
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
  private readonly lighthouseStepTypes = new Set<string>(AUDIT_STEP_SELECTION_OPTIONS);
  protected readonly stepTypeOptions = STEP_SELECTION_OPTIONS_GROUPED;

  constructor() {
    afterNextRender(() => this.handleStepTypeChange());
  }

  protected isLighthouseStep(stepType: string): boolean {
    return this.lighthouseStepTypes.has(stepType);
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
