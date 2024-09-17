import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { FlowResult } from 'lighthouse';
import { Result as AuditResult } from 'lighthouse/types/lhr/audit-result';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';

import { StatusOptions, STATUS } from '@app-speed/ui/status-badge';
import { MetricSummary, ViewerStepMetricSummaryComponent } from './viewer-step-metric-summary.component';
import { ViewerFileStripComponent } from './viewer-file-strip.component';
import { ViewerDiagnosticComponent } from './viewer-diagnostic.component';
import { DiagnosticItem } from './viewer-diagnostic-panel.component';
import { metricAudits, metricResults } from './view-step-details.adaptor';

@Component({
  selector: 'viewer-step-detail',
  template: `
    <mat-card>
      <mat-card-content>
        <viewer-step-metric-summary [metricSummary]="categoryMetricSummary()[0]['performance']" />
      </mat-card-content>
    </mat-card>

    <mat-card>
      <mat-card-header>
        <mat-card-title> Film Strip </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <viewer-file-strip [filmStrip]="filmStrip()" />
      </mat-card-content>
    </mat-card>

    <mat-card>
      <mat-card-header>
        <mat-card-title>DIAGNOSTICS</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <viewer-diagnostic [items]="diagnosticItems()" />
      </mat-card-content>
    </mat-card>
  `,
  standalone: true,
  imports: [
    MatTable,
    ViewerStepMetricSummaryComponent,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatIcon,
    ViewerFileStripComponent,
    ViewerDiagnosticComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerStepDetailComponent {
  stepDetails = input.required<FlowResult.Step>();
  categories = computed(() => this.stepDetails().lhr.categories);
  categoryMetricSummary = computed<Record<string, MetricSummary[]>[]>(() => {
    return this.categoriesMetricSummary(this.stepDetails().lhr.categories);
  });
  filmStrip = computed(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return this.stepDetails().lhr.audits['screenshot-thumbnails']['details']?.['items'] as any as { data: string }[];
  });

  private categoryAcronyms = computed(() => {
    return this.stepDetails()
      .lhr.categories['performance']['auditRefs'].filter((v) => v.group === 'metrics')
      .map((v) => v.acronym);
  });

  diagnostics = computed(() => {
    const report = this.stepDetails().lhr;
    const audits = report.categories['performance']['auditRefs']
      .filter((v) => v.group !== 'metrics' && v.group !== 'hidden')
      .map((v) => report.audits[v.id])
      .filter((v) => !!v.guidanceLevel);
    const failedAudits = audits.filter((v) => v.score !== 1 && v.score !== null);
    const passedAudits = audits.filter((v) => v.score === 1 || v.score === null);
    return { failed: failedAudits, passed: passedAudits };
  });

  private readonly failedAudits = computed(() => this.diagnostics().failed);
  private readonly alertItems = computed(() =>
    this.failedAudits().filter((v) => {
      return (
        v.guidanceLevel === 1 &&
        Object.keys(v.metricSavings || {}).filter((i) => this.categoryAcronyms().includes(i)).length
      );
    }),
  );
  warnItems = computed(() => {
    const alertIds = this.alertItems().map((v) => v.id);
    return this.failedAudits().filter((v) => !alertIds.includes(v.id));
  });
  informItems = computed(() => {
    return this.diagnostics().passed.filter(
      ({ metricSavings }) => !!metricSavings && this.affectsMetric(Object.keys(metricSavings || {})),
    );
  });

  private diagnosticItemsMapper = (status: StatusOptions) => (results: AuditResult) => {
    const { id, title, displayValue, description, details, metricSavings } = results;
    return { id, status, title, displayValue, description, details, affectedMetrics: Object.keys(metricSavings || {}) };
  };

  diagnosticItems = computed<DiagnosticItem[]>(() => {
    return [
      this.alertItems().map(this.diagnosticItemsMapper(STATUS.ALERT)),
      this.warnItems().map(this.diagnosticItemsMapper(STATUS.WARN)),
      this.informItems().map(this.diagnosticItemsMapper(STATUS.INFO)),
    ].flat();
  });

  private affectsMetric(metricSavings: string[]): boolean {
    return !!metricSavings.filter((i) => this.categoryAcronyms().includes(i)).length;
  }
  private categoriesMetricSummary(categories: FlowResult.Step['lhr']['categories']): Record<string, MetricSummary[]>[] {
    return Object.entries(categories).map(([key, value]) => ({
      [key]: metricResults(metricAudits(value.auditRefs), this.stepDetails().lhr.audits),
    }));
  }
}
