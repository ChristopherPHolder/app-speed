import { describe, expect, it } from 'vitest';

import { DEFAULT_AUDIT_DETAILS } from '../audit-details';
import { submitAuditRequest, submitAuditRequestFailed, submitAuditRequestSuccess } from './builder.actions';
import { auditBuilderReducer, initialState } from './builder.state';

describe('auditBuilderReducer', () => {
  it('locks duplicate submissions while scheduling', () => {
    const state = auditBuilderReducer(initialState, submitAuditRequest({ audit: DEFAULT_AUDIT_DETAILS }));
    expect(state.submittingRequest).toBe(true);
  });

  it('clears scheduling state after success', () => {
    const state = auditBuilderReducer(
      auditBuilderReducer(initialState, submitAuditRequest({ audit: DEFAULT_AUDIT_DETAILS })),
      submitAuditRequestSuccess({ requestId: 'audit-123' }),
    );
    expect(state.submittingRequest).toBe(false);
  });

  it('keeps an actionable scheduling error', () => {
    const state = auditBuilderReducer(initialState, submitAuditRequestFailed({ auditRequestError: 'Try again.' }));
    expect(state.auditRequestError).toBe('Try again.');
  });
});
