import { AuditDetails } from '@app-speed/audit/model';
import { createFeature, createReducer, on } from '@ngrx/store';
import {
  auditQueuePositionUpdated,
  auditResultFailure,
  auditResultRequested,
  auditResultSuccess,
  auditStageUpdated,
  loadAuditDetails,
  loadAuditDetailsSuccess,
  submitAuditRequest,
  submitAuditRequestFailed,
  submitAuditRequestSuccess,
  updateAuditDetails,
} from './builder.actions';
import type { FlowResult } from 'lighthouse';
import type { AuditStage } from './builder.actions';
import type { LoadingStatusViewModel } from '../audit-builder/loading-status.models';

export const auditBuilderFeatureKey = 'auditBuilder';

const AUDIT_BUILDER_STATUS = {
  PENDING: 'pending',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

type LoadingDialogState = LoadingStatusViewModel | null;

const getQueueSubtitle = (queuePosition: number | null) =>
  queuePosition === null
    ? 'Waiting for queue status.'
    : queuePosition === 0
      ? 'Next in queue. Waiting for a runner.'
      : `${queuePosition} ${queuePosition === 1 ? 'audit is' : 'audits are'} ahead in queue.`;

const getRunningSubtitle = () =>
  'A runner has started your audit. Results will open automatically when it completes.';

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

export interface AuditBuilderState {
  audit: AuditDetails | null;
  error: string | null;
  status: (typeof AUDIT_BUILDER_STATUS)[keyof typeof AUDIT_BUILDER_STATUS];
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
  error: null,
  status: 'pending',
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
    auditResultStatus: 'FAILURE',
    auditResultError: auditRequestError,
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
    modifying: true,
    loadingDialog: null,
  })),
  on(updateAuditDetails, (state, { audit }) => ({
    ...state,
    audit: audit,
    auditRequestError: null,
  })),
  on(loadAuditDetails, (state) => ({
    ...state,
    status: AUDIT_BUILDER_STATUS.LOADING,
  })),
  on(loadAuditDetailsSuccess, (state, { audit }) => ({
    ...state,
    audit: audit,
    status: AUDIT_BUILDER_STATUS.PENDING,
  })),
);

export const auditBuilderFeature = createFeature({ name: auditBuilderFeatureKey, reducer: auditBuilderReducer });
