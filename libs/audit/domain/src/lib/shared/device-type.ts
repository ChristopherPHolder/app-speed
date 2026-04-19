import { Schema } from 'effect';

export const DEVICE_TYPE = {
  MOBILE: 'mobile',
  // TODO implement config for table
  // TABLET: 'tablet',
  DESKTOP: 'desktop',
} as const;

export const DeviceSchema = Schema.Literal(DEVICE_TYPE.MOBILE, DEVICE_TYPE.DESKTOP);

export type DeviceType = typeof DeviceSchema.Type;
export const DEVICE_OPTIONS = DeviceSchema.literals;
