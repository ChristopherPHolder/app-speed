import { inject } from '@angular/core';
import { Actions, createEffect, ofType, provideEffects } from '@ngrx/effects';
import {
  listenToAuditProgress,
  loadAuditDetails,
  loadAuditDetailsFailed,
  loadAuditDetailsSuccess,
  submitAuditRequest,
  submitAuditRequestFailed,
  submitAuditRequestSuccess,
  updateAuditDetails,
} from './builder.actions';
import { catchError, debounceTime, filter, map, of, switchMap, take, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_AUDIT_DETAILS } from '@app-speed/shared-user-flow-replay';
import { ApiService, SchedulerService } from '@app-speed/portal-data-access';
import { HttpClient } from '@angular/common/http';

type AuditResultResponse =
  | { status: 'SUCCESS'; result: unknown }
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
          map((response) => submitAuditRequestSuccess({ requestId: response.auditId })),
          catchError((error) => of(submitAuditRequestFailed({ auditRequestError: error.message }))),
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
  (action$ = inject(Actions)) =>
    action$.pipe(
      ofType(listenToAuditProgress),
      tap((i) => console.log('Listening to Audit', i)),
    ),
  // TODO remove dispatch false after chain is matched
  { functional: true, dispatch: false },
);

const auditFailedEffect = createEffect(
  (actions$ = inject(Actions), scheduler = inject(SchedulerService), http = inject(HttpClient)) =>
    actions$.pipe(
      ofType(listenToAuditProgress),
      switchMap(({ requestId }) =>
        scheduler.stageName$.pipe(
          filter((stage) => stage === 'failed'),
          take(1),
          switchMap(() => http.get<AuditResultResponse>(`/api/audit/${requestId}/result`)),
          map((result) => {
            if (result.status === 'FAILURE') {
              const { name, message, stack } = result.error;
              const title = name ? `${name}: ${message}` : message;
              const fullMessage = stack ? `${title}\n${stack}` : title;
              return submitAuditRequestFailed({ auditRequestError: fullMessage });
            }
            return submitAuditRequestFailed({
              auditRequestError: 'Audit failed but no error details were returned.',
            });
          }),
          catchError((error) =>
            of(
              submitAuditRequestFailed({
                auditRequestError: error?.message ?? 'Audit failed and error details could not be loaded.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
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
    auditFailedEffect,
  });
