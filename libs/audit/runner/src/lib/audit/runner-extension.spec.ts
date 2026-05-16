import { describe, expect, it, vi } from 'vitest';
import type { UserFlow } from 'lighthouse';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from '@app-speed/audit/domain';
import { UserFlowRunnerExtension } from './runner-extension';

const createFlow = () =>
  ({
    startNavigation: vi.fn().mockResolvedValue(undefined),
    endNavigation: vi.fn().mockResolvedValue(undefined),
    startTimespan: vi.fn().mockResolvedValue(undefined),
    endTimespan: vi.fn().mockResolvedValue(undefined),
    snapshot: vi.fn().mockResolvedValue(undefined),
  }) as unknown as UserFlow;

const createExtension = (flow: UserFlow) =>
  new UserFlowRunnerExtension({} as never, {} as never, flow);

describe('UserFlowRunnerExtension', () => {
  it('dispatches each supported custom step exhaustively', async () => {
    const flow = createFlow();
    const extension = createExtension(flow);

    await extension.runStep(
      {
        type: 'customStep',
        name: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
        parameters: { name: 'Initial Navigation' },
      },
      {} as never,
    );
    await extension.runStep(
      {
        type: 'customStep',
        name: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
        parameters: undefined,
      },
      {} as never,
    );
    await extension.runStep(
      {
        type: 'customStep',
        name: LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
        parameters: { name: 'Profile Load' },
      },
      {} as never,
    );
    await extension.runStep(
      {
        type: 'customStep',
        name: LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
        parameters: undefined,
      },
      {} as never,
    );
    await extension.runStep(
      {
        type: 'customStep',
        name: LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
        parameters: { name: 'After Login' },
      },
      {} as never,
    );

    expect(flow.startNavigation).toHaveBeenCalledWith({ name: 'Initial Navigation' });
    expect(flow.endNavigation).toHaveBeenCalledWith();
    expect(flow.startTimespan).toHaveBeenCalledWith({ name: 'Profile Load' });
    expect(flow.endTimespan).toHaveBeenCalledWith();
    expect(flow.snapshot).toHaveBeenCalledWith({ name: 'After Login' });
  });

  it('rejects unsupported replay custom steps without the legacy generic fallback', async () => {
    const flow = createFlow();
    const extension = createExtension(flow);

    await expect(
      extension.runStep(
        {
          type: 'customStep',
          name: 'unsupportedStep',
          parameters: undefined,
        } as never,
        {} as never,
      ),
    ).rejects.toThrowError();

    await extension
      .runStep(
        {
          type: 'customStep',
          name: 'unsupportedStep',
          parameters: undefined,
        } as never,
        {} as never,
      )
      .catch((error: unknown) => {
        expect(String(error)).not.toContain('Unknown custom step type');
      });
  });
});
