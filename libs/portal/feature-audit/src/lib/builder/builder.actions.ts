import { createAction, props } from '@ngrx/store';

import { AuditDetails } from '@app-speed/audit/model';
import type { FlowResult } from 'lighthouse';
import type { LoadingStatusViewModel } from '../audit-builder/loading-status.models';

export type AuditStage = 'scheduling' | 'scheduled' | 'running' | 'done' | 'failed';

export const submitAuditRequest = createAction(
  '[Builder Page] Submitting Audit Request',
  props<{ audit: AuditDetails }>(),
);

export const submitAuditRequestSuccess = createAction(
  '[Builder Page] Submitting Audit Request Success',
  props<{ requestId: string; queuePosition: number }>(),
);

export const submitAuditRequestFailed = createAction(
  '[Builder Page] Submitting Audit Request Failed',
  props<{ auditRequestError: string }>(),
);

export const listenToAuditProgress = createAction('[Builder Page] Request audits to audit progress', props<{ requestId: string }>());

export const auditStageUpdated = createAction(
  '[Builder Page] Audit Stage Updated',
  props<{ stage: AuditStage }>(),
);

export const auditQueuePositionUpdated = createAction(
  '[Builder Page] Audit Queue Position Updated',
  props<{ queuePosition: number }>(),
);

export const auditResultRequested = createAction(
  '[Builder Page] Audit Result Requested',
  props<{ requestId: string }>(),
);

export const auditResultSuccess = createAction(
  '[Builder Page] Audit Result Success',
  props<{ requestId: string; result: FlowResult }>(),
);

export const auditResultFailure = createAction(
  '[Builder Page] Audit Result Failure',
  props<{ requestId: string; error: string }>(),
);

export const auditCompletedSuccessfully = createAction(
  '[Builder Page] Audit Completed successfully',
  props<{ requestId: string }>(),
);

export const auditCompletedWithErrors = createAction('[Builder Page] Audit Completed With Errors');

export const updateAuditDetails = createAction('[Builder Page] Update Audit Details', props<{ audit: AuditDetails }>());

export const loadAuditDetails = createAction('[Builder Page] Load Audit Details');

export const loadAuditDetailsSuccess = createAction(
  '[Builder Page] Load Audit Details Success',
  props<{ audit: AuditDetails }>(),
);

export const updateLoadingDialog = createAction(
  '[Builder Page] Update Loading Dialog',
  props<{ loadingDialog: LoadingStatusViewModel | null }>(),
);

export const loadAuditDetailsFailed = createAction('[Builder Page] Load Audit Details Failed');
