import {
  createTraceScreenshotManifest,
  parseTraceScreenshots,
  type TraceImageFormat,
  type TraceScreenshotFrame,
  type TraceScreenshotManifest,
  type TraceScreenshotTiming,
} from '@app-speed/convenience/trace/domain';
import { Effect, Schema } from 'effect';

export interface LoadedTraceFrame extends TraceScreenshotFrame, TraceScreenshotTiming {
  readonly id: string;
  readonly sourceIndex: number;
  readonly source: string;
}

export interface LoadedTraceCapture {
  readonly sourceFileName: string;
  readonly timeOriginMicroseconds: number;
  readonly durationMilliseconds: number;
  readonly frames: ReadonlyArray<LoadedTraceFrame>;
  readonly manifest: TraceScreenshotManifest;
}

export class TraceFileReadError extends Schema.TaggedErrorClass<TraceFileReadError>()('TraceFileReadError', {
  message: Schema.String,
}) {}

const browserSource = (format: TraceImageFormat, base64Data: string): string =>
  `data:image/${format};base64,${base64Data}`;

export const loadTraceCapture = Effect.fn('loadTraceCapture')(function* (file: File) {
  const source = yield* Effect.tryPromise({
    try: () => file.text(),
    catch: () => new TraceFileReadError({ message: `Could not read ${file.name}.` }),
  });
  const parsedFrames = yield* parseTraceScreenshots(source);
  const manifest = createTraceScreenshotManifest(file.name, parsedFrames);
  const frames = parsedFrames.flatMap((frame, sourceIndex): ReadonlyArray<LoadedTraceFrame> => {
    const timing = manifest.frames[sourceIndex];
    return timing
      ? [
          {
            ...frame,
            ...timing,
            id: `frame:${sourceIndex}`,
            sourceIndex,
            source: browserSource(frame.format, frame.base64Data),
          },
        ]
      : [];
  });

  return {
    sourceFileName: file.name,
    timeOriginMicroseconds: manifest.timeOriginMicroseconds,
    durationMilliseconds: manifest.durationMilliseconds,
    frames,
    manifest,
  } satisfies LoadedTraceCapture;
});
