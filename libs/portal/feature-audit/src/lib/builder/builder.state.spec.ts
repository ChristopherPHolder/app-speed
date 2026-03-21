import { describe, expect, it } from 'vitest';
import { DEFAULT_AUDIT_DETAILS } from '@app-speed/shared-user-flow-replay';
import {
  auditQueuePositionUpdated,
  auditStageUpdated,
  submitAuditRequest,
  submitAuditRequestSuccess,
} from './builder.actions';
import { auditBuilderReducer, initialState } from './builder.state';

describe('auditBuilderReducer loading dialog states', () => {
  it('shows the queued state with the initial queue position from scheduling', () => {
    const submittingState = auditBuilderReducer(
      initialState,
      submitAuditRequest({ audit: DEFAULT_AUDIT_DETAILS }),
    );

    const queuedState = auditBuilderReducer(
      submittingState,
      submitAuditRequestSuccess({ requestId: 'audit-123', queuePosition: 2 }),
    );

    expect(queuedState.loadingDialog).toEqual({
      title: 'Audit queued',
      subtitle: '2 audits are ahead in queue.',
      footerText: 'Audit ID: audit-123',
    });
  });

  it('updates the queued copy when the queue position changes', () => {
    const queuedState = auditBuilderReducer(
      auditBuilderReducer(
        auditBuilderReducer(initialState, submitAuditRequest({ audit: DEFAULT_AUDIT_DETAILS })),
        submitAuditRequestSuccess({ requestId: 'audit-123', queuePosition: 2 }),
      ),
      auditQueuePositionUpdated({ queuePosition: 0 }),
    );

    expect(queuedState.loadingDialog).toEqual({
      title: 'Audit queued',
      subtitle: 'Next in queue. Waiting for a runner.',
      footerText: 'Audit ID: audit-123',
    });
  });

  it('keeps the queued copy when progress listening starts with a scheduling stage', () => {
    const queuedState = auditBuilderReducer(
      auditBuilderReducer(
        initialState,
        submitAuditRequestSuccess({ requestId: 'audit-123', queuePosition: 1 }),
      ),
      auditStageUpdated({ stage: 'scheduling' }),
    );

    expect(queuedState.loadingDialog).toEqual({
      title: 'Audit queued',
      subtitle: '1 audit is ahead in queue.',
      footerText: 'Audit ID: audit-123',
    });
  });

  it('switches the loading dialog to the running state', () => {
    const runningState = auditBuilderReducer(
      auditBuilderReducer(
        initialState,
        submitAuditRequestSuccess({ requestId: 'audit-123', queuePosition: 0 }),
      ),
      auditStageUpdated({ stage: 'running' }),
    );

    expect(runningState.loadingDialog).toEqual({
      title: 'Audit running',
      subtitle: 'A runner has started your audit. Results will open automatically when it completes.',
      footerText: 'Audit ID: audit-123',
    });
  });
});
