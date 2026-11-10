import { PuppeteerRunnerExtension } from '@puppeteer/replay';
import { Effect, Result } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { runPuppeteerReplay } from './replay';

const recording = {
  title: 'test',
  steps: [
    { type: 'navigate', url: 'https://user:password@example.com/start?token=secret#private' },
    { type: 'click', offsetX: 1, offsetY: 1, selectors: [['#submit', '[value="secret"]']] },
    { type: 'change', selectors: [['#input']], value: 'secret' },
  ],
};

describe('replay failure diagnostics', () => {
  it('identifies a failed wait and redacts text selectors and cookie values', async () => {
    const extension = new PuppeteerRunnerExtension({} as never, {} as never);
    let index = 0;
    vi.spyOn(extension, 'runStep').mockImplementation(async () => {
      if (index++ === 1) throw new Error('Timed out after waiting 750ms: private-value');
    });
    const result = await Effect.runPromise(
      runPuppeteerReplay(
        {
          title: 'Wait',
          steps: [
            { type: 'customStep', name: 'addCookie', parameters: { name: 'session', value: 'private-value' } },
            { type: 'waitForElement', selectors: [['text/private-value'], ['[value=private-value]']], timeout: 750 },
          ],
        },
        extension,
      ).pipe(Effect.result),
    );
    expect(Result.isFailure(result)).toBe(true);
    if (!Result.isFailure(result)) return;
    expect(result.failure.diagnostics?.steps[1]).toMatchObject({
      stepType: 'waitForElement',
      timeoutMs: 750,
      status: 'failed',
    });
    expect(JSON.stringify(result.failure)).not.toContain('private-value');
  });

  it.each([
    ['Timed out after waiting 15000ms', 1, 'timed out'],
    ['Element not found: secret', 1, 'Check the target'],
    ['net::ERR_NAME_NOT_RESOLVED https://user:secret@example.com', 0, 'ERR_NAME_NOT_RESOLVED'],
    ['Timed out after waiting 10000ms', 2, 'timed out'],
  ])('captures %s without leaking input', async (message, failingIndex, expected) => {
    const extension = new PuppeteerRunnerExtension({} as never, {} as never);
    let index = 0;
    vi.spyOn(extension, 'runStep').mockImplementation(async () => {
      if (index++ === failingIndex) throw new Error(message);
    });
    const originalBefore = extension.beforeEachStep;
    const result = await Effect.runPromise(runPuppeteerReplay(recording, extension, 15000).pipe(Effect.result));
    expect(Result.isFailure(result)).toBe(true);
    if (!Result.isFailure(result)) return;
    expect(result.failure.message).toContain(expected);
    expect(result.failure.diagnostics).toMatchObject({
      stepIndex: failingIndex,
      stepOrdinal: failingIndex + 1,
      lastSuccessfulStepIndex: failingIndex === 0 ? null : failingIndex - 1,
    });
    expect(result.failure.diagnostics?.steps.map((step) => step.status)).toEqual(
      recording.steps.map((_, i) => (i < failingIndex ? 'completed' : i === failingIndex ? 'failed' : 'skipped')),
    );
    expect(JSON.stringify(result.failure)).not.toMatch(/secret|password|token=|private/);
    expect(extension.beforeEachStep).toBe(originalBefore);
  });
});
