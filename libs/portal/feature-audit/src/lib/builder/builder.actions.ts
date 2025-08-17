import { createAction, props } from '@ngrx/store';

import { AuditDetails } from '@app-speed/shared-user-flow-replay';

export const submitAuditRequest = createAction(
  '[Builder Page] Submitting Audit Request',
  props<{ audit: AuditDetails }>(),
);

export const updateAuditDetails = createAction('[Builder Page] Update Audit Details', props<{ audit: AuditDetails }>());

export const loadAuditDetails = createAction('[Builder Page] Load Audit Details');

export const loadAuditDetailsSuccess = createAction(
  '[Builder Page] Load Audit Details Success',
  props<{ audit: AuditDetails }>(),
);

export const loadAuditDetailsFailed = createAction('[Builder Page] Load Audit Details Failed');
