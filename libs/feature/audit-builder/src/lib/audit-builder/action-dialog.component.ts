import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RxFor } from '@rx-angular/template/for';

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
    NgIf,
    RxFor,
  ],
  template: `
    <ng-container *ngIf='actions'>
      <button  
        class='toggle_menu'
        mat-icon-button
        [matMenuTriggerFor]="menu"
        aria-label="Toggle menu"
        (click)='$event.preventDefault()'
      >
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #menu="matMenu" xPosition="before">
        <button 
          *rxFor='let action of actions'
          mat-menu-item
          (click)='selected.emit(action.output)'
        >
          {{ action.display }}
        </button>
      </mat-menu>
    </ng-container>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepActionDialogComponent {
  @Input() actions?: DialogAction[]
  @Output() selected = new EventEmitter();
}
