import { expect, it, vi } from 'vitest';
import type { Page } from 'puppeteer';
import type { UserFlow } from 'lighthouse';
import { ExperimentalUserFlow } from './flow';
import { startSoftNavigationGather } from './gatherer';

vi.mock('./gatherer', () => ({ startSoftNavigationGather: vi.fn() }));

it('waits for pending collector setup and cleanup when replay is disposed', async () => {
  let finishSetup!: (value: Awaited<ReturnType<typeof startSoftNavigationGather>>) => void;
  const setup = new Promise<Awaited<ReturnType<typeof startSoftNavigationGather>>>((resolve) => {
    finishSetup = resolve;
  });
  let finishCleanup!: () => void;
  const cleanup = new Promise<void>((resolve) => {
    finishCleanup = resolve;
  });
  const collector = { end: vi.fn(), dispose: vi.fn(() => cleanup) };
  vi.mocked(startSoftNavigationGather).mockReturnValue(setup);
  const native = { dispose: vi.fn() };
  const page = { on: vi.fn(), off: vi.fn() };
  const flow = new ExperimentalUserFlow(page as unknown as Page, native as unknown as UserFlow);
  const starting = flow.startNavigation();
  const rejectedStart = expect(starting).rejects.toThrow();
  const disposal = flow.dispose();
  expect(flow.dispose()).toBe(disposal);
  expect(native.dispose).not.toHaveBeenCalled();
  finishSetup(collector);
  await setup;
  expect(collector.dispose).toHaveBeenCalled();
  expect(native.dispose).not.toHaveBeenCalled();
  finishCleanup();
  await disposal;
  await rejectedStart;
  expect(native.dispose).toHaveBeenCalledOnce();
});
