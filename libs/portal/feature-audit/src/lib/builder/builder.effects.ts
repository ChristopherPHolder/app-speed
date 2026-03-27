import { inject } from '@angular/core';
import { Actions, createEffect, ofType, provideEffects } from '@ngrx/effects';
import {
  auditQueuePositionUpdated,
  auditResultFailure,
  auditResultRequested,
  auditResultSuccess,
  auditStageUpdated,
  listenToAuditProgress,
  loadAuditDetails,
  loadAuditDetailsFailed,
  loadAuditDetailsSuccess,
  submitAuditRequest,
  submitAuditRequestFailed,
  submitAuditRequestSuccess,
  updateAuditDetails,
} from './builder.actions';
import { catchError, debounceTime, distinctUntilChanged, filter, map, of, switchMap, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_AUDIT_DETAILS } from '@app-speed/audit/model';
import { ApiService, SchedulerService } from '@app-speed/portal-data-access';
import { HttpClient } from '@angular/common/http';
import type { FlowResult } from 'lighthouse';
import { getAuditRequestErrorMessage } from './builder-error-message';

type AuditResultResponse =
  | { status: 'SUCCESS'; result: FlowResult }
  | { status: 'FAILURE'; error: { name: string; message: string; stack: string } };

const loadAuditDetailsEffect = createEffect(
  (actions$ = inject(Actions), activatedRoute = inject(ActivatedRoute)) => {
    return actions$.pipe(
      ofType(loadAuditDetails),
      map(() => {
        const auditDetailsQuery = activatedRoute.snapshot.queryParams['audit-details'];
        if (auditDetailsQuery) {
          try {
            return loadAuditDetailsSuccess({ audit: JSON.parse(auditDetailsQuery) });
          } catch (e) {
            console.error('Error parsing audit details from query params', e);
          }
        }
        return loadAuditDetailsFailed();
      }),
    );
  },
  { functional: true },
);

const loadAuditDetailsSuccessEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(loadAuditDetailsSuccess),
      map(({ audit }) => updateAuditDetails({ audit })),
    ),
  { functional: true },
);

const updateAuditDetailsEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(updateAuditDetails),
      debounceTime(500),
      tap(({ audit }) =>
        router.navigate([], {
          queryParams: { ['audit-details']: JSON.stringify(audit) },
          queryParamsHandling: 'replace',
        }),
      ),
    ),
  { functional: true, dispatch: false },
);

const loadAuditDetailsFailedEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(loadAuditDetailsFailed),
      tap(() => console.error('Failed to load audit details, falling back to defaults')),
      map(() => updateAuditDetails({ audit: DEFAULT_AUDIT_DETAILS })),
    ),
  { functional: true },
);

const submitAuditRequestEffect = createEffect(
  (actions$ = inject(Actions), api = inject(ApiService)) =>
    actions$.pipe(
      ofType(submitAuditRequest),
      switchMap(({ audit }) =>
        api.requestAudit(audit).pipe(
          map((response) =>
            submitAuditRequestSuccess({
              requestId: response.auditId,
              queuePosition: response.auditQueuePosition,
            }),
          ),
          catchError((error) => of(submitAuditRequestFailed({ auditRequestError: getAuditRequestErrorMessage(error) }))),
        ),
      ),
    ),
  { functional: true },
);

const submitAuditRequestSuccessEffect = createEffect(
  (action$ = inject(Actions)) =>
    action$.pipe(
      ofType(submitAuditRequestSuccess),
      map(({ requestId }) => listenToAuditProgress({ requestId })),
    ),
  { functional: true },
);

const listenToAuditProgressEffect = createEffect(
  (action$ = inject(Actions), scheduler = inject(SchedulerService)) =>
    action$.pipe(
      ofType(listenToAuditProgress),
      tap(({ requestId }) => scheduler.watchAudit(requestId)),
      switchMap(() =>
        scheduler.stageName$.pipe(
          distinctUntilChanged(),
          map((stage) => auditStageUpdated({ stage })),
        ),
      ),
    ),
  { functional: true },
);

const listenToAuditQueuePositionEffect = createEffect(
  (action$ = inject(Actions), scheduler = inject(SchedulerService)) =>
    action$.pipe(
      ofType(listenToAuditProgress),
      switchMap(() =>
        scheduler.queuePosition$.pipe(
          filter((queuePosition): queuePosition is number => queuePosition !== null),
          distinctUntilChanged(),
          map((queuePosition) => auditQueuePositionUpdated({ queuePosition })),
        ),
      ),
    ),
  { functional: true },
);

const auditResultRequestedEffect = createEffect(
  (actions$ = inject(Actions), scheduler = inject(SchedulerService)) =>
    actions$.pipe(
      ofType(listenToAuditProgress),
      switchMap(() =>
        scheduler.key$.pipe(
          distinctUntilChanged(),
          map((requestId) => auditResultRequested({ requestId })),
        ),
      ),
    ),
  { functional: true },
);

const auditResultEffect = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) =>
    actions$.pipe(
      ofType(auditResultRequested),
      switchMap(({ requestId }) =>
        http.get<AuditResultResponse>(`/api/audit/${requestId}/result`).pipe(
          map((result) => {
            if (result.status === 'SUCCESS') {
              return auditResultSuccess({ requestId, result: result.result });
            }
            const { name, message, stack } = result.error;
            const title = name ? `${name}: ${message}` : message;
            const fullMessage = stack ? `${title}\n${stack}` : title;
            return auditResultFailure({ requestId, error: fullMessage });
          }),
          catchError((error) =>
            of(
              auditResultFailure({
                requestId,
                error: error?.message ?? 'Audit failed and error details could not be loaded.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

const auditResultSuccessNavigateEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(auditResultSuccess),
      tap(({ requestId }) => {
        router.navigate(['/user-flow/viewer'], {
          queryParams: { auditId: requestId },
        });
      }),
    ),
  { functional: true, dispatch: false },
);

export const provideBuilderEffects = () =>
  provideEffects({
    updateAuditDetailsEffect,
    submitAuditRequestEffect,
    loadAuditDetailsEffect,
    loadAuditDetailsSuccessEffect,
    loadAuditDetailsFailedEffect,
    submitAuditRequestSuccessEffect,
    listenToAuditProgressEffect,
    listenToAuditQueuePositionEffect,
    auditResultRequestedEffect,
    auditResultEffect,
    auditResultSuccessNavigateEffect,
  });
