import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FlowResult } from 'lighthouse';
import { Result as AuditResult } from 'lighthouse/types/lhr/audit-result';

import { STATUS, StatusOptions } from '@app-speed/portal-ui/status-badge';
import {
  DiagnosticItem,
  ViewerDiagnosticComponent,
  ViewerDiagnosticContext,
} from '@app-speed/portal-ui/viewer-diagnostics';
import { MetricSummary, ViewerStepMetricSummaryComponent } from './viewer-step-metric-summary.component';
import { ViewerFileStripComponent } from './viewer-file-strip.component';
import { metricAudits, metricResults } from './view-step-details.adaptor';

type PerformanceAuditRef = FlowResult.Step['lhr']['categories']['performance']['auditRefs'][number];
type DiagnosticAuditRef = PerformanceAuditRef & {
  result: AuditResult;
  stackPacks?: { title: string; iconDataURL: string; description: string }[];
};

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
    <ui-viewer-diagnostic class="pad" [items]="diagnosticItems()" [context]="diagnosticContext()" />
  `,
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
    const details = this.stepDetails().lhr.audits?.['screenshot-thumbnails']?.['details'];

    if (typeof details !== 'object' || details === null || !('items' in details)) {
      return undefined;
    }

    const items = details.items;
    return Array.isArray(items) ? (items as { data: string }[]) : undefined;
  });

  private categoryAcronyms = computed(() => {
    return this.stepDetails()
      .lhr.categories['performance']['auditRefs'].filter((v) => v.group === 'metrics')
      .map((v) => v.acronym);
  });

  private readonly performanceAuditRefs = computed(() => {
    return this.stepDetails().lhr.categories['performance']['auditRefs'].filter(
      (v) => v.group !== 'metrics' && v.group !== 'hidden',
    );
  });

  diagnostics = computed(() => {
    const report = this.stepDetails().lhr;
    const audits = this.performanceAuditRefs()
      .map(
        (auditRef): DiagnosticAuditRef => ({
          ...auditRef,
          result: report.audits[auditRef.id],
          stackPacks: this.resolveStackPacks(auditRef.id, report.audits[auditRef.id]),
        }),
      )
      .filter((v) => !!v.result.guidanceLevel);
    const failedAudits = audits.filter((v) => v.result.score !== 1 && v.result.score !== null);
    const passedAudits = audits.filter((v) => v.result.score === 1 || v.result.score === null);
    return { failed: failedAudits, passed: passedAudits };
  });

  private readonly failedAudits = computed(() => this.diagnostics().failed);
  private readonly alertItems = computed(() =>
    this.failedAudits().filter((v) => {
      return (
        v.result.guidanceLevel === 1 &&
        Object.keys(v.result.metricSavings || {}).filter((i) => this.categoryAcronyms().includes(i)).length
      );
    }),
  );
  warnItems = computed(() => {
    const alertIds = this.alertItems().map((v) => v.id);
    return this.failedAudits().filter((v) => !alertIds.includes(v.id));
  });
  informItems = computed(() => {
    return this.diagnostics().passed.filter(
      ({ result }) => !!result.metricSavings && this.affectsMetric(Object.keys(result.metricSavings || {})),
    );
  });

  private diagnosticItemsMapper =
    (status: StatusOptions) =>
    ({ result, weight, stackPacks }: DiagnosticAuditRef) => {
      const { id, title, displayValue, description, details, metricSavings } = result;
      return {
        id,
        status,
        title,
        displayValue,
        description,
        details,
        affectedMetrics: Object.keys(metricSavings || {}),
        unscored: weight === 0,
        stackPacks,
      };
    };

  diagnosticItems = computed<DiagnosticItem[]>(() => {
    return [
      this.alertItems().map(this.diagnosticItemsMapper(STATUS.ALERT)),
      this.warnItems().map(this.diagnosticItemsMapper(STATUS.WARN)),
      this.informItems().map(this.diagnosticItemsMapper(STATUS.INFO)),
    ].flat();
  });

  diagnosticContext = computed<ViewerDiagnosticContext>(() => {
    const lhr = this.stepDetails().lhr;
    return {
      finalDisplayedUrl: lhr.finalDisplayedUrl,
      entities: lhr.entities,
      fullPageScreenshot: lhr.fullPageScreenshot,
    };
  });

  private affectsMetric(metricSavings: string[]): boolean {
    return !!metricSavings.filter((i) => this.categoryAcronyms().includes(i)).length;
  }

  private resolveStackPacks(auditId: string, result: AuditResult): DiagnosticAuditRef['stackPacks'] {
    const stackPacks = this.stepDetails().lhr.stackPacks ?? [];
    const candidateIds = [auditId, ...(result.replacesAudits ?? [])];
    const matchedPacks = stackPacks.flatMap((pack) => {
      const description = candidateIds.map((id) => pack.descriptions[id]).find((value) => typeof value === 'string');
      return description ? [{ title: pack.title, iconDataURL: pack.iconDataURL, description }] : [];
    });

    return matchedPacks.length ? matchedPacks : undefined;
  }

  private categoriesMetricSummary(categories: FlowResult.Step['lhr']['categories']): MetricSummary[] {
    return Object.entries(categories).map(([key, value]) => ({
      [key]: metricResults(metricAudits(value.auditRefs), this.stepDetails().lhr.audits),
    }))[0]['performance'];
  }
}
