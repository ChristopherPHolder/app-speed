import { AuditDetails, DEFAULT_AUDIT_DETAILS } from '@app-speed/shared-user-flow-replay';
import { createFeature, createReducer, on } from '@ngrx/store';
import { loadAuditDetails, loadAuditDetailsSuccess, submitAuditRequest, submitAuditRequestFailed, submitAuditRequestSuccess, updateAuditDetails } from './builder.actions';

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
}

export const initialState: AuditBuilderState = {
  audit: null,
  error: null,
  status: 'pending',
  submittingRequest: false,
  auditRequestError: null,
  modifying: true,
};

export const auditBuilderReducer = createReducer(
  initialState,
  on(submitAuditRequest, (state, { audit }) => ({
    ...state,
    audit: audit,
    submittingRequest: true,
    modifying: false,
  })),
  on(submitAuditRequestSuccess, (state) => ({
    ...state,
    submittingRequest: false,
    modifying: false,
  })),
  on(submitAuditRequestFailed, (state, { auditRequestError }) => ({
    ...state,
    submittingRequest: false,
    auditRequestError: auditRequestError,
    modifying: false,
  })),
  on(updateAuditDetails, (state, { audit }) => ({
    ...state,
    audit: audit,
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
