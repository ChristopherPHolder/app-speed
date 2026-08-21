import { Effect, Schema } from 'effect';
import type { TraceScreenshotFrame } from './trace-screenshots';

export interface TraceFilmstripSettings {
  readonly useFixedInterval: boolean;
  readonly intervalMilliseconds: number;
  readonly useTimeRange: boolean;
  readonly startMilliseconds: number;
  readonly endMilliseconds: number;
  readonly showTimestamps: boolean;
  readonly imageHeight: number;
  readonly padding: number;
}

export const defaultTraceFilmstripSettings: TraceFilmstripSettings = {
  useFixedInterval: true,
  intervalMilliseconds: 100,
  useTimeRange: false,
  startMilliseconds: 0,
  endMilliseconds: 0,
  showTimestamps: true,
  imageHeight: 200,
  padding: 10,
};

export interface TraceFilmstripFrame extends TraceScreenshotFrame {
  readonly sourceIndex: number;
  readonly displayTimestampMicroseconds: number;
  readonly offsetMilliseconds: number;
  readonly deltaMilliseconds: number;
}

export interface FilmstripImageDimensions {
  readonly width: number;
  readonly height: number;
}

export interface FilmstripExportLayout {
  readonly width: number;
  readonly height: number;
  readonly imageHeight: number;
  readonly textHeight: number;
  readonly padding: number;
  readonly frames: ReadonlyArray<{ readonly x: number; readonly width: number }>;
}

export class InvalidFilmstripSettingsError extends Schema.TaggedErrorClass<InvalidFilmstripSettingsError>()(
  'InvalidFilmstripSettingsError',
  { message: Schema.String },
) {}

export class FilmstripExportTooLargeError extends Schema.TaggedErrorClass<FilmstripExportTooLargeError>()(
  'FilmstripExportTooLargeError',
  { message: Schema.String, width: Schema.Number, height: Schema.Number },
) {}

const rangeFrames = (
  frames: ReadonlyArray<TraceScreenshotFrame>,
  startMicroseconds: number,
  endMicroseconds: number,
): ReadonlyArray<{ readonly frame: TraceScreenshotFrame; readonly sourceIndex: number }> => {
  let openingIndex = 0;
  let closingIndex = frames.length - 1;

  for (const [index, frame] of frames.entries()) {
    if (frame.timestampMicroseconds <= startMicroseconds) openingIndex = index;
    if (frame.timestampMicroseconds >= endMicroseconds) {
      closingIndex = index;
      break;
    }
  }

  return frames.flatMap((frame, sourceIndex) =>
    (sourceIndex === openingIndex || frame.timestampMicroseconds >= startMicroseconds) &&
    (sourceIndex === closingIndex || frame.timestampMicroseconds <= endMicroseconds)
      ? [{ frame, sourceIndex }]
      : [],
  );
};

const validateSettings = (settings: TraceFilmstripSettings, durationMilliseconds: number): void => {
  if (
    settings.intervalMilliseconds < 10 ||
    settings.intervalMilliseconds > 2_000 ||
    settings.intervalMilliseconds % 10 !== 0
  ) {
    throw new InvalidFilmstripSettingsError({ message: 'The interval must be from 10 ms to 2,000 ms in 10 ms steps.' });
  }
  if (
    settings.useTimeRange &&
    (settings.startMilliseconds < 0 ||
      settings.endMilliseconds < settings.startMilliseconds ||
      settings.endMilliseconds > durationMilliseconds)
  ) {
    throw new InvalidFilmstripSettingsError({ message: 'The selected time range is outside the trace duration.' });
  }
  if (
    !Number.isInteger(settings.imageHeight) ||
    settings.imageHeight < 1 ||
    !Number.isInteger(settings.padding) ||
    settings.padding < 0
  ) {
    throw new InvalidFilmstripSettingsError({ message: 'Export height and padding must be positive whole pixels.' });
  }
};

export const createTraceFilmstrip = (
  frames: ReadonlyArray<TraceScreenshotFrame>,
  settings: TraceFilmstripSettings,
): ReadonlyArray<TraceFilmstripFrame> => {
  if (frames.length === 0) return [];
  const origin = frames[0]?.timestampMicroseconds ?? 0;
  const finalTimestamp = frames.at(-1)?.timestampMicroseconds ?? origin;
  const durationMilliseconds = (finalTimestamp - origin) / 1_000;
  validateSettings(settings, durationMilliseconds);

  const startMicroseconds = origin + (settings.useTimeRange ? settings.startMilliseconds * 1_000 : 0);
  const endMicroseconds =
    origin + (settings.useTimeRange ? settings.endMilliseconds * 1_000 : durationMilliseconds * 1_000);
  const candidates = settings.useTimeRange
    ? rangeFrames(frames, startMicroseconds, endMicroseconds)
    : frames.map((frame, sourceIndex) => ({ frame, sourceIndex }));

  const displayed: Array<{ frame: TraceScreenshotFrame; sourceIndex: number; displayTimestampMicroseconds: number }> =
    [];
  if (!settings.useFixedInterval) {
    displayed.push(
      ...candidates.map(({ frame, sourceIndex }) => ({
        frame,
        sourceIndex,
        displayTimestampMicroseconds: frame.timestampMicroseconds,
      })),
    );
  } else if (candidates.length === 1) {
    const only = candidates[0];
    if (only) displayed.push({ ...only, displayTimestampMicroseconds: startMicroseconds });
  } else {
    const intervalMicroseconds = settings.intervalMilliseconds * 1_000;
    let candidateIndex = 0;
    let syntheticTimestamp = startMicroseconds;
    while (syntheticTimestamp <= endMicroseconds) {
      while (
        candidateIndex < candidates.length - 1 &&
        (candidates[candidateIndex + 1]?.frame.timestampMicroseconds ?? Number.POSITIVE_INFINITY) <= syntheticTimestamp
      ) {
        candidateIndex += 1;
      }
      const candidate = candidates[candidateIndex];
      if (candidate) displayed.push({ ...candidate, displayTimestampMicroseconds: syntheticTimestamp });
      syntheticTimestamp += intervalMicroseconds;
    }

    if (!settings.useTimeRange && displayed.at(-1)?.sourceIndex !== frames.length - 1) {
      const finalFrame = frames.at(-1);
      if (finalFrame) {
        displayed.push({
          frame: finalFrame,
          sourceIndex: frames.length - 1,
          displayTimestampMicroseconds: syntheticTimestamp,
        });
      }
    }
  }

  return displayed.map(({ frame, sourceIndex, displayTimestampMicroseconds }, index) => ({
    ...frame,
    sourceIndex,
    displayTimestampMicroseconds,
    offsetMilliseconds: (displayTimestampMicroseconds - origin) / 1_000,
    deltaMilliseconds:
      index === 0
        ? 0
        : (displayTimestampMicroseconds - (displayed[index - 1]?.displayTimestampMicroseconds ?? origin)) / 1_000,
  }));
};

export const calculateFilmstripExportLayout = Effect.fn('calculateFilmstripExportLayout')(function* (
  dimensions: ReadonlyArray<FilmstripImageDimensions>,
  settings: Pick<TraceFilmstripSettings, 'imageHeight' | 'padding' | 'showTimestamps'>,
  limits: { readonly maxDimension: number; readonly maxArea: number } = { maxDimension: 32_767, maxArea: 268_435_456 },
) {
  if (
    !Number.isInteger(settings.imageHeight) ||
    settings.imageHeight < 1 ||
    !Number.isInteger(settings.padding) ||
    settings.padding < 0
  ) {
    return yield* new InvalidFilmstripSettingsError({
      message: 'Export height and padding must be positive whole pixels.',
    });
  }
  const textHeight = settings.showTimestamps ? 30 : 0;
  const frameLayouts: Array<number> = [];
  for (const dimension of dimensions) {
    if (dimension.width <= 0 || dimension.height <= 0) {
      return yield* new InvalidFilmstripSettingsError({ message: 'A screenshot has invalid image dimensions.' });
    }
    frameLayouts.push(Math.max(1, Math.round((settings.imageHeight * dimension.width) / dimension.height)));
  }
  const width = settings.padding * (frameLayouts.length + 1) + frameLayouts.reduce((total, value) => total + value, 0);
  const height = settings.padding * 2 + settings.imageHeight + textHeight;
  if (width > limits.maxDimension || height > limits.maxDimension || width * height > limits.maxArea) {
    return yield* new FilmstripExportTooLargeError({
      message:
        'This filmstrip is too large to export safely. Narrow the time range, increase the interval, or reduce the output height.',
      width,
      height,
    });
  }
  let x = settings.padding;
  return {
    width,
    height,
    imageHeight: settings.imageHeight,
    textHeight,
    padding: settings.padding,
    frames: frameLayouts.map((frameWidth) => {
      const frame = { x, width: frameWidth };
      x += frameWidth + settings.padding;
      return frame;
    }),
  };
});
