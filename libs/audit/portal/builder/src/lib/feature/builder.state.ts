import { AuditDetails } from '../audit-details';
import { createFeature, createReducer, on } from '@ngrx/store';
import {
  auditQueuePositionUpdated,
  auditResultFailure,
  auditResultRequested,
  auditResultSuccess,
  auditStageUpdated,
  forkAudit,
  loadAuditDetailsSuccess,
  loadRunDetails,
  loadRunDetailsFailed,
  loadRunDetailsSuccess,
  submitAuditRequest,
  submitAuditRequestFailed,
  submitAuditRequestSuccess,
  updateAuditDetails,
} from './builder.actions';
import type { StatusDialogModel } from '@app-speed/audit/portal/ui/dialogs';
import type { FlowResult } from 'lighthouse';
import type { AuditStage } from './builder.actions';
import { DEFAULT_AUDIT_DETAILS } from '../audit-details';

export const auditBuilderFeatureKey = 'auditBuilder';

type LoadingDialogState = StatusDialogModel | null;

const getQueueSubtitle = (queuePosition: number | null) =>
  queuePosition === null
    ? 'Waiting for queue status.'
    : queuePosition === 0
      ? 'Next in queue. Waiting for a runner.'
      : `${queuePosition} ${queuePosition === 1 ? 'audit is' : 'audits are'} ahead in queue.`;

const getRunningSubtitle = () => 'A runner has started your audit. Results will open automatically when it completes.';

const getFooterText = (requestId: string | null) => {
  if (requestId === null) {
    return undefined;
  }

  return `Audit ID: ${requestId}`;
};

const getLoadingDialog = ({
  auditStage,
  queuePosition,
  requestId,
  submittingRequest,
}: {
  auditStage: AuditStage | null;
  queuePosition: number | null;
  requestId: string | null;
  submittingRequest: boolean;
}): LoadingDialogState => {
  if (!submittingRequest) {
    return null;
  }

  if (requestId === null) {
    return {
      title: 'Submitting Audit',
      subtitle: 'Submitting an audit request to server',
    };
  }

  if (auditStage === 'running') {
    return {
      title: 'Audit running',
      subtitle: getRunningSubtitle(),
      footerText: getFooterText(requestId),
    };
  }

  if (auditStage === 'scheduled' || auditStage === 'scheduling') {
    return {
      title: 'Audit queued',
      subtitle: getQueueSubtitle(queuePosition),
      footerText: getFooterText(requestId),
    };
  }

  return null;
};

const toAuditStage = (
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE',
  resultStatus: 'SUCCESS' | 'FAILURE' | null,
): AuditStage => {
  if (status === 'SCHEDULED') {
    return 'scheduled';
  }

  if (status === 'IN_PROGRESS') {
    return 'running';
  }

  if (resultStatus === 'FAILURE') {
    return 'failed';
  }

  return 'done';
};

export interface AuditBuilderState {
  audit: AuditDetails | null;
  submittingRequest: boolean;
  auditRequestError: string | null;
  modifying: boolean;
  requestId: string | null;
  queuePosition: number | null;
  loadingDialog: LoadingDialogState;
  listeningToAuditProgress: boolean | null;
  auditStage: AuditStage | null;
  auditResult: FlowResult | null;
  auditResultStatus: 'SUCCESS' | 'FAILURE' | null;
  auditResultError: string | null;
}

export const initialState: AuditBuilderState = {
  audit: null,
  submittingRequest: false,
  auditRequestError: null,
  modifying: true,
  requestId: null,
  queuePosition: null,
  loadingDialog: null,
  listeningToAuditProgress: null,
  auditStage: null,
  auditResult: null,
  auditResultStatus: null,
  auditResultError: null,
};

export const auditBuilderReducer = createReducer(
  initialState,
  on(submitAuditRequest, (state, { audit }) => ({
    ...state,
    audit,
    submittingRequest: true,
    modifying: false,
    requestId: null,
    queuePosition: null,
    auditStage: 'scheduling',
    auditResult: null,
    auditResultStatus: null,
    auditResultError: null,
    loadingDialog: getLoadingDialog({
      auditStage: 'scheduling',
      queuePosition: null,
      requestId: null,
      submittingRequest: true,
    }),
  })),
  on(submitAuditRequestSuccess, (state, { requestId, queuePosition }) => {
    const nextState = {
      ...state,
      submittingRequest: true,
      modifying: false,
      requestId,
      queuePosition,
      listeningToAuditProgress: true,
      auditStage: 'scheduled' as const,
    };

    return {
      ...nextState,
      loadingDialog: getLoadingDialog(nextState),
    };
  }),
  on(submitAuditRequestFailed, (state, { auditRequestError }) => ({
    ...state,
    submittingRequest: false,
    auditRequestError,
    modifying: true,
    queuePosition: null,
    listeningToAuditProgress: false,
    auditResult: null,
    auditResultStatus: null,
    auditResultError: null,
    loadingDialog: null,
  })),
  on(auditStageUpdated, (state, { stage }) => {
    const nextState = {
      ...state,
      auditStage: stage,
    };

    return {
      ...nextState,
      loadingDialog: getLoadingDialog(nextState),
    };
  }),
  on(auditQueuePositionUpdated, (state, { queuePosition }) => {
    const nextState = {
      ...state,
      queuePosition,
    };

    return {
      ...nextState,
      loadingDialog: getLoadingDialog(nextState),
    };
  }),
  on(auditResultRequested, (state, { requestId }) => ({
    ...state,
    requestId,
  })),
  on(auditResultSuccess, (state, { result }) => ({
    ...state,
    submittingRequest: false,
    queuePosition: null,
    listeningToAuditProgress: false,
    auditResult: result,
    auditResultStatus: 'SUCCESS',
    auditResultError: null,
    loadingDialog: null,
  })),
  on(auditResultFailure, (state, { error }) => ({
    ...state,
    submittingRequest: false,
    queuePosition: null,
    listeningToAuditProgress: false,
    auditResult: null,
    auditResultStatus: 'FAILURE',
    auditResultError: error,
    auditRequestError: error,
    modifying: false,
    auditStage: 'failed',
    loadingDialog: null,
  })),
  on(updateAuditDetails, (state, { audit }) => ({
    ...state,
    audit: audit,
    auditRequestError: null,
  })),
  on(loadAuditDetailsSuccess, (state, { audit }) => ({
    ...state,
    audit: audit,
    modifying: true,
    submittingRequest: false,
    requestId: null,
    queuePosition: null,
    listeningToAuditProgress: false,
    auditStage: null,
    auditResult: null,
    auditResultStatus: null,
    auditResultError: null,
    auditRequestError: null,
    loadingDialog: null,
  })),
  on(loadRunDetails, (state, { auditId }) => ({
    ...state,
    audit: null,
    modifying: false,
    submittingRequest: true,
    requestId: auditId,
    queuePosition: null,
    listeningToAuditProgress: null,
    auditStage: 'scheduling',
    auditResult: null,
    auditResultStatus: null,
    auditResultError: null,
    auditRequestError: null,
    loadingDialog: getLoadingDialog({
      auditStage: 'scheduling',
      queuePosition: null,
      requestId: auditId,
      submittingRequest: true,
    }),
  })),
  on(loadRunDetailsSuccess, (state, { auditId, audit, status, resultStatus, queuePosition }) => {
    const auditStage = toAuditStage(status, resultStatus);
    const submittingRequest = auditStage === 'scheduled' || auditStage === 'running';
    const nextState = {
      ...state,
      audit,
      modifying: false,
      submittingRequest,
      requestId: auditId,
      queuePosition,
      listeningToAuditProgress: submittingRequest,
      auditStage,
      auditResult: null,
      auditResultStatus: resultStatus,
      auditResultError: resultStatus === 'FAILURE' ? state.auditResultError : null,
      auditRequestError: resultStatus === 'FAILURE' ? state.auditRequestError : null,
    };

    return {
      ...nextState,
      loadingDialog: getLoadingDialog(nextState),
    };
  }),
  on(loadRunDetailsFailed, (state, { error }) => ({
    ...state,
    audit: DEFAULT_AUDIT_DETAILS,
    modifying: true,
    submittingRequest: false,
    requestId: null,
    queuePosition: null,
    listeningToAuditProgress: false,
    auditStage: null,
    auditResult: null,
    auditResultStatus: null,
    auditResultError: null,
    auditRequestError: error,
    loadingDialog: null,
  })),
  on(forkAudit, (state, { audit }) => ({
    ...state,
    audit,
    modifying: true,
    submittingRequest: false,
    requestId: null,
    queuePosition: null,
    listeningToAuditProgress: false,
    auditStage: null,
    auditResult: null,
    auditResultStatus: null,
    auditResultError: null,
    auditRequestError: null,
    loadingDialog: null,
  })),
);

export const auditBuilderFeature = createFeature({ name: auditBuilderFeatureKey, reducer: auditBuilderReducer });
