import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { filter, map, Observable, switchMap } from 'rxjs';
import { FlowResult } from 'lighthouse';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AuditSummary, AuditSummaryComponent } from '@app-speed/portal-ui/audit-summary';
import { ViewerStepDetailComponent } from '../viewer-container/viewer-step-details.component';
import { ReportUtils } from 'lighthouse/report/renderer/report-utils';

@Component({
  selector: 'viewer-container',
  template: `
    @if (auditSummary(); as summary) {
      <ui-audit-summary [(activeIndex)]="activeIndex" [auditSummary]="summary" />
    }
    @if (auditStep(); as step) {
      <viewer-step-detail [stepDetails]="step" />
    }
  `,
  standalone: true,
  imports: [AuditSummaryComponent, ViewerStepDetailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AuditViewerContainer {
  auditId = input.required<string>();
  activeIndex = model<number>(0);
  // 2024-08-18T05_160t0WjP64yCyRK0xVadug
  // 2024-12-02T06_16YXXBTvY4WgTBfMoih8mo
  readonly #api = inject(HttpClient);

  flowResult$: Observable<FlowResult> = toObservable(this.auditId).pipe(
    filter((audit) => audit !== undefined),
    filter((audit) => audit !== ''),
    map((auditKey: string) => `https://deepblue-userflow-records.s3.eu-central-1.amazonaws.com/${auditKey}.uf.json`),
    switchMap((auditKey) => this.#api.get<FlowResult>(auditKey)),
  );

  auditSummary = toSignal<AuditSummary>(
    this.flowResult$.pipe(
      filter(Boolean),
      map(({ steps }) => {
        return steps.map(({ lhr: { fullPageScreenshot, categories, gatherMode, audits }, name }) => ({
          screenShot: fullPageScreenshot?.screenshot.data || '',
          title: name,
          subTitle: gatherMode,
          shouldDisplayAsFraction: ReportUtils.shouldDisplayAsFraction(gatherMode),
          categoryScores: Object.values(categories).map((category) => {
            const extendedCategory = {
              ...category,
              auditRefs: category.auditRefs.map((ref) => {
                return { ...ref, result: audits[ref.id] };
              }),
            };
            return {
              name: category.title,
              asFraction: ReportUtils.calculateCategoryFraction(extendedCategory),
              score: parseInt(((category.score || 0) * 100).toFixed(0), 10),
            };
          }),
        }));
      }),
    ),
  );

  results = toSignal(this.flowResult$.pipe(filter(Boolean)));
  auditStep = computed(() => {
    const results = this.results();
    const activeStep = this.activeIndex();
    if (!results || activeStep === undefined) {
      return;
    }
    console.log('activeStep', activeStep, results.steps[activeStep]);
    return results.steps[activeStep];
  });
}
