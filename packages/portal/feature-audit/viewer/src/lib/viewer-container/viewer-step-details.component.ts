import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FlowResult } from 'lighthouse';
import { Result as AuditResult } from 'lighthouse/types/lhr/audit-result';

import { STATUS, StatusOptions } from '@app-speed/portal-ui/status-badge';
import { MetricSummary, ViewerStepMetricSummaryComponent } from './viewer-step-metric-summary.component';
import { ViewerFileStripComponent } from './viewer-file-strip.component';
import { ViewerDiagnosticComponent } from './viewer-diagnostic.component';
import { DiagnosticItem } from './viewer-diagnostic-panel.component';
import { metricAudits, metricResults } from './view-step-details.adaptor';

@Component({
  selector: 'viewer-step-detail',
  template: `
    @let metricSummary = categoryMetricSummary();
    @if (metricSummary.length) {
      <viewer-step-metric-summary [metricSummary]="metricSummary" class="pad" />
    }

    @if (filmStrip(); as filmStrip) {
      <viewer-file-strip [filmStrip]="filmStrip" />
    }

    <div>DIAGNOSTICS</div>
    <viewer-diagnostic class="pad" [items]="diagnosticItems()" />
  `,
  standalone: true,
  imports: [ViewerStepMetricSummaryComponent, ViewerFileStripComponent, ViewerDiagnosticComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      max-width: 1200px;
      margin: auto;
      padding: 20px;
    }
    .pad {
      padding: 20px;
    }
  `,
})
export class ViewerStepDetailComponent {
  stepDetails = input.required<FlowResult.Step>();
  categories = computed(() => this.stepDetails().lhr.categories);
  categoryMetricSummary = computed<MetricSummary[]>(() => {
    return this.categoriesMetricSummary(this.stepDetails().lhr.categories);
  });
  filmStrip = computed<{ data: string }[] | undefined>(() => {
    // @ts-expect-error Can't extract valid audit type from lighthouse
    return this.stepDetails().lhr.audits?.['screenshot-thumbnails']?.['details']?.['items'] as any as
      | { data: string }[]
      | undefined;
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
  private categoriesMetricSummary(categories: FlowResult.Step['lhr']['categories']): MetricSummary[] {
    return Object.entries(categories).map(([key, value]) => ({
      [key]: metricResults(metricAudits(value.auditRefs), this.stepDetails().lhr.audits),
    }))[0]['performance'];
  }
}
