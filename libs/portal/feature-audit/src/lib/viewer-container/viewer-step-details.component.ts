import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FlowResult } from 'lighthouse';
import { Result as AuditResult } from 'lighthouse/types/lhr/audit-result';

import { STATUS, StatusOptions } from '@app-speed/portal-ui/status-badge';
import {
  DiagnosticItem,
  ViewerDiagnosticComponent,
  ViewerDiagnosticContext,
} from '@app-speed/portal-ui/viewer-diagnostics';
import {
  passedAuditsGroupTitle,
  PerformanceMetricAudit,
  showAsPassed,
  sortFailedPerformanceAudits,
} from '../lighthouse-report-utils';
import { MdToAnkerPipe } from '../utils/md-to-anker.pipe';
import { MetricSummary, ViewerStepMetricSummaryComponent } from './viewer-step-metric-summary.component';
import { ViewerFileStripComponent } from './viewer-file-strip.component';
import { metricAudits, metricResults } from './view-step-details.adaptor';

type PerformanceAuditRef = FlowResult.Step['lhr']['categories']['performance']['auditRefs'][number];
type SectionKey = 'insights' | 'diagnostics' | 'passed';
type SectionMetadata = NonNullable<FlowResult.Step['lhr']['categoryGroups']>[string];
type DiagnosticAuditRef = PerformanceAuditRef & {
  result: AuditResult;
  stackPacks?: { title: string; iconDataURL: string; description: string }[];
};
type DiagnosticSection = {
  key: SectionKey;
  title: string;
  description?: string;
  items: DiagnosticItem[];
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

    @for (section of sections(); track section.key) {
      @if (section.items.length) {
        <section class="viewer-step-detail__section">
          <header class="viewer-step-detail__section-header pad">
            <h2 class="viewer-step-detail__section-title">{{ section.title }}</h2>
            @if (section.description) {
              <div class="viewer-step-detail__section-description" [innerHTML]="section.description | mdToAnker"></div>
            }
          </header>
          <ui-viewer-diagnostic class="pad" [items]="section.items" [context]="diagnosticContext()" />
        </section>
      }
    }
  `,
  imports: [ViewerStepMetricSummaryComponent, ViewerFileStripComponent, ViewerDiagnosticComponent, MdToAnkerPipe],
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

    .viewer-step-detail__section {
      display: grid;
      gap: 0;
      margin-top: 12px;
    }

    .viewer-step-detail__section-header {
      display: grid;
      gap: 8px;
      padding-bottom: 0;
    }

    .viewer-step-detail__section-title {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .viewer-step-detail__section-description {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.875rem;
      line-height: 1.5;
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
      (auditRef) => auditRef.group !== 'metrics',
    );
  });

  private readonly performanceMetricAudits = computed<PerformanceMetricAudit[]>(() => {
    const report = this.stepDetails().lhr;
    return this.stepDetails()
      .lhr.categories['performance']['auditRefs'].filter((auditRef) => auditRef.group === 'metrics')
      .map((auditRef) => ({
        ...auditRef,
        result: report.audits[auditRef.id],
      }));
  });

  private readonly performanceAudits = computed(() => {
    const report = this.stepDetails().lhr;
    return this.performanceAuditRefs().map(
      (auditRef): DiagnosticAuditRef => ({
        ...auditRef,
        result: report.audits[auditRef.id],
        stackPacks: this.resolveStackPacks(auditRef.id, report.audits[auditRef.id]),
      }),
    );
  });

  private readonly filterablePerformanceAudits = computed(() => {
    return this.performanceAudits().filter(
      (auditRef) => this.isInsightAudit(auditRef) || auditRef.group === 'diagnostics',
    );
  });

  private readonly failedFilterablePerformanceAudits = computed(() => {
    return sortFailedPerformanceAudits(
      this.filterablePerformanceAudits().filter(({ result }) => !showAsPassed(result)),
      this.performanceMetricAudits(),
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

  readonly insightItems = computed<DiagnosticItem[]>(() => {
    return this.failedDiagnosticItems(
      this.failedFilterablePerformanceAudits().filter((auditRef) => this.isInsightAudit(auditRef)),
    );
  });

  diagnosticItems = computed<DiagnosticItem[]>(() => {
    return this.failedDiagnosticItems(
      this.failedFilterablePerformanceAudits().filter((auditRef) => auditRef.group === 'diagnostics'),
    );
  });

  readonly passedItems = computed<DiagnosticItem[]>(() => {
    return this.filterablePerformanceAudits()
      .filter(({ result }) => showAsPassed(result))
      .map(this.diagnosticItemsMapper(STATUS.PASS));
  });

  readonly sections = computed<DiagnosticSection[]>(() => {
    return [
      this.buildSection('insights', this.insightItems()),
      this.buildSection('diagnostics', this.diagnosticItems()),
      this.buildSection('passed', this.passedItems()),
    ].filter((section) => section.items.length);
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

  private failedDiagnosticItems(audits: DiagnosticAuditRef[]): DiagnosticItem[] {
    return audits.map((audit) => this.diagnosticItemsMapper(this.failedDiagnosticStatus(audit))(audit));
  }

  private failedDiagnosticStatus(audit: DiagnosticAuditRef): StatusOptions {
    return this.isAlertAudit(audit) ? STATUS.ALERT : STATUS.WARN;
  }

  private isAlertAudit(audit: DiagnosticAuditRef): boolean {
    return audit.result.guidanceLevel === 1 && this.affectsMetric(Object.keys(audit.result.metricSavings || {}));
  }

  private isInsightAudit(auditRef: DiagnosticAuditRef): boolean {
    return auditRef.group === 'insights' || (auditRef.group === 'hidden' && auditRef.id.endsWith('-insight'));
  }

  private buildSection(key: SectionKey, items: DiagnosticItem[]): DiagnosticSection {
    const metadata = key === 'passed' ? undefined : this.sectionMetadata(key);

    return {
      key,
      title: metadata?.title || this.defaultSectionTitle(key),
      description: metadata?.description,
      items,
    };
  }

  private sectionMetadata(key: Exclude<SectionKey, 'passed'>): SectionMetadata | undefined {
    return this.stepDetails().lhr.categoryGroups?.[key];
  }

  private defaultSectionTitle(key: SectionKey): string {
    switch (key) {
      case 'insights':
        return 'Insights';
      case 'diagnostics':
        return 'Diagnostics';
      case 'passed':
        return passedAuditsGroupTitle(this.stepDetails().lhr);
    }
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
