import { inject } from '@angular/core';
import { Actions, createEffect, ofType, provideEffects } from '@ngrx/effects';
import {
  auditQueuePositionUpdated,
  auditResultFailure,
  auditResultRequested,
  auditResultSuccess,
  auditStageUpdated,
  forkAudit,
  listenToAuditProgress,
  loadAuditDetails,
  loadAuditDetailsSuccess,
  loadRunDetails,
  loadRunDetailsFailed,
  loadRunDetailsSuccess,
  submitAuditRequest,
  submitAuditRequestFailed,
  submitAuditRequestSuccess,
  updateAuditDetails,
} from './builder.actions';
import { EMPTY, catchError, debounceTime, distinctUntilChanged, exhaustMap, filter, map, of, switchMap, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AuditDetails, DEFAULT_AUDIT_DETAILS } from '../audit-details';
import { HttpClient } from '@angular/common/http';
import type { FlowResult } from 'lighthouse';
import { getAuditRequestErrorMessage } from './builder-error-message';
import { AuditProgressService } from '../api/audit-progress.service';
import { ApiClient } from '@app-speed/audit/portal/data-access';
import { ActivatedRouteSnapshot } from '@angular/router';

type AuditResultResponse =
  | { status: 'SUCCESS'; result: FlowResult }
  | { status: 'FAILURE'; error: { name: string; message: string; stack: string } };

type RunDetailsResponse = {
  auditId: string;
  audit: AuditDetails;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE';
  resultStatus: 'SUCCESS' | 'FAILURE' | null;
  queuePosition: number | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
};

const findRouteParam = (route: ActivatedRouteSnapshot, paramName: string): string | null => {
  const value = route.paramMap.get(paramName);
  if (value) {
    return value;
  }

  for (const child of route.children) {
    const childValue = findRouteParam(child, paramName);
    if (childValue) {
      return childValue;
    }
  }

  return null;
};

const loadAuditDetailsEffect = createEffect(
  (actions$ = inject(Actions), activatedRoute = inject(ActivatedRoute), router = inject(Router)) => {
    return actions$.pipe(
      ofType(loadAuditDetails),
      map(() => {
        const auditId = findRouteParam(router.routerState.snapshot.root, 'id');
        const auditDetailsQuery = activatedRoute.snapshot.queryParams['audit-details'];

        if (auditId) {
          return loadRunDetails({ auditId });
        }

        if (auditDetailsQuery) {
          try {
            return loadAuditDetailsSuccess({ audit: JSON.parse(auditDetailsQuery) });
          } catch {
            // fall through to defaults below
          }
        }
        return loadAuditDetailsSuccess({ audit: DEFAULT_AUDIT_DETAILS });
      }),
    );
  },
  { functional: true },
);

const updateAuditDetailsEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(updateAuditDetails),
      debounceTime(500),
      tap(({ audit }) => {
        if (findRouteParam(router.routerState.snapshot.root, 'id')) {
          return;
        }

        router.navigate([], {
          queryParams: { ['audit-details']: JSON.stringify(audit) },
          replaceUrl: true,
        });
      }),
    ),
  { functional: true, dispatch: false },
);

const submitAuditRequestEffect = createEffect(
  (actions$ = inject(Actions), api = inject(ApiClient)) =>
    actions$.pipe(
      ofType(submitAuditRequest),
      exhaustMap(({ audit }) =>
        api.scheduleAudit(audit).pipe(
          map((response) =>
            submitAuditRequestSuccess({
              requestId: response.auditId,
              queuePosition: response.auditQueuePosition,
            }),
          ),
          catchError((error) =>
            of(submitAuditRequestFailed({ auditRequestError: getAuditRequestErrorMessage(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

const submitAuditRequestSuccessListenEffect = createEffect(
  (action$ = inject(Actions)) =>
    action$.pipe(
      ofType(submitAuditRequestSuccess),
      map(({ requestId }) => listenToAuditProgress({ requestId })),
    ),
  { functional: true },
);

const submitAuditRequestSuccessNavigateEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(submitAuditRequestSuccess),
      tap(({ requestId }) => {
        router.navigate(['/user-flow', 'results', requestId]);
      }),
    ),
  { functional: true, dispatch: false },
);

const loadRunDetailsEffect = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) =>
    actions$.pipe(
      ofType(loadRunDetails),
      switchMap(({ auditId }) =>
        http.get<RunDetailsResponse>(`/api/audit/runs/${auditId}/details`).pipe(
          map((runDetails) => loadRunDetailsSuccess(runDetails)),
          catchError((error) =>
            of(
              loadRunDetailsFailed({
                error: error?.error?.message ?? 'Unable to load the selected audit run.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

const loadRunDetailsSuccessEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(loadRunDetailsSuccess),
      switchMap(({ auditId, status, resultStatus }) => {
        if (status !== 'COMPLETE') {
          return of(listenToAuditProgress({ requestId: auditId }));
        }

        if (resultStatus) {
          return of(auditResultRequested({ requestId: auditId }));
        }

        return EMPTY;
      }),
    ),
  { functional: true },
);

const listenToAuditProgressEffect = createEffect(
  (action$ = inject(Actions), scheduler = inject(AuditProgressService)) =>
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
  (action$ = inject(Actions), scheduler = inject(AuditProgressService)) =>
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
  (actions$ = inject(Actions), scheduler = inject(AuditProgressService)) =>
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

const forkAuditEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(forkAudit),
      tap(({ audit }) => {
        router.navigate(['/user-flow'], {
          queryParams: { ['audit-details']: JSON.stringify(audit) },
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
    loadRunDetailsEffect,
    loadRunDetailsSuccessEffect,
    submitAuditRequestSuccessListenEffect,
    submitAuditRequestSuccessNavigateEffect,
    listenToAuditProgressEffect,
    listenToAuditQueuePositionEffect,
    auditResultRequestedEffect,
    auditResultEffect,
    forkAuditEffect,
  });
