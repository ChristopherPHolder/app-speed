import {
  calculateFilmstripExportLayout,
  createTraceFilmstrip,
  parseTraceScreenshots,
  type TraceFilmstripFrame,
  type TraceFilmstripSettings,
  type TraceScreenshotFrame,
} from '@app-speed/convenience/trace/domain';
import { Effect, Schema } from 'effect';

export interface BrowserTraceFrame extends TraceScreenshotFrame {
  readonly source: string;
}

export interface LoadedTraceFilmstrip {
  readonly sourceFileName: string;
  readonly frames: ReadonlyArray<BrowserTraceFrame>;
  readonly durationMilliseconds: number;
}

export interface BrowserFilmstripFrame extends TraceFilmstripFrame {
  readonly source: string;
}

export class FilmstripImageDecodeError extends Schema.TaggedErrorClass<FilmstripImageDecodeError>()(
  'FilmstripImageDecodeError',
  { message: Schema.String },
) {}

export class FilmstripExportError extends Schema.TaggedErrorClass<FilmstripExportError>()('FilmstripExportError', {
  message: Schema.String,
}) {}

const safeFilmstripName = (fileName: string): string => {
  const base = fileName
    .replace(/\.(json|trace)$/i, '')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'trace'}-filmstrip.png`;
};

export const loadTraceFilmstrip = Effect.fn('loadTraceFilmstrip')(function* (file: File) {
  const source = yield* Effect.tryPromise({
    try: () => file.text(),
    catch: () => new FilmstripExportError({ message: `Could not read ${file.name}.` }),
  });
  const frames = yield* parseTraceScreenshots(source);
  const origin = frames[0]?.timestampMicroseconds ?? 0;
  return {
    sourceFileName: file.name,
    frames: frames.map((frame) => ({ ...frame, source: `data:image/${frame.format};base64,${frame.base64Data}` })),
    durationMilliseconds: ((frames.at(-1)?.timestampMicroseconds ?? origin) - origin) / 1_000,
  } satisfies LoadedTraceFilmstrip;
});

export const displayFilmstripFrames = (
  trace: LoadedTraceFilmstrip,
  settings: TraceFilmstripSettings,
): ReadonlyArray<BrowserFilmstripFrame> => {
  const displayed = createTraceFilmstrip(trace.frames, settings);
  return displayed.flatMap((frame): ReadonlyArray<BrowserFilmstripFrame> => {
    const source = trace.frames[frame.sourceIndex]?.source;
    return source ? [{ ...frame, source }] : [];
  });
};

const decodeImage = (frame: BrowserFilmstripFrame): Effect.Effect<HTMLImageElement, FilmstripImageDecodeError> =>
  Effect.callback<HTMLImageElement, FilmstripImageDecodeError>((resume) => {
    const image = new Image();
    image.onload = () => resume(Effect.succeed(image));
    image.onerror = () =>
      resume(
        Effect.fail(new FilmstripImageDecodeError({ message: 'A screenshot could not be decoded for PNG export.' })),
      );
    image.src = frame.source;
    return Effect.sync(() => {
      image.onload = null;
      image.onerror = null;
      image.src = '';
    });
  });

const canvasBlob = (canvas: HTMLCanvasElement): Effect.Effect<Blob, FilmstripExportError> =>
  Effect.callback<Blob, FilmstripExportError>((resume) => {
    canvas.toBlob(
      (blob) =>
        resume(
          blob
            ? Effect.succeed(blob)
            : Effect.fail(new FilmstripExportError({ message: 'The browser could not encode the filmstrip as PNG.' })),
        ),
      'image/png',
    );
  });

export const renderFilmstripPng = Effect.fn('renderFilmstripPng')(function* (
  frames: ReadonlyArray<BrowserFilmstripFrame>,
  settings: TraceFilmstripSettings,
) {
  if (frames.length === 0) {
    return yield* new FilmstripExportError({ message: 'There are no displayed frames to export.' });
  }
  const images = yield* Effect.forEach(frames, decodeImage, { concurrency: 4 });
  const layout = yield* calculateFilmstripExportLayout(
    images.map((image) => ({ width: image.naturalWidth, height: image.naturalHeight })),
    settings,
  );
  const canvas = document.createElement('canvas');
  canvas.width = layout.width;
  canvas.height = layout.height;
  const context = canvas.getContext('2d');
  if (!context) return yield* new FilmstripExportError({ message: 'The browser could not create a drawing canvas.' });

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, layout.width, layout.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  for (const [index, frameLayout] of layout.frames.entries()) {
    const image = images[index];
    const frame = frames[index];
    if (!image || !frame) {
      return yield* new FilmstripExportError({ message: 'The complete filmstrip could not be rendered.' });
    }
    context.drawImage(image, frameLayout.x, layout.padding, frameLayout.width, layout.imageHeight);
    if (settings.showTimestamps) {
      context.fillStyle = '#1f2937';
      context.font = '14px sans-serif';
      context.textAlign = 'center';
      context.fillText(
        `${frame.offsetMilliseconds.toFixed(1)} ms`,
        frameLayout.x + frameLayout.width / 2,
        layout.padding + layout.imageHeight + 20,
      );
    }
  }

  const blob = yield* canvasBlob(canvas).pipe(
    Effect.ensuring(
      Effect.sync(() => {
        canvas.width = 0;
        canvas.height = 0;
      }),
    ),
  );
  return blob;
});

export const downloadFilmstripPng = Effect.fn('downloadFilmstripPng')(function* (
  sourceFileName: string,
  frames: ReadonlyArray<BrowserFilmstripFrame>,
  settings: TraceFilmstripSettings,
) {
  const blob = yield* renderFilmstripPng(frames, settings);
  yield* Effect.acquireUseRelease(
    Effect.sync(() => URL.createObjectURL(blob)),
    (url) =>
      Effect.sync(() => {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = safeFilmstripName(sourceFileName);
        anchor.click();
      }),
    (url) => Effect.sync(() => URL.revokeObjectURL(url)),
  );
});
