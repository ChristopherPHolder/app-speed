import { Cause } from 'effect';
import { describe, expect, it } from 'vitest';
import { toErrorPayload } from './process-queue';

describe('failed run serialization', () => {
  it('preserves diagnostics and partial measurements across the runner control plane', () => {
    const error = {
      name: 'ReplayExecutionError',
      message: 'Replay step timed out.',
      diagnostics: { stepIndex: 2, lastSuccessfulStepIndex: 1 },
      partialResult: { steps: [{ name: 'Home', lhr: { categories: { performance: { score: 0.9 } } } }] },
      cause: { cookie: 'secret' },
    };
    expect(toErrorPayload(Cause.fail(error))).toEqual({
      name: error.name,
      message: error.message,
      stack: '',
      diagnostics: error.diagnostics,
      partialResult: error.partialResult,
    });
  });
});
