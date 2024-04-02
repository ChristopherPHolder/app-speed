import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { FlowResult, Result } from 'lighthouse';
import { MetricSummary, ViewerStepMetricSummaryComponent } from './viewer-step-metric-summary.component';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { ViewerFileStripComponent } from './viewer-file-strip.component';
import { ViewerDiagnosticComponent } from './viewer-diagnostic.component';
import { DiagnosticItem } from './viewer-diagnostic-panel.component';
import { StatusOptions } from '../ui/status.types';
import { STATUS_OPTIONS } from '../ui/status.constants';
import { extractTrailingMdUrl, removeTrailingMdUrl } from '../utils/url-parser';

@Component({
  selector: 'viewer-step-detail',
  template: `
    <mat-card>
      <mat-card-content>
        <viewer-step-metric-summary [metricSummary]='categoryMetricSummary()[0]["performance"]' />
      </mat-card-content>
    </mat-card>
    
    <mat-card>
      <mat-card-header>
        <mat-card-title>
          Film Strip
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <viewer-file-strip [filmStrip]='filmStrip()' />
      </mat-card-content>
    </mat-card>
    
    <mat-card>
      <mat-card-header>
        <mat-card-title>DIAGNOSTICS</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <viewer-diagnostic [items]='diagnosticItems()'/>
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
  styles: `
      :host {
          display: block;
          max-width: 960px;
          margin: auto;
          --mdc-elevated-card-container-shape: 0;
      }
  `
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
    return this.stepDetails().lhr.categories['performance']['auditRefs']
      .filter(v => v.group === 'metrics')
      .map((v) => v.acronym);
  })

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

  failedAudits = computed(() => this.diagnostics().failed);
  alertItems = computed(() => {
    return this.failedAudits().filter((v) => {
      return v.guidanceLevel === 1 && Object.keys(v.metricSavings || {}).filter((i) => this.categoryAcronyms().includes(i)).length;
    });
  });
  warnItems = computed(() => {
    const alertIds = this.alertItems().map((v) => v.id);
    return this.failedAudits().filter((v) => !alertIds.includes(v.id));
  });
  informItems = computed(() => {
    return this.diagnostics().passed
      .filter((v) => !!v.metricSavings)
      .filter((v) => this.affectsMetric(Object.keys(v.metricSavings || {})))
  });

  diagnosticItems = computed(() => {
    const items: DiagnosticItem[] = [];
    this.alertItems().forEach((item) => {
      items.push({
        id: item.id,
        status: STATUS_OPTIONS.ALERT,
        title: item.title,
        displayValue: item.displayValue,
        description: removeTrailingMdUrl(item.description),
        reference: extractTrailingMdUrl(item.description)
      });
    });
    this.warnItems().forEach((item) => {
      items.push({
        id: item.id,
        status: STATUS_OPTIONS.WARN,
        title: item.title,
        displayValue: item.displayValue,
        description: removeTrailingMdUrl(item.description),
        reference: extractTrailingMdUrl(item.description)
      });
    });
    this.informItems().forEach((item) => {
      items.push({
        id: item.id,
        status: STATUS_OPTIONS.INFO,
        title: item.title,
        displayValue: item.displayValue,
        description: removeTrailingMdUrl(item.description),
        reference: extractTrailingMdUrl(item.description)
      });
    });

    return items;
  })

  private affectsMetric(metricSavings: string[]): boolean {
    return !!metricSavings.filter((i) => this.categoryAcronyms().includes(i)).length;
  }
  private categoriesMetricSummary(categories: FlowResult.Step['lhr']['categories']): Record<string, MetricSummary[]>[] {
    return Object.entries(categories).map(([key, value]) => ({
        [key]: this.metricResults(this.metricAudits(value.auditRefs), this.stepDetails().lhr.audits)
    }));
  }

  private metricResults(ids: string[], audits: FlowResult.Step['lhr']['audits']): MetricSummary[] {
    return ids.map((id: string) => audits[id]).map((v) => ({
      name: v.title,
      value: v.displayValue,
      description: removeTrailingMdUrl(v.description),
      reference: extractTrailingMdUrl(v.description),
      status: this.metricStatus(v.score, v.numericValue, v.scoringOptions)
    }));
  }

  private metricAudits(auditRefs: Result.Category['auditRefs']): string[] {
    return auditRefs.filter(ref => ref?.group === 'metrics').map((ref) => ref.id);
  }

  private metricStatus(score: number | null, numericValue: number | undefined, scoringOptions: {p10: number, median: number} | undefined): StatusOptions {
    if (score !== null) {
      return score > 0.89 ? STATUS_OPTIONS.PASS : score > 0.49 ? STATUS_OPTIONS.WARN : STATUS_OPTIONS.ALERT;
    }

    if (scoringOptions === undefined || numericValue === undefined) {
      return STATUS_OPTIONS.INFO;
    }

    if (numericValue <= scoringOptions.p10) {
      return STATUS_OPTIONS.PASS;
    }
    if (numericValue <= scoringOptions.median) {
      return STATUS_OPTIONS.WARN;
    }
    return STATUS_OPTIONS.ALERT;
  }
}
