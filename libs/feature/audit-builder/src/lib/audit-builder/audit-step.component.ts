import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { KeyValuePipe, NgFor, NgIf } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { ToTitleCasePipe } from './toTitleCase.pipe';
import { AuditBuilderService } from './audit-builder.service';
import { DialogActions, StepActionDialogComponent } from './action-dialog.component';
import { StepPropertyComponent } from './property.component';
import { PropertyName } from './audit-builder.types';

@Component({
  selector: 'lib-audit-step',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    MatExpansionModule,
    ToTitleCasePipe,
    ToTitleCasePipe,
    StepActionDialogComponent,
    StepPropertyComponent,
    KeyValuePipe,
  ],
  template: `
    <mat-expansion-panel [expanded]='true'>
      <mat-expansion-panel-header>
        <mat-panel-title>
          {{(builder.steps.at(stepIndex).get('type')!.value | toTitleCase) || 'Audit Step Required!'}}
        </mat-panel-title>
      </mat-expansion-panel-header>
      <lib-step-action-dialog [actions]='actions' class='toggle_menu'/>
      <lib-step-property *ngFor='let key of getPropertyKey()' [controlKey]='key' [stepIndex]='stepIndex' />
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

  getPropertyKey(): PropertyName[] {
    return Object.keys(this.builder.formGroup.controls.steps.at(this.stepIndex).controls) as PropertyName[];
  }

  actions: DialogActions = [
    { display: 'Remove Step', output: "remove" },
    { display: 'Add Step Before', output: "add-before" },
    { display: 'Add Step After', output: "add-after" },
  ]
}
