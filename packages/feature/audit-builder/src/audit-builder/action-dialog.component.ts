import { Component, inject, Input } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { AuditBuilderService } from './audit-builder.service';

@Component({
  selector: 'builder-step-action-dialog',
  template: `
    <button class="toggle_menu" mat-icon-button [matMenuTriggerFor]="menu" aria-label="Toggle menu">
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #menu="matMenu" xPosition="before">
      <button mat-menu-item (click)="builder.removeStep(stepIndex)">Remove Step</button>
      <button mat-menu-item (click)="builder.addStep(stepIndex)">Add Step Before</button>
      <button mat-menu-item (click)="builder.addStep(stepIndex + 1)">Add Step After</button>
    </mat-menu>
  `,
  standalone: true,
  imports: [MatIconButton, MatMenuTrigger, MatIcon, MatMenu, MatMenuItem],
})
export class StepActionDialogComponent {
  @Input({ required: true }) stepIndex!: number;
  builder = inject(AuditBuilderService);
}
