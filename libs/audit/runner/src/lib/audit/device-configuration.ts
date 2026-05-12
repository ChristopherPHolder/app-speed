import { Config as LighthouseConfig, defaultConfig, desktopConfig } from 'lighthouse';
import { type Viewport } from 'puppeteer';

import { DEVICE_TYPE, DeviceSchema } from '@app-speed/audit/domain';

export type RunnerDeviceConfig = {
  lighthouse: LighthouseConfig;
  defaultViewport: Viewport;
  userAgent: string;
};

const createViewport = (config: LighthouseConfig): Viewport => {
  const screenEmulation = config.settings?.screenEmulation;

  if (
    !screenEmulation ||
    screenEmulation.disabled ||
    screenEmulation.width === undefined ||
    screenEmulation.height === undefined
  ) {
    throw new Error('Missing screen emulation settings for audit runner device config');
  }

  return {
    width: screenEmulation.width,
    height: screenEmulation.height,
    deviceScaleFactor: screenEmulation.deviceScaleFactor,
    isMobile: screenEmulation.mobile,
    hasTouch: screenEmulation.mobile,
  };
};

const createDeviceConfig = (lighthouse: LighthouseConfig): RunnerDeviceConfig => {
  const userAgent = lighthouse.settings?.emulatedUserAgent;

  if (typeof userAgent !== 'string' || userAgent.length === 0) {
    throw new Error('Missing emulated user agent for audit runner device config');
  }

  const viewport = createViewport(lighthouse);

  return {
    lighthouse,
    defaultViewport: viewport,
    userAgent,
  };
};

export const deviceConfiguration = {
  [DEVICE_TYPE.MOBILE]: createDeviceConfig(defaultConfig),
  [DEVICE_TYPE.DESKTOP]: createDeviceConfig(desktopConfig),
} as const satisfies Record<typeof DeviceSchema.Type, RunnerDeviceConfig>;
