import { Component, inject, Input } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';

import { ToTitleCasePipe } from '../utils/toTitleCase.pipe';
import { AuditBuilderService } from './audit-builder.service';
import { StepActionDialogComponent } from './action-dialog.component';
import { StepPropertyComponent } from '../property-input/property.component';
import { MatFabButton } from '@angular/material/button';

@Component({
  selector: 'builder-audit-step',
  imports: [
    ToTitleCasePipe,
    StepActionDialogComponent,
    StepPropertyComponent,
    KeyValuePipe,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatFabButton,
  ],
  template: `
    <mat-expansion-panel [expanded]="true">
      <mat-expansion-panel-header>
        <mat-panel-title>
          @if (builder.steps.at(stepIndex).get('type')!.value; as title) {
            {{ title | toTitleCase }}
          } @else {
            Audit Step Required!
          }
        </mat-panel-title>
      </mat-expansion-panel-header>
      <builder-step-action-dialog [stepIndex]="stepIndex" class="toggle_menu" />
      @for (key of builder.getStepPropertyKeys(stepIndex); track key) {
        <builder-step-property [controlKey]="key" [stepIndex]="stepIndex" />
      }
      @for (key of builder.getStepOptionalProperties(stepIndex); track key) {
        <button
          mat-fab
          [extended]="true"
          [disabled]="builder.formGroup.disabled"
          color="primary"
          type="button"
          (click)="builder.addStepProperty(stepIndex, key)"
        >
          Add {{ key }}
        </button>
      }
    </mat-expansion-panel>
  `,
  styles: `
    .toggle_menu {
      position: absolute;
      top: 48px;
      @media only screen and (min-width: 600px) {
        right: 16px;
      }
      @media only screen and (max-width: 599px) {
        right: 4px;
      }
    }
  `,
})
export class AuditStepComponent {
  @Input({ required: true }) stepIndex!: number;
  builder = inject(AuditBuilderService);
}
