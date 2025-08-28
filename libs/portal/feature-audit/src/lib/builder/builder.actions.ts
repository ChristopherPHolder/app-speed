import { createAction, props } from '@ngrx/store';

import { AuditDetails } from '@app-speed/shared-user-flow-replay';

export const submitAuditRequest = createAction(
  '[Builder Page] Submitting Audit Request',
  props<{ audit: AuditDetails }>(),
);

export const submitAuditRequestSuccess = createAction('[Builder Page] Submitting Audit Request Success', props<{ requestId: string }>());

export const submitAuditRequestFailed = createAction(
  '[Builder Page] Submitting Audit Request Failed',
  props<{ auditRequestError: string }>(),
);

export const updateAuditDetails = createAction('[Builder Page] Update Audit Details', props<{ audit: AuditDetails }>());

export const loadAuditDetails = createAction('[Builder Page] Load Audit Details');

export const loadAuditDetailsSuccess = createAction(
  '[Builder Page] Load Audit Details Success',
  props<{ audit: AuditDetails }>(),
);

export const updateLoadingDialog = createAction('[Builder Page] Update Loading Dialog', props<{ loadingDialog: null | { title: string, subtitle: string } }>());

export const loadAuditDetailsFailed = createAction('[Builder Page] Load Audit Details Failed');
