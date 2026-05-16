import { describe, expect, it, vi } from 'vitest';
import type { UserFlow } from 'lighthouse';
import type { Page } from 'puppeteer';
import { AUDIT_CUSTOM_STEP_TYPE, LIGHTHOUSE_AUDIT_STEP_TYPE } from '@app-speed/audit/domain';
import { UserFlowRunnerExtension } from './runner-extension';

const createFlow = () =>
  ({
    startNavigation: vi.fn().mockResolvedValue(undefined),
    endNavigation: vi.fn().mockResolvedValue(undefined),
    startTimespan: vi.fn().mockResolvedValue(undefined),
    endTimespan: vi.fn().mockResolvedValue(undefined),
    snapshot: vi.fn().mockResolvedValue(undefined),
  }) as unknown as UserFlow;
const createCdpClient = () => ({
  send: vi.fn().mockResolvedValue(undefined),
});
const createPage = (cdpClient = createCdpClient()) =>
  ({
    createCDPSession: vi.fn().mockResolvedValue(cdpClient),
    setCookie: vi.fn().mockResolvedValue(undefined),
  }) as unknown as Page;

const createExtension = (flow: UserFlow, page: Page = createPage()) =>
  new UserFlowRunnerExtension({} as never, page, flow);

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

  it('dispatches clearCache custom steps through the current page cache controls', async () => {
    const flow = createFlow();
    const cdpClient = createCdpClient();
    const page = createPage(cdpClient);
    const extension = createExtension(flow, page);

    await extension.runStep(
      {
        type: 'customStep',
        name: AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
        parameters: undefined,
      },
      {} as never,
    );

    expect(page.createCDPSession).toHaveBeenCalledWith();
    expect(cdpClient.send).toHaveBeenCalledWith('Network.clearBrowserCache');
  });

  it('dispatches addCookie custom steps through page.setCookie', async () => {
    const flow = createFlow();
    const page = createPage();
    const extension = createExtension(flow, page);

    await extension.runStep(
      {
        type: 'customStep',
        name: AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
        parameters: {
          name: 'session',
          value: 'token',
          url: 'https://example.com/app',
          domain: '.example.com',
          path: '/',
          secure: true,
          httpOnly: true,
          sameSite: 'Strict',
        },
      },
      {} as never,
    );

    expect(page.setCookie).toHaveBeenCalledWith({
      name: 'session',
      value: 'token',
      url: 'https://example.com/app',
      domain: '.example.com',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Strict',
    });
  });

  it('propagates browser failures for clearCache and addCookie custom steps', async () => {
    const flow = createFlow();
    const clearCacheClient = {
      send: vi.fn().mockRejectedValue(new Error('cache clear failed')),
    };
    const clearCacheExtension = createExtension(flow, {
      ...createPage(),
      createCDPSession: vi.fn().mockResolvedValue(clearCacheClient),
    } as unknown as Page);
    const addCookieExtension = createExtension(flow, {
      ...createPage(),
      setCookie: vi.fn().mockRejectedValue(new Error('cookie write failed')),
    } as unknown as Page);

    await expect(
      clearCacheExtension.runStep(
        {
          type: 'customStep',
          name: AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
          parameters: undefined,
        },
        {} as never,
      ),
    ).rejects.toThrow('cache clear failed');

    await expect(
      addCookieExtension.runStep(
        {
          type: 'customStep',
          name: AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
          parameters: {
            name: 'session',
            value: 'token',
            url: 'https://example.com/app',
          },
        },
        {} as never,
      ),
    ).rejects.toThrow('cookie write failed');
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
