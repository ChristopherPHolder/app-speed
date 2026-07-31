import { createFeature, createReducer, on } from '@ngrx/store';

import { AuditDetails } from '../audit-details';
import {
  loadAuditDetailsSuccess,
  submitAuditRequest,
  submitAuditRequestFailed,
  submitAuditRequestSuccess,
  updateAuditDetails,
} from './builder.actions';

export const auditBuilderFeatureKey = 'auditBuilder';

export interface AuditBuilderState {
  audit: AuditDetails | null;
  submittingRequest: boolean;
  auditRequestError: string | null;
}

export const initialState: AuditBuilderState = {
  audit: null,
  submittingRequest: false,
  auditRequestError: null,
};

export const auditBuilderReducer = createReducer(
  initialState,
  on(submitAuditRequest, (state, { audit }) => ({
    ...state,
    audit,
    submittingRequest: true,
    auditRequestError: null,
  })),
  on(submitAuditRequestSuccess, (state) => ({ ...state, submittingRequest: false })),
  on(submitAuditRequestFailed, (state, { auditRequestError }) => ({
    ...state,
    submittingRequest: false,
    auditRequestError,
  })),
  on(updateAuditDetails, (state, { audit }) => ({ ...state, audit, auditRequestError: null })),
  on(loadAuditDetailsSuccess, (state, { audit }) => ({
    ...state,
    audit,
    submittingRequest: false,
    auditRequestError: null,
  })),
);

export const auditBuilderFeature = createFeature({ name: auditBuilderFeatureKey, reducer: auditBuilderReducer });
