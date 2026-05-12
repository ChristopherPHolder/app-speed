import { defaultConfig, desktopConfig } from 'lighthouse';

import { DEVICE_TYPE, DeviceSchema, type DeviceType } from '@app-speed/audit/domain';
import { Effect, Schema, ParseResult } from 'effect';

export class InvalidDeviceConfigurationError extends Schema.TaggedError<InvalidDeviceConfigurationError>()(
  'InvalidDeviceConfigurationError',
  {
    deviceType: DeviceSchema,
    message: Schema.String,
    cause: Schema.instanceOf(ParseResult.ParseError),
  },
) {}

const lighthouseDevicePresets = {
  [DEVICE_TYPE.MOBILE]: defaultConfig,
  [DEVICE_TYPE.DESKTOP]: desktopConfig,
} as const;

const LighthouseRunnerSettingsSchema = Schema.Struct({
  emulatedUserAgent: Schema.String,
  screenEmulation: Schema.Struct({
    disabled: Schema.Literal(false),
    width: Schema.Number,
    height: Schema.Number,
    deviceScaleFactor: Schema.Number,
    mobile: Schema.Boolean,
  }),
});

export const DeviceConfiguration = Effect.fn('deviceConfig')(function* (deviceType: DeviceType) {
  const lighthousePreset = lighthouseDevicePresets[deviceType];
  const settings = yield* Schema.decodeUnknown(LighthouseRunnerSettingsSchema)(lighthousePreset.settings).pipe(
    Effect.mapError(
      (cause) =>
        new InvalidDeviceConfigurationError({
          deviceType,
          message: `Invalid lighthouse device configuration for ${deviceType}`,
          cause,
        }),
    ),
  );

  return {
    lighthousePreset,
    userAgent: settings.emulatedUserAgent,
    defaultViewport: {
      width: settings.screenEmulation.width,
      height: settings.screenEmulation.height,
      deviceScaleFactor: settings.screenEmulation.deviceScaleFactor,
      isMobile: settings.screenEmulation.mobile,
      hasTouch: settings.screenEmulation.mobile,
    },
  };
});
