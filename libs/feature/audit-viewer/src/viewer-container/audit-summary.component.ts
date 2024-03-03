import { Component, input } from '@angular/core';
import { JsonPipe, NgOptimizedImage } from '@angular/common';
import { Result } from 'lighthouse';
import {
  MatCell, MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef,
  MatRecycleRows, MatRow, MatRowDef,
  MatTable,
} from '@angular/material/table';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { RadialChartComponent } from 'ui';

export type StepSummary = {
  thumbnail: { data: string, width: number, height: number }
  gatherMode: Result.GatherMode;
  name: string;
  categories: Record<string, Result.Category>
};
export type AuditSummary = {
  stepSummaries: StepSummary[],
};

@Component({
  selector: 'lib-audit-summary',
  template: `
    <mat-card style='margin: 20px'>
      <mat-card-header>
        <mat-card-title>Audit Summery</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <table mat-table recycleRows [dataSource]='auditSummary().stepSummaries'>

          <ng-container matColumnDef='thumbnail'>
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef='let element' style='border: none;'>
              <div class='center-row-content'>
                <img [src]='element.thumbnail.data' height='100'>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef='gatherMode'>
            <th mat-header-cell *matHeaderCellDef class='center-header'>Gather Mode</th>
            <td mat-cell *matCellDef='let element' style='border: none;'>
              <div class='center-row-content'>
                @switch (element.gatherMode) {
                  @case ('navigation') {
                    <mat-icon style='transform: scale(1.5);'>assistant_navigation</mat-icon>
                  }
                  @case ('timespan') {
                    <mat-icon style='transform: scale(1.5);'>schedule</mat-icon>
                  }
                  @case ('snapshot') {
                    <mat-icon style='transform: scale(1.5);'>camera</mat-icon>
                  }
                }
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef='name'>
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef='let element'> {{ element.name }}</td>
          </ng-container>

          <ng-container matColumnDef='performance'>
            <th mat-header-cell *matHeaderCellDef class='center-header'>Performance</th>
            <td mat-cell *matCellDef='let element'>
              
              @if (element.categories["performance"]["score"]; as score) {
                <ui-radial-chart [score]='score * 100' />
              } @else {
                <div class='center-row-content'>
                  <mat-icon>horizontal_rule</mat-icon>
                </div>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef='accessibility'>
            <th mat-header-cell *matHeaderCellDef class='center-header'>Accessibility</th>
            <td mat-cell *matCellDef='let element'>
              @if (element.categories["accessibility"]?.["score"]; as score) {
                <ui-radial-chart [score]='score * 100' />
              } @else {
                <div class='center-row-content'>
                  <mat-icon>horizontal_rule</mat-icon>
                </div>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef='bestPractices'>
            <th mat-header-cell *matHeaderCellDef class='center-header'>Best Practices</th>
            <td mat-cell *matCellDef='let element'>
              @if (element.categories["best-practices"]?.["score"]; as score) {
                <ui-radial-chart [score]='score * 100' />
              } @else {
                <div class='center-row-content'>
                  <mat-icon>horizontal_rule</mat-icon>
                </div>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef='seo'>
            <th mat-header-cell *matHeaderCellDef class='center-header'>SEO</th>
            <td mat-cell *matCellDef='let element'>
              @if (element.categories["seo"]?.["score"]; as score) {
                <ui-radial-chart [score]='score * 100' />
              } @else {
                <div class='center-row-content'>
                  <mat-icon>horizontal_rule</mat-icon>
                </div>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef='displayedColumns'></tr>
          <tr mat-row *matRowDef='let row; columns: displayedColumns;'></tr>
        </table>
      </mat-card-content>
    </mat-card>

  `,
  standalone: true,
  imports: [
    JsonPipe,
    NgOptimizedImage,
    MatTable,
    MatRecycleRows,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatCell,
    MatCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatIcon,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    RadialChartComponent,
  ],
  styles: [`
      .center-row-content {
          width: 100%;
          display: flex;
          justify-content: center;
      }

      .center-header {
          text-align: center;
      }
  `]
})
export class AuditSummaryComponent {
  auditSummary = input.required<AuditSummary>();
  displayedColumns = [
    'thumbnail',
    'gatherMode',
    'name',
    'performance',
    'accessibility',
    'bestPractices',
    'seo'
  ];
}
