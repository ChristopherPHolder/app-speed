export const DEVICE_TYPE = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
} as const;

export const DEFAULT_AUDIT_DETAILS = {
  title: '',
  device: 'mobile',
  timeout: 30000,
  steps: [
    { type: 'startNavigation', stepOptions: { name: 'Initial Navigation' } },
    { type: 'navigate', url: '' },
    { type: 'endNavigation' },
  ],
} as const;
