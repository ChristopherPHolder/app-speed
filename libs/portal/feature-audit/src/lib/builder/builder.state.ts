import { AuditDetails } from '@app-speed/shared-user-flow-replay';
import { createFeature, createReducer, on } from '@ngrx/store';
import {
  loadAuditDetails,
  loadAuditDetailsSuccess,
  submitAuditRequest,
  submitAuditRequestFailed,
  submitAuditRequestSuccess,
  updateAuditDetails,
} from './builder.actions';

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
};

export const auditBuilderReducer = createReducer(
  initialState,
  on(submitAuditRequest, (state, { audit }) => ({
    ...state,
    audit: audit,
    submittingRequest: true,
    modifying: false,
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
