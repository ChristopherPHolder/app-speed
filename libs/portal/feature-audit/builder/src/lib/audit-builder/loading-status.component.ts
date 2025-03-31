import { Component, input } from '@angular/core';
import {
  MatCard,
  MatCardContent,
  MatCardFooter,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle,
} from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'loading-status',
  template: `
    <mat-card class="loading-card">
      <mat-card-header>
        <mat-card-title>title</mat-card-title>
        <mat-card-subtitle>subtitle</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content [style.padding-top]="'16px'">
        <mat-spinner [diameter]="64" />
      </mat-card-content>
      <mat-card-footer>
        <p><small>If this loader is confusing please opening a ticket with suggestions!</small></p>
      </mat-card-footer>
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
  // title = input.required<string>();
  // subtitle = input.required<string>();
  // footer = input.required<string>();
}
