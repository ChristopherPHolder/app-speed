import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Result } from 'lighthouse';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRecycleRows,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { ScrollContainerComponent } from '@ui/scroller-container';
import { RadialChartComponent } from 'ui';
import { ViewerScoreComponent } from './viewer-score.component';

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
  selector: 'viewer-audit-summary',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Audit Summery</mat-card-title>
      </mat-card-header>
      <ui-scroll-container>
        <mat-card-content style='overflow: auto;'>
          <table mat-table recycleRows [dataSource]='auditSummary().stepSummaries'>

            <ng-container matColumnDef='thumbnail'>
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef='let element' style='border: none;'>
                <div class='center-row-content' style='padding: 5px 0'>
                  <img [src]='element.thumbnail.data' height='80' alt=''>
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
              <td mat-cell *matCellDef='let element'>{{ element.name }}</td>
            </ng-container>

            @for (category of categories; track category.id) {
              <ng-container [matColumnDef]='category.key'>
                <th mat-header-cell *matHeaderCellDef class='center-header'>{{category.title}}</th>
                <td mat-cell *matCellDef='let element'>
                  <div class='center-row-content'>
                    <viewer-score [category]='element.categories[category.id]'/>
                  </div>
                </td>
              </ng-container>
            }

            <tr mat-header-row *matHeaderRowDef='displayedColumns'></tr>
            <tr mat-row *matRowDef='let row; columns: displayedColumns;'></tr>
          </table>
        </mat-card-content>
      </ui-scroll-container>
    </mat-card>

  `,
  styles: [`
      .center-row-content {
          width: 100%;
          display: flex;
          justify-content: center;
      }
      .center-header {
          text-align: center;
      }
      .mat-mdc-row .mat-mdc-cell {
          cursor: pointer;
      }
      .mat-mdc-row:hover .mat-mdc-cell {
          background-color: var(--mdc-switch-selected-track-color);
      }
  `],
  standalone: true,
  imports: [
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
    ViewerScoreComponent,
    ScrollContainerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditSummaryComponent {
  auditSummary = input.required<AuditSummary>();

  readonly displayedColumns = [
    'thumbnail', 'gatherMode', 'name', 'performance', 'accessibility', 'bestPractices', 'seo'
  ];
  readonly categories = [
    { title: 'Performance', id: 'performance', key: 'performance' },
    { title: 'Accessibility', id: 'accessibility', key: 'accessibility' },
    { title: 'Best Practices', id: 'best-practices', key: 'bestPractices' },
    { title: 'SEO', id: 'seo', key: 'seo' },
  ];
}
