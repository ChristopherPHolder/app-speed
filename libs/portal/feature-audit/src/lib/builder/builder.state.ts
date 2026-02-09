import { AuditDetails } from '@app-speed/shared-user-flow-replay';
import { createFeature, createReducer, on } from '@ngrx/store';
import {
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

export const auditBuilderFeatureKey = 'auditBuilder';

const AUDIT_BUILDER_STATUS = {
  PENDING: 'pending',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

export interface AuditBuilderState {
  audit: AuditDetails | null;
  error: string | null;
  status: (typeof AUDIT_BUILDER_STATUS)[keyof typeof AUDIT_BUILDER_STATUS];
  submittingRequest: boolean;
  auditRequestError: string | null;
  modifying: boolean;
  requestId: string | null;
  loadingDialog: { title: string; subtitle: string } | null;
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
    audit: audit,
    submittingRequest: true,
    modifying: false,
    auditStage: 'scheduling',
    auditResult: null,
    auditResultStatus: null,
    auditResultError: null,
    loadingDialog: {
      title: `Submitting Audit`,
      subtitle: `Submitting a an audit request to server`,
    }
  })),
  on(submitAuditRequestSuccess, (state, { requestId }) => ({
    ...state,
    submittingRequest: true,
    modifying: false,
    requestId: requestId,
    listeningToAuditProgress: true,
    loadingDialog: {
      title: `Audit pending`,
      subtitle: `Audit request pending ${requestId}`,
    }
  })),
  on(submitAuditRequestFailed, (state, { auditRequestError }) => ({
    ...state,
    submittingRequest: false,
    auditRequestError: auditRequestError,
    modifying: true,
    listeningToAuditProgress: false,
    auditResult: null,
    auditResultStatus: 'FAILURE',
    auditResultError: auditRequestError,
    loadingDialog: null,
  })),
  on(auditStageUpdated, (state, { stage }) => ({
    ...state,
    auditStage: stage,
  })),
  on(auditResultRequested, (state, { requestId }) => ({
    ...state,
    requestId,
  })),
  on(auditResultSuccess, (state, { result }) => ({
    ...state,
    submittingRequest: false,
    listeningToAuditProgress: false,
    auditResult: result,
    auditResultStatus: 'SUCCESS',
    auditResultError: null,
    loadingDialog: null,
  })),
  on(auditResultFailure, (state, { error }) => ({
    ...state,
    submittingRequest: false,
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
