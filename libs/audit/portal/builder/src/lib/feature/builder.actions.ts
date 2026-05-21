import { createAction, props } from '@ngrx/store';

import { AuditDetails } from '../audit-details';
import type { FlowResult } from 'lighthouse';

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

export const listenToAuditProgress = createAction(
  '[Builder Page] Request audits to audit progress',
  props<{ requestId: string }>(),
);

export const auditStageUpdated = createAction('[Builder Page] Audit Stage Updated', props<{ stage: AuditStage }>());

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
export const updateAuditDetails = createAction('[Builder Page] Update Audit Details', props<{ audit: AuditDetails }>());

export const loadAuditDetails = createAction('[Builder Page] Load Audit Details');

export const loadAuditDetailsSuccess = createAction(
  '[Builder Page] Load Audit Details Success',
  props<{ audit: AuditDetails }>(),
);

export const loadAuditDetailsFailed = createAction('[Builder Page] Load Audit Details Failed');

export const loadRunDetails = createAction('[Builder Page] Load Run Details', props<{ auditId: string }>());

export const loadRunDetailsSuccess = createAction(
  '[Builder Page] Load Run Details Success',
  props<{
    auditId: string;
    audit: AuditDetails;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE';
    resultStatus: 'SUCCESS' | 'FAILURE' | null;
    queuePosition: number | null;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    durationMs: number | null;
  }>(),
);

export const loadRunDetailsFailed = createAction(
  '[Builder Page] Load Run Details Failed',
  props<{ error: string }>(),
);

export const forkAudit = createAction('[Builder Page] Fork Audit', props<{ audit: AuditDetails }>());
