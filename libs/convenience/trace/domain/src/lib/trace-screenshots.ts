import { Effect, Schema } from 'effect';

export const TraceImageFormat = Schema.Literals(['jpeg', 'png']);
export type TraceImageFormat = typeof TraceImageFormat.Type;

export interface TraceScreenshotFrame {
  readonly timestampMicroseconds: number;
  readonly format: TraceImageFormat;
  readonly base64Data: string;
}

export interface TraceScreenshotTiming {
  readonly file: string;
  readonly timestampMicroseconds: number;
  readonly offsetMilliseconds: number;
  readonly deltaMilliseconds: number;
}

export interface TraceScreenshotManifest {
  readonly version: 1;
  readonly sourceFileName: string;
  readonly timeOriginMicroseconds: number;
  readonly durationMilliseconds: number;
  readonly frames: ReadonlyArray<TraceScreenshotTiming>;
}

export class InvalidTraceError extends Schema.TaggedErrorClass<InvalidTraceError>()('InvalidTraceError', {
  message: Schema.String,
}) {}

export class NoScreenshotFramesError extends Schema.TaggedErrorClass<NoScreenshotFramesError>()(
  'NoScreenshotFramesError',
  { message: Schema.String },
) {}

type UnknownRecord = Readonly<Record<string, unknown>>;

const isUnknownRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (record: UnknownRecord, key: string): string | undefined => {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
};

const screenshotPayload = (event: UnknownRecord): string | undefined => {
  const name = readString(event, 'name');
  const category = readString(event, 'cat') ?? '';
  const args = event['args'];
  if (!isUnknownRecord(args)) return undefined;

  if (name === 'Screenshot' && category.includes('disabled-by-default-devtools.screenshot')) {
    return readString(args, 'snapshot');
  }
  if (name === 'ScreencastFrame' || name === 'screencastFrame') {
    return readString(args, 'dataUri') ?? readString(args, 'data');
  }
  if (name === 'CaptureFrame') {
    return readString(args, 'data');
  }
  return undefined;
};

const normalizeImage = (payload: string): Pick<TraceScreenshotFrame, 'format' | 'base64Data'> | undefined => {
  const base64Data = payload.includes(',') ? payload.slice(payload.indexOf(',') + 1) : payload;
  if (base64Data.startsWith('/9j/')) return { format: 'jpeg', base64Data };
  if (base64Data.startsWith('iVBOR')) return { format: 'png', base64Data };
  return undefined;
};

const traceEvents = (decoded: unknown): ReadonlyArray<unknown> | undefined => {
  if (Array.isArray(decoded)) return decoded;
  if (!isUnknownRecord(decoded)) return undefined;
  const events = decoded['traceEvents'];
  return Array.isArray(events) ? events : undefined;
};

export const parseTraceScreenshots = Effect.fn('parseTraceScreenshots')(function* (source: string) {
  const decoded = yield* Schema.decodeUnknownEffect(Schema.UnknownFromJsonString)(source).pipe(
    Effect.mapError(() => new InvalidTraceError({ message: 'The selected file is not valid JSON.' })),
  );
  const events = traceEvents(decoded);
  if (!events) {
    return yield* new InvalidTraceError({
      message: 'The trace must be an event array or an object containing a traceEvents array.',
    });
  }

  const frames = events.flatMap((event): ReadonlyArray<TraceScreenshotFrame> => {
    if (!isUnknownRecord(event) || typeof event['ts'] !== 'number') return [];
    const payload = screenshotPayload(event);
    if (!payload) return [];
    const image = normalizeImage(payload);
    return image ? [{ timestampMicroseconds: event['ts'], ...image }] : [];
  });

  if (frames.length === 0) {
    return yield* new NoScreenshotFramesError({ message: 'No screenshot frames were found in this trace.' });
  }
  return [...frames].sort((left, right) => left.timestampMicroseconds - right.timestampMicroseconds);
});

export const createTraceScreenshotManifest = (
  sourceFileName: string,
  frames: ReadonlyArray<TraceScreenshotFrame>,
): TraceScreenshotManifest => {
  const origin = frames[0]?.timestampMicroseconds ?? 0;
  const digits = Math.max(4, String(frames.length).length);
  const timings = frames.map((frame, index) => ({
    file: `screenshots/frame-${String(index + 1).padStart(digits, '0')}.${frame.format === 'jpeg' ? 'jpg' : 'png'}`,
    timestampMicroseconds: frame.timestampMicroseconds,
    offsetMilliseconds: (frame.timestampMicroseconds - origin) / 1_000,
    deltaMilliseconds:
      index === 0 ? 0 : (frame.timestampMicroseconds - frames[index - 1].timestampMicroseconds) / 1_000,
  }));

  return {
    version: 1,
    sourceFileName,
    timeOriginMicroseconds: origin,
    durationMilliseconds: timings.at(-1)?.offsetMilliseconds ?? 0,
    frames: timings,
  };
};
