import {
  calculateFilmstripComparisonLayout,
  normalizedFilmstripComparisonLabel,
  truncateFilmstripComparisonText,
  type FilmstripComparisonLabelSettings,
  type FilmstripComparisonLayoutRow,
  type TraceFilmstripSettings,
} from '@app-speed/convenience/trace/domain';
import { Effect } from 'effect';
import {
  downloadBrowserArtifact,
  filmstripComparisonArtifactName,
  type BrowserDownloadArtifact,
} from './browser-download';
import {
  decodeFilmstripImage,
  FilmstripExportError,
  filmstripCanvasBlob,
  type BrowserFilmstripFrame,
} from './trace-filmstrip';

export interface BrowserFilmstripComparisonRow {
  readonly sourceFileName: string;
  readonly frames: ReadonlyArray<BrowserFilmstripFrame>;
  readonly settings: TraceFilmstripSettings;
  readonly label: FilmstripComparisonLabelSettings;
}

const drawRow = (
  context: CanvasRenderingContext2D,
  row: BrowserFilmstripComparisonRow,
  images: ReadonlyArray<HTMLImageElement>,
  layout: FilmstripComparisonLayoutRow,
): boolean => {
  if (row.label.includeLabel) {
    context.fillStyle = '#1f2937';
    context.font = '600 20px sans-serif';
    context.textAlign = 'left';
    context.fillText(row.label.label.trim(), 10, layout.y + 22, Math.max(1, layout.width - 20));
    context.fillStyle = '#5f6368';
    context.font = '14px sans-serif';
    context.fillText(
      truncateFilmstripComparisonText(row.sourceFileName),
      10,
      layout.y + 43,
      Math.max(1, layout.width - 20),
    );
  }

  const filmstripY = layout.y + layout.labelHeight;
  for (const [index, frameLayout] of layout.filmstrip.frames.entries()) {
    const image = images[index];
    const frame = row.frames[index];
    if (!image || !frame) return false;
    context.drawImage(
      image,
      frameLayout.x,
      filmstripY + layout.filmstrip.padding,
      frameLayout.width,
      layout.filmstrip.imageHeight,
    );
    if (row.settings.showTimestamps) {
      context.fillStyle = '#1f2937';
      context.font = '14px sans-serif';
      context.textAlign = 'center';
      context.fillText(
        `${frame.offsetMilliseconds.toFixed(1)} ms`,
        frameLayout.x + frameLayout.width / 2,
        filmstripY + layout.filmstrip.padding + layout.filmstrip.imageHeight + 20,
      );
    }
  }
  return true;
};

export const renderFilmstripComparisonPng = Effect.fn('renderFilmstripComparisonPng')(function* (
  first: BrowserFilmstripComparisonRow,
  second: BrowserFilmstripComparisonRow,
) {
  if (first.frames.length === 0 || second.frames.length === 0) {
    return yield* new FilmstripExportError({ message: 'Both filmstrips need displayed frames before export.' });
  }
  yield* normalizedFilmstripComparisonLabel(first.label);
  yield* normalizedFilmstripComparisonLabel(second.label);
  const loadedImages: Array<HTMLImageElement> = [];
  const decodeTrackedImage = (frame: BrowserFilmstripFrame) =>
    decodeFilmstripImage(frame).pipe(
      Effect.tap((image) =>
        Effect.sync(() => {
          loadedImages.push(image);
        }),
      ),
    );
  const blob = yield* Effect.gen(function* () {
    const [firstImages, secondImages] = yield* Effect.all(
      [
        Effect.forEach(first.frames, decodeTrackedImage, { concurrency: 4 }),
        Effect.forEach(second.frames, decodeTrackedImage, { concurrency: 4 }),
      ],
      { concurrency: 2 },
    );
    const layout = yield* calculateFilmstripComparisonLayout([
      {
        dimensions: firstImages.map((image) => ({ width: image.naturalWidth, height: image.naturalHeight })),
        settings: first.settings,
        label: first.label,
      },
      {
        dimensions: secondImages.map((image) => ({ width: image.naturalWidth, height: image.naturalHeight })),
        settings: second.settings,
        label: second.label,
      },
    ]);
    const canvas = document.createElement('canvas');
    canvas.width = layout.width;
    canvas.height = layout.height;
    return yield* Effect.gen(function* () {
      const context = canvas.getContext('2d');
      if (!context) {
        return yield* new FilmstripExportError({ message: 'The browser could not create a drawing canvas.' });
      }
      const complete = yield* Effect.try({
        try: () => {
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, layout.width, layout.height);
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';
          const firstComplete = drawRow(context, first, firstImages, layout.rows[0]);
          context.fillStyle = '#dadce0';
          context.fillRect(0, layout.dividerY, layout.width, layout.dividerHeight);
          const secondComplete = drawRow(context, second, secondImages, layout.rows[1]);
          return firstComplete && secondComplete;
        },
        catch: () => new FilmstripExportError({ message: 'The complete comparison could not be rendered.' }),
      });
      if (!complete) {
        return yield* new FilmstripExportError({ message: 'The complete comparison could not be rendered.' });
      }
      return yield* filmstripCanvasBlob(canvas);
    }).pipe(
      Effect.ensuring(
        Effect.sync(() => {
          canvas.width = 0;
          canvas.height = 0;
        }),
      ),
    );
  }).pipe(
    Effect.ensuring(
      Effect.sync(() => {
        for (const image of loadedImages) image.src = '';
      }),
    ),
  );

  return {
    blob,
    downloadName: filmstripComparisonArtifactName(first.sourceFileName, second.sourceFileName),
  } satisfies BrowserDownloadArtifact;
});

export const downloadFilmstripComparisonPng = Effect.fn('downloadFilmstripComparisonPng')(function* (
  first: BrowserFilmstripComparisonRow,
  second: BrowserFilmstripComparisonRow,
) {
  yield* downloadBrowserArtifact(yield* renderFilmstripComparisonPng(first, second));
});
