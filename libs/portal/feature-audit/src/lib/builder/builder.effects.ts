import { inject } from '@angular/core';
import { Actions, createEffect, ofType, provideEffects } from '@ngrx/effects';
import {
  loadAuditDetails,
  loadAuditDetailsFailed,
  loadAuditDetailsSuccess,
  submitAuditRequest,
  submitAuditRequestFailed,
  submitAuditRequestSuccess,
  updateAuditDetails,
} from './builder.actions';
import { catchError, debounceTime, map, of, switchMap, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_AUDIT_DETAILS } from '@app-speed/shared-user-flow-replay';
import { ApiService } from '@app-speed/portal-data-access';

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
      switchMap(({ audit }) => api.requestAudit(audit).pipe(
        map(response => {
          if (response.status === 'success') {
            return submitAuditRequestSuccess({ requestId: response.message.auditId });
          }
          return submitAuditRequestFailed({ auditRequestError: response.message.errorMessage });
        }),
        catchError((error) => of(submitAuditRequestFailed({ auditRequestError: error.message }))),
      )),
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
  });
