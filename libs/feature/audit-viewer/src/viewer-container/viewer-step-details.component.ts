import { Component, computed, input } from '@angular/core';
import { MatTable } from '@angular/material/table';
import type { FlowResult, Result } from 'lighthouse';
import {
  COLOR_CODE,
  ColorCode,
  MetricSummary,
  Reference,
  ViewerStepMetricSummaryComponent,
} from './viewer-step-metric-summary.component';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'lib-viewer-step-detail',
  template: `
    <section>
      <mat-card style='margin: 8px;'>
        <mat-card-content>
          <lib-viewer-step-metric-summary [metricSummary]='categoryMetricSummary()[0]["performance"]' />
        </mat-card-content>
      </mat-card>
    </section>
    <section>
      <mat-card style='margin: 8px;'>
        <mat-card-header>
          <mat-card-title>
            Film Strip
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class='film-strip'>
            @for (item of filmStrip(); track item) {
              <img [src]='item.data' height='100px' alt='' style='padding: 0 10px;'>
            }
          </div>
        </mat-card-content>
      </mat-card>
    </section>
    <section>
      <mat-card style='margin: 8px;'>
        <mat-card-header>
          <mat-card-title>DIAGNOSTICS</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-accordion>
            @for (item of alertItems(); track item.id) {
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon style='color:red; margin-right: 10px;'>warning</mat-icon>
                    {{ item.title }}
                    @if (item.displayValue) {
                      <span style='color: red; margin-left: 5px;'> - {{ item.displayValue }}</span>
                    }
                  </mat-panel-title>
                </mat-expansion-panel-header>
                <p>{{ item.description }}</p>
              </mat-expansion-panel>
            }
            @for (item of warnItems(); track item.id) {
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon style="color:orange; margin-right: 10px;">square</mat-icon>
                    {{ item.title }}
                    @if (item.displayValue) {
                      <span style='color: red; margin-left: 5px;'> - {{ item.displayValue }}</span>
                    }
                  </mat-panel-title>
                </mat-expansion-panel-header>
                <p>{{ item.description }}</p>
              </mat-expansion-panel>
            }
            @for (item of informItems(); track item.id) {
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon style="color:gray; margin-right: 10px;">circle</mat-icon>
                    {{ item.title }}
                    @if (item.displayValue) {
                      <span style='color: red; margin-left: 5px;'> - {{ item.displayValue }}</span>
                    }
                  </mat-panel-title>
                </mat-expansion-panel-header>
                <p>{{ item.description }}</p>
              </mat-expansion-panel>
            }
          </mat-accordion>
        </mat-card-content>
      </mat-card>
    </section>
  `,
  standalone: true,
  imports: [
    MatTable,
    ViewerStepMetricSummaryComponent,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatIcon,
  ],
  styles: [`
    .film-strip {
        display: flex;
        overflow: auto;
    }
    .film-strip {
        -ms-overflow-style: none;  /* Internet Explorer 10+ */
        scrollbar-width: none;  /* Firefox */
    }
    .film-strip::-webkit-scrollbar {
        display: none;  /* Safari and Chrome */
    }
  `]
})
export class ViewerStepDetailComponent {
  stepDetails = input.required<FlowResult.Step>();
  categories = computed(() => this.stepDetails().lhr.categories);
  categoryMetricSummary = computed<Record<string, MetricSummary[]>[]>(() => {
    console.log(this.stepDetails().lhr);
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
      return v.guidanceLevel === 1 && Object.keys(v.metricSavings!).filter((i) => this.categoryAcronyms().includes(i)).length;
    });
  });
  warnItems = computed(() => {
    const alertIds = this.alertItems().map((v) => v.id);
    return this.failedAudits().filter((v) => !alertIds.includes(v.id));
  });
  informItems = computed(() => {
    return this.diagnostics().passed
      .filter((v) => !!v.metricSavings)
      .filter((v) => this.affectsMetric(Object.keys(v.metricSavings!)))
  });

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
