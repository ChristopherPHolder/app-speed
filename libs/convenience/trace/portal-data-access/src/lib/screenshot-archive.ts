import {
  createTraceScreenshotManifest,
  parseTraceScreenshots,
  type TraceScreenshotManifest,
} from '@app-speed/convenience/trace/domain';
import { Effect, Schema } from 'effect';
import { strToU8, zipSync } from 'fflate';

export interface ScreenshotArchive {
  readonly blob: Blob;
  readonly downloadName: string;
  readonly frameCount: number;
  readonly manifest: TraceScreenshotManifest;
  readonly previewFrames: ReadonlyArray<ScreenshotPreviewFrame>;
}

export interface ScreenshotPreviewFrame {
  readonly source: string;
  readonly file: string;
  readonly timestampMicroseconds: number;
  readonly offsetMilliseconds: number;
  readonly deltaMilliseconds: number;
}

export class TraceFileReadError extends Schema.TaggedErrorClass<TraceFileReadError>()('TraceFileReadError', {
  message: Schema.String,
}) {}

export class ScreenshotArchiveError extends Schema.TaggedErrorClass<ScreenshotArchiveError>()(
  'ScreenshotArchiveError',
  {
    message: Schema.String,
  },
) {}

const safeBaseName = (fileName: string): string => {
  const withoutExtension = fileName.replace(/\.(json|trace)$/i, '');
  return (withoutExtension.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'trace') + '-screenshots';
};

const decodeBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

export const buildScreenshotArchive = Effect.fn('buildScreenshotArchive')(function* (file: File) {
  const source = yield* Effect.tryPromise({
    try: () => file.text(),
    catch: () => new TraceFileReadError({ message: `Could not read ${file.name}.` }),
  });
  const frames = yield* parseTraceScreenshots(source);
  const manifest = createTraceScreenshotManifest(file.name, frames);
  const root = safeBaseName(file.name);

  const blob = yield* Effect.try({
    try: () => {
      const files: Record<string, Uint8Array> = {
        [`${root}/timings.json`]: strToU8(`${JSON.stringify(manifest, null, 2)}\n`),
      };
      for (const [index, frame] of frames.entries()) {
        const timing = manifest.frames[index];
        if (timing) files[`${root}/${timing.file}`] = decodeBase64(frame.base64Data);
      }
      return new Blob([zipSync(files, { level: 0 })], { type: 'application/zip' });
    },
    catch: () => new ScreenshotArchiveError({ message: 'The screenshot archive could not be created.' }),
  });

  return {
    blob,
    downloadName: `${root}.zip`,
    frameCount: frames.length,
    manifest,
    previewFrames: frames.flatMap((frame, index): ReadonlyArray<ScreenshotPreviewFrame> => {
      const timing = manifest.frames[index];
      if (!timing) return [];
      return [{ source: `data:image/${frame.format};base64,${frame.base64Data}`, ...timing }];
    }),
  } satisfies ScreenshotArchive;
});

export const downloadScreenshotArchive = (archive: ScreenshotArchive): void => {
  const url = URL.createObjectURL(archive.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = archive.downloadName;
  anchor.click();
  URL.revokeObjectURL(url);
};
