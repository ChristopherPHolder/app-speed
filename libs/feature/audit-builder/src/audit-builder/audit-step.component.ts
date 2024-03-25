import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';

import { ToTitleCasePipe } from '../utils/toTitleCase.pipe';
import { AuditBuilderService } from './audit-builder.service';
import { StepActionDialogComponent } from './action-dialog.component';
import { StepPropertyComponent } from '../property-input/property.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'lib-audit-step',
  standalone: true,
  imports: [
    MatExpansionModule,
    ToTitleCasePipe,
    StepActionDialogComponent,
    StepPropertyComponent,
    KeyValuePipe,
    MatButtonModule,
  ],
  template: `
    <mat-expansion-panel [expanded]='true'>
      <mat-expansion-panel-header>
        <mat-panel-title>
            @if (builder.steps.at(stepIndex).get('type')!.value; as title) {
                {{ title | toTitleCase }}
            } @else {
                Audit Step Required!
            }
        </mat-panel-title>
      </mat-expansion-panel-header>
      <lib-step-action-dialog [stepIndex]='stepIndex' class='toggle_menu'/>
        @for (key of builder.getStepPropertyKeys(stepIndex); track key) {
            <lib-step-property [controlKey]='key' [stepIndex]='stepIndex' />
        }
        @for (key of builder.getStepOptionalProperties(stepIndex); track key) {
            <button mat-fab [extended]='true' color="primary" (click)='builder.addStepProperty(stepIndex, key)'>
                Add {{ key }}
            </button>
        }
    </mat-expansion-panel>
  `,
  styles: [
    `.toggle_menu {
        position: absolute;
        top: 48px;
        @media only screen and (min-width: 600px) {
            right: 16px;
        }
        @media only screen and (max-width: 599px) {
            right: 4px;
        }
    }`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditStepComponent {
  @Input({required: true}) stepIndex!: number;
  builder = inject(AuditBuilderService);
}
