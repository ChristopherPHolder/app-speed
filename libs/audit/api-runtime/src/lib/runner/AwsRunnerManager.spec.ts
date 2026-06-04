import { describe, expect, it } from 'vitest';

import { selectAwsRunnerActivationAction } from './AwsRunnerManager.js';

const instanceId = 'i-049287bf43503d01e' as never;
const nowMs = Date.UTC(2026, 2, 7, 10, 0, 0);
const startupGraceMs = 5 * 60 * 1000;

describe('AwsRunnerManager activation decision', () => {
  it('starts the configured runner instance when no EC2 instance is active', () => {
    expect(
      selectAwsRunnerActivationAction({
        instances: [{ instanceId, state: 'stopped', launchedAt: new Date(nowMs - 60 * 60 * 1000) }],
        registeredRunnerCount: 0,
        nowMs,
        startupGraceMs,
        targetInstanceId: instanceId,
      }),
    ).toEqual({ action: 'start', instanceId });
  });

  it('waits for an active EC2 instance during startup grace before a runner heartbeat is observed', () => {
    expect(
      selectAwsRunnerActivationAction({
        instances: [{ instanceId, state: 'running', launchedAt: new Date(nowMs - startupGraceMs + 1_000) }],
        registeredRunnerCount: 0,
        nowMs,
        startupGraceMs,
        targetInstanceId: instanceId,
      }),
    ).toEqual({ action: 'wait' });
  });

  it('recycles an active EC2 instance that has exceeded startup grace without a registered runner', () => {
    expect(
      selectAwsRunnerActivationAction({
        instances: [{ instanceId, state: 'running', launchedAt: new Date(nowMs - startupGraceMs - 1_000) }],
        registeredRunnerCount: 0,
        nowMs,
        startupGraceMs,
        targetInstanceId: instanceId,
      }),
    ).toEqual({ action: 'recycle', instanceIds: [instanceId], targetInstanceId: instanceId });
  });

  it('keeps waiting when an active runner has checked in', () => {
    expect(
      selectAwsRunnerActivationAction({
        instances: [{ instanceId, state: 'running', launchedAt: new Date(nowMs - startupGraceMs - 1_000) }],
        registeredRunnerCount: 1,
        nowMs,
        startupGraceMs,
        targetInstanceId: instanceId,
      }),
    ).toEqual({ action: 'wait' });
  });
});
