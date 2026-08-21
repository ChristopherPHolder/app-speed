import {
  calculateFilmstripExportLayout,
  createTraceFilmstrip,
  type TraceFilmstripFrame,
  type TraceFilmstripSettings,
} from '@app-speed/convenience/trace/domain';
import { Effect, Schema } from 'effect';
import { downloadBrowserArtifact, traceArtifactName, type BrowserDownloadArtifact } from './browser-download';
import type { LoadedTraceCapture } from './loaded-trace-capture';

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

export const displayFilmstripFrames = (
  trace: LoadedTraceCapture,
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

const renderFilmstripBlob = Effect.fn('renderFilmstripBlob')(function* (
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

export const renderFilmstripPng = Effect.fn('renderFilmstripPng')(function* (
  sourceFileName: string,
  frames: ReadonlyArray<BrowserFilmstripFrame>,
  settings: TraceFilmstripSettings,
) {
  const blob = yield* renderFilmstripBlob(frames, settings);
  return {
    blob,
    downloadName: traceArtifactName(sourceFileName, 'filmstrip', 'png'),
  } satisfies BrowserDownloadArtifact;
});

export const downloadFilmstripPng = Effect.fn('downloadFilmstripPng')(function* (
  sourceFileName: string,
  frames: ReadonlyArray<BrowserFilmstripFrame>,
  settings: TraceFilmstripSettings,
) {
  const artifact = yield* renderFilmstripPng(sourceFileName, frames, settings);
  yield* downloadBrowserArtifact(artifact);
});
