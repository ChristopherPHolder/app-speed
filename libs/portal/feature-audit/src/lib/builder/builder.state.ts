import { AuditDetails, DEFAULT_AUDIT_DETAILS } from '@app-speed/shared-user-flow-replay';
import { createFeature, createReducer, on } from '@ngrx/store';
import { loadAuditDetails, loadAuditDetailsSuccess, submitAuditRequest, updateAuditDetails } from './builder.actions';

export const auditBuilderFeatureKey = 'auditBuilder';

const AUDIT_BUILDER_STATUS = {
  PENDING: 'pending',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

export interface AuditBuilderState {
  audit: AuditDetails;
  error: string | null;
  status: (typeof AUDIT_BUILDER_STATUS)[keyof typeof AUDIT_BUILDER_STATUS];
}

export const initialState: AuditBuilderState = {
  audit: DEFAULT_AUDIT_DETAILS,
  error: null,
  status: 'pending',
};

export const auditBuilderReducer = createReducer(
  initialState,
  on(submitAuditRequest, (state, { audit }) => ({
    ...state,
    audit: audit,
  })),
  on(updateAuditDetails, (state) => ({
    ...state,
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
