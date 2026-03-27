import { Component, inject, Signal } from '@angular/core';
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
import type { LoadingStatusViewModel } from './loading-status.models';

@Component({
  selector: 'loading-status',
  template: `
    <mat-card class="loading-card">
      <mat-card-header>
        <mat-card-title>{{ data().title || 'loading...' }}</mat-card-title>
        @if (data().subtitle) {
          <mat-card-subtitle>{{ data().subtitle }}</mat-card-subtitle>
        }
      </mat-card-header>
      <mat-card-content [style.padding-top]="'16px'">
        <mat-spinner [diameter]="64" />
      </mat-card-content>
      @if (data().footerText) {
        <mat-card-footer [style.padding]="'0 16px 0 16px'">
          <p><small>{{ data().footerText }}</small></p>
        </mat-card-footer>
      }
    </mat-card>
  `,
  imports: [MatCard, MatCardContent, MatCardFooter, MatCardHeader, MatCardSubtitle, MatCardTitle, MatProgressSpinner],
  styles: `
    :host {
      margin: 20px;
    }

    .loading-card {
      align-items: center;
      text-align: center;
    }
  `,
})
export class LoadingStatusComponent {
  readonly data = inject<Signal<LoadingStatusViewModel>>(MAT_DIALOG_DATA);
}
