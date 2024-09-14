import { Component, inject, Input } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { AuditBuilderService } from './audit-builder.service';

@Component({
  selector: 'builder-step-action-dialog',
  template: `
    <button
      type="button"
      mat-icon-button
      class="toggle_menu"
      aria-label="Toggle menu"
      [matMenuTriggerFor]="menu"
      [disabled]="builder.formGroup.disabled"
    >
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #menu="matMenu" xPosition="before">
      <button type="button" mat-menu-item (click)="builder.removeStep(stepIndex)">Remove Step</button>
      <button type="button" mat-menu-item (click)="builder.addStep(stepIndex)">Add Step Before</button>
      <button type="button" mat-menu-item (click)="builder.addStep(stepIndex + 1)">Add Step After</button>
    </mat-menu>
  `,
  standalone: true,
  imports: [MatIconButton, MatMenuTrigger, MatIcon, MatMenu, MatMenuItem],
})
export class StepActionDialogComponent {
  @Input({ required: true }) stepIndex!: number;
  builder = inject(AuditBuilderService);
}
