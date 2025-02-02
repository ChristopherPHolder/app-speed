export const DEVICE_TYPE = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
} as const;

export const DEVICE_OPTIONS = Object.values(DEVICE_TYPE);

export type DeviceType = (typeof DEVICE_TYPE)[keyof typeof DEVICE_TYPE];
