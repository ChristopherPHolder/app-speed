import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuditBuilderService } from './audit-builder.service';

export type DialogAction = {
  display: string;
  output?: string;
}
export type DialogActions = DialogAction[];

@Component({
  selector: 'lib-step-action-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  template: `
      <button class='toggle_menu' mat-icon-button [matMenuTriggerFor]="menu" aria-label="Toggle menu">
          <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #menu="matMenu" xPosition="before">
          <button mat-menu-item (click)='handleRemoveStep()'>Remove Step</button>
          <button mat-menu-item (click)='handleAddStep(0)'>Add Step Before</button>
          <button mat-menu-item (click)='handleAddStep(1)'>Add Step After</button>
      </mat-menu>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepActionDialogComponent {
  @Input({required: true}) stepIndex!: number;
  private builder = inject(AuditBuilderService);
  handleRemoveStep() {
    this.builder.removeStep(this.stepIndex);
  }
  handleAddStep(position: number) {
    this.builder.addStep(this.stepIndex + position);
  }
}
