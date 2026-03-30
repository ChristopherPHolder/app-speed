import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import {
  MatCard,
  MatCardContent,
  MatCardFooter,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle,
} from '@angular/material/card';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import type { StatusDialogViewModel } from './status-dialog-view-model';

@Component({
  selector: 'lib-status-dialog',
  template: `
    @let vm = viewModel();
    <mat-card class="status-card">
      <mat-card-header>
        <mat-card-title>{{ vm.title || 'loading...' }}</mat-card-title>
        @if (vm.subtitle) {
          <mat-card-subtitle>{{ vm.subtitle }}</mat-card-subtitle>
        }
      </mat-card-header>
      <mat-card-content [style.padding-top]="'16px'">
        <mat-spinner [diameter]="64" />
      </mat-card-content>
      @if (vm.footerText) {
        <mat-card-footer [style.padding]="'0 16px 0 16px'">
          <p><small>{{ vm.footerText }}</small></p>
        </mat-card-footer>
      }
    </mat-card>
  `,
  imports: [MatCard, MatCardContent, MatCardFooter, MatCardHeader, MatCardSubtitle, MatCardTitle, MatProgressSpinner],
  styles: `
    :host {
      margin: 20px;
    }

    .status-card {
      align-items: center;
      text-align: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusDialogComponent {
  readonly viewModel = inject<Signal<StatusDialogViewModel>>(MAT_DIALOG_DATA);
}
