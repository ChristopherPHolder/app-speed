import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserFlow } from 'lighthouse';
import { startSoftNavigationGather } from './gatherer';

const mocks = vi.hoisted(() => ({
  disconnect: vi.fn(),
  disableAsyncStacks: vi.fn(),
  clearThrottling: vi.fn(),
  collect: vi.fn(),
}));
vi.mock('lighthouse/core/gather/driver.js', () => ({
  Driver: class {
    defaultSession = {};
    connect = vi.fn();
    disconnect = mocks.disconnect;
    url = vi.fn().mockResolvedValue('https://example.com/products');
  },
}));
vi.mock('lighthouse/core/config/config.js', () => ({
  initializeConfig: vi.fn(async () => ({ resolvedConfig: { audits: [], artifacts: [], settings: {} } })),
}));
vi.mock('lighthouse/core/gather/driver/prepare.js', () => ({
  enableAsyncStacks: vi.fn(async () => mocks.disableAsyncStacks),
  prepareTargetForTimespanMode: vi.fn(),
}));
vi.mock('lighthouse/core/lib/emulation.js', () => ({ clearThrottling: mocks.clearThrottling }));
vi.mock('lighthouse/core/gather/base-artifacts.js', () => ({
  getBaseArtifacts: vi.fn(async () => ({ GatherContext: { gatherMode: 'navigation' } })),
  finalizeArtifacts: vi.fn((artifacts) => artifacts),
}));
vi.mock('lighthouse/core/gather/runner-helpers.js', () => ({
  getEmptyArtifactState: vi.fn(() => ({})),
  collectPhaseArtifacts: mocks.collect,
  awaitArtifacts: vi.fn(async () => ({})),
}));
vi.mock('lighthouse/core/runner.js', () => ({
  Runner: { gather: vi.fn(async (gather) => gather()) },
}));

function createFlow() {
  return {
    _getNextFlags: vi.fn((flags) => flags),
    _addGatherStep: vi.fn(),
    _page: {},
  } as unknown as UserFlow;
}

beforeEach(() => vi.resetAllMocks());

describe('soft-navigation collector cleanup', () => {
  it('does not publish a step when disconnect fails', async () => {
    const flow = createFlow();
    const gatherer = await startSoftNavigationGather(flow, {});
    mocks.disconnect.mockRejectedValue(new Error('Disconnect failed'));
    await expect(gatherer.end()).rejects.toThrow('Disconnect failed');
    expect(flow._addGatherStep).not.toHaveBeenCalled();
  });

  it('clears throttling and disconnects even when async stack cleanup fails', async () => {
    const gatherer = await startSoftNavigationGather(createFlow(), {});
    mocks.disableAsyncStacks.mockRejectedValue(new Error('Stack cleanup failed'));
    await expect(gatherer.dispose()).rejects.toThrow('Stack cleanup failed');
    expect(mocks.clearThrottling).toHaveBeenCalledOnce();
    expect(mocks.disconnect).toHaveBeenCalledOnce();
  });

  it('waits for an in-progress end before disposal resolves or a step is published', async () => {
    const flow = createFlow();
    const gatherer = await startSoftNavigationGather(flow, {});
    let release!: () => void;
    const disconnected = new Promise<void>((resolve) => {
      release = resolve;
    });
    let reachedDisconnect!: () => void;
    const disconnectStarted = new Promise<void>((resolve) => {
      reachedDisconnect = resolve;
    });
    mocks.disconnect.mockImplementation(() => {
      reachedDisconnect();
      return disconnected;
    });
    const ending = gatherer.end();
    await disconnectStarted;
    const disposal = gatherer.dispose();
    expect(disposal).toBe(ending);
    expect(flow._addGatherStep).not.toHaveBeenCalled();
    release();
    await disposal;
    expect(flow._addGatherStep).toHaveBeenCalledOnce();
    expect(mocks.disconnect).toHaveBeenCalledOnce();
  });
});
