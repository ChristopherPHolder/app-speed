import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, model } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, distinctUntilChanged, filter, map, Observable, shareReplay, switchMap } from 'rxjs';
import type { UserFlowFailureSchema, UserFlowResult } from '@app-speed/audit/user-flow/domain';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ViewerStepDetailComponent } from '../steps/viewer-step-details.component';
import { calculateCategoryFraction, shouldDisplayAsFraction } from '../lighthouse-report-utils';
import { AuditSummary, AuditSummaryComponent, fitScreenshotPreview } from '../summary/audit-summary.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'viewer-container',
  template: `
    @if (failure(); as error) {
      <section role="alert" class="failure-state">
        <h2>
          Replay failed
          @if (error.diagnostics; as diagnostic) {
            at step {{ diagnostic.stepOrdinal }}
          }
        </h2>
        <p>{{ error.message }}</p>
        @if (error.diagnostics; as diagnostic) {
          <ol>
            @for (step of diagnostic.steps; track step.stepIndex) {
              <li [style.font-weight]="step.status === 'failed' ? 'bold' : 'normal'">
                {{ step.status }}: {{ step.stepType }} {{ step.stepName }}
                @if (step.status === 'failed') {
                  <p>Target: {{ step.targetUrl || 'current page' }} · Timeout: {{ step.timeoutMs }}ms</p>
                  @for (selectors of step.selectors; track $index) {
                    <code>{{ selectors.join(' → ') }}</code>
                  }
                }
              </li>
            }
          </ol>
          <p>{{ diagnostic.evidence }}</p>
        }
        <p>Check that the target exists, update its selector, or increase the step timeout and run the audit again.</p>
        @if (results()?.steps?.length) {
          <p>Completed measurements are available below.</p>
        }
      </section>
    }
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

    .failure-state {
      border-left: 4px solid #b3261e;
      padding: 16px;
      margin: 16px 0;
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

  private readonly response$ = toObservable(this.auditId).pipe(
    switchMap((auditId) =>
      this.#api.get<{
        status: 'SUCCESS' | 'FAILURE';
        result?: UserFlowResult;
        error?: typeof UserFlowFailureSchema.Type;
      }>(`/api/audits/user-flow/${auditId}/result`),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  private readonly response = toSignal(this.response$);
  readonly failure = computed(() => this.response()?.error);
  flowResult$: Observable<UserFlowResult> = this.response$.pipe(
    map((response) => response.result ?? (response.error?.partialResult as UserFlowResult | undefined)),
    filter((result): result is UserFlowResult => !!result),
  );
  results = toSignal(this.flowResult$);
  loading = computed(() => !this.response());
  auditSummary = computed<AuditSummary | undefined>(() => {
    const results = this.results();
    if (!results) {
      return undefined;
    }

    return results.steps.map(
      ({ lhr: { fullPageScreenshot, categories, gatherMode, audits }, name, softNavigation }) => {
        const screenshot = fullPageScreenshot?.screenshot;
        return {
          screenShot: screenshot?.data || '',
          screenShotSize: fitScreenshotPreview(screenshot?.width ?? 0, screenshot?.height ?? 0),
          title: name,
          subTitle: softNavigation ? 'soft navigation' : gatherMode,
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
        };
      },
    );
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
