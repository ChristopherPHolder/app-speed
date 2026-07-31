import { inject } from '@angular/core';
import { Actions, createEffect, ofType, provideEffects } from '@ngrx/effects';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, debounceTime, exhaustMap, map, of, tap } from 'rxjs';

import { ApiClient } from '@app-speed/audit/user-flow/portal-data-access';

import { DEFAULT_AUDIT_DETAILS } from '../audit-details';
import { getAuditRequestErrorMessage } from './builder-error-message';
import {
  loadAuditDetails,
  loadAuditDetailsSuccess,
  submitAuditRequest,
  submitAuditRequestFailed,
  submitAuditRequestSuccess,
  updateAuditDetails,
} from './builder.actions';

const loadAuditDetailsEffect = createEffect(
  (actions$ = inject(Actions), activatedRoute = inject(ActivatedRoute)) =>
    actions$.pipe(
      ofType(loadAuditDetails),
      map(() => {
        const encodedAudit = activatedRoute.snapshot.queryParams['audit-details'];
        if (encodedAudit) {
          try {
            return loadAuditDetailsSuccess({ audit: JSON.parse(encodedAudit) });
          } catch {
            // Invalid draft query values fall back to a new audit.
          }
        }
        return loadAuditDetailsSuccess({ audit: DEFAULT_AUDIT_DETAILS });
      }),
    ),
  { functional: true },
);

const updateAuditDetailsEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(updateAuditDetails),
      debounceTime(500),
      tap(({ audit }) => {
        void router.navigate([], {
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
          map((response) => submitAuditRequestSuccess({ requestId: response.auditId })),
          catchError((error) =>
            of(submitAuditRequestFailed({ auditRequestError: getAuditRequestErrorMessage(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

const navigateToScheduledAuditEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(submitAuditRequestSuccess),
      tap(({ requestId }) => void router.navigate(['/audits/user-flow', requestId])),
    ),
  { functional: true, dispatch: false },
);

export const provideBuilderEffects = () =>
  provideEffects({
    loadAuditDetailsEffect,
    updateAuditDetailsEffect,
    submitAuditRequestEffect,
    navigateToScheduledAuditEffect,
  });
