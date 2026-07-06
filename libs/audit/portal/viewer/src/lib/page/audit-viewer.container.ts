import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, model } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, distinctUntilChanged, filter, map, Observable, shareReplay, switchMap } from 'rxjs';
import type { FlowResult } from 'lighthouse';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ViewerStepDetailComponent } from '../steps/viewer-step-details.component';
import { calculateCategoryFraction, shouldDisplayAsFraction } from '../lighthouse-report-utils';
import { AuditSummary, AuditSummaryComponent } from '../summary/audit-summary.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'viewer-container',
  template: `
    @if (loading()) {
      <div class="loading-state" data-testid="audit-results-loading" role="status" aria-live="polite">
        <mat-spinner diameter="32" />
        <span>Loading audit results...</span>
      </div>
    } @else {
      @if (auditSummary(); as summary) {
        <ui-audit-summary [(activeIndex)]="activeIndex" [auditSummary]="summary" />
      }
      @if (auditStep(); as step) {
        <viewer-step-detail [stepDetails]="step" />
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      min-height: 320px;
      margin: 24px 0;
      text-align: center;
    }
  `,
  imports: [AuditSummaryComponent, ViewerStepDetailComponent, MatProgressSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditViewerContainer {
  auditId = input.required<string>();
  activeIndex = model<number>(0);
  readonly #api = inject(HttpClient);
  readonly #destroyRef = inject(DestroyRef);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);

  flowResult$: Observable<FlowResult> = toObservable(this.auditId).pipe(
    switchMap((auditId) => {
      return this.#api.get<{ status: 'SUCCESS' | 'FAILURE'; result: FlowResult }>(`/api/audit/${auditId}/result`).pipe(
        filter((response) => response.status === 'SUCCESS'),
        map((response) => response.result),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  results = toSignal(this.flowResult$.pipe(filter(Boolean)));
  loading = computed(() => !this.results());
  auditSummary = computed<AuditSummary | undefined>(() => {
    const results = this.results();
    if (!results) {
      return undefined;
    }

    return results.steps.map(({ lhr: { fullPageScreenshot, categories, gatherMode, audits }, name }) => ({
      screenShot: fullPageScreenshot?.screenshot.data || '',
      title: name,
      subTitle: gatherMode,
      shouldDisplayAsFraction: shouldDisplayAsFraction(gatherMode),
      categoryScores: Object.values(categories).map((category) => {
        const extendedCategory = {
          ...category,
          auditRefs: category.auditRefs.map((ref) => {
            return { ...ref, result: audits[ref.id] };
          }),
        };
        return {
          name: category.title,
          asFraction: calculateCategoryFraction(extendedCategory),
          score: parseInt(((category.score || 0) * 100).toFixed(0), 10),
        };
      }),
    }));
  });

  auditStep = computed(() => {
    const results = this.results();
    const activeStep = this.activeIndex();
    if (!results || activeStep === undefined) {
      return;
    }
    return results.steps[activeStep];
  });

  constructor() {
    combineLatest([this.#route.fragment, this.flowResult$])
      .pipe(
        map(([fragment, results]) => this.fragmentToStepIndex(fragment, results.steps.length) ?? 0),
        distinctUntilChanged(),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((index) => this.activeIndex.set(index));

    effect(() => {
      const results = this.results();
      const index = this.activeIndex();
      if (!results || !results.steps[index]) {
        return;
      }

      void this.#router.navigate([], {
        relativeTo: this.#route,
        fragment: this.stepIndexToFragment(index),
        queryParamsHandling: 'preserve',
        replaceUrl: true,
      });
    });
  }

  private fragmentToStepIndex(fragment: string | null, stepCount: number): number | null {
    const match = fragment?.match(/^step-(\d+)$/);
    if (!match) {
      return null;
    }

    const index = Number(match[1]) - 1;
    return Number.isInteger(index) && index >= 0 && index < stepCount ? index : null;
  }

  private stepIndexToFragment(index: number): string {
    return `step-${index + 1}`;
  }
}
