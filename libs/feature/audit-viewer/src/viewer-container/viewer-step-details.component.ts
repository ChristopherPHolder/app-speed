import { Component, computed, input } from '@angular/core';
import { MatTable } from '@angular/material/table';
import type { FlowResult, Result } from 'lighthouse';
import {
  COLOR_CODE,
  ColorCode,
  MetricSummary, Reference,
  ViewerStepMetricSummaryComponent,
} from './viewer-step-metric-summary.component';

@Component({
  selector: 'lib-viewer-step-detail',
  template: `
    <section>
      <lib-viewer-step-metric-summary [metricSummary]='categoryMetricSummary()[0]["performance"]'/>
    </section>
  `,
  standalone: true,
  imports: [
    MatTable,
    ViewerStepMetricSummaryComponent,
  ],
})
export class ViewerStepDetailComponent {
  stepDetails = input.required<FlowResult.Step>();
  categories = computed(() => this.stepDetails().lhr.categories);
  categoryMetricSummary = computed<Record<string, MetricSummary[]>[]>(() => {
    return this.categoriesMetricSummary(this.stepDetails().lhr.categories);
  });

  private categoriesMetricSummary(categories: FlowResult.Step['lhr']['categories']): Record<string, MetricSummary[]>[] {
    return Object.entries(categories).map(([key, value]) => ({
        [key]: this.metricResults(this.metricAudits(value.auditRefs), this.stepDetails().lhr.audits)
    }));
  }

  private metricResults(ids: string[], audits: FlowResult.Step['lhr']['audits']): MetricSummary[] {
    return ids.map((id: string) => audits[id]).map((v) => ({
      name: v.title,
      value: v.displayValue,
      description: this.removeUrlRef(v.description),
      reference: this.extractReference(v.description),
      colorCode: this.computeColorCode(v.score, v.numericValue, v.scoringOptions)
    }));
  }

  private extractReference(description: string): Reference {
    const value = description.split(/\[(.*?)\]\((.*?)\)/);
    return { text: value[1] + '.', link: value[0] };
  }

  private removeUrlRef(description: string): string {
    return description.split('[')[0]
  }

  private metricAudits(auditRefs: Result.Category['auditRefs']): string[] {
    return auditRefs.filter(ref => ref?.group === 'metrics').map((ref) => ref.id);
  }

  private computeColorCode(score: number | null, numericValue: number | undefined, scoringOptions: {p10: number, median: number} | undefined): ColorCode {
    if (score !== null) {
      return score > 0.89 ? COLOR_CODE.GREEN : score > 0.49 ? COLOR_CODE.ORANGE : COLOR_CODE.RED;
    }

    if (scoringOptions === undefined || numericValue === undefined) {
      return null;
    }

    if (numericValue <= scoringOptions.p10) {
      return COLOR_CODE.GREEN;
    }
    if (numericValue <= scoringOptions.median) {
      return COLOR_CODE.ORANGE;
    }
    return COLOR_CODE.RED;
  }
}
