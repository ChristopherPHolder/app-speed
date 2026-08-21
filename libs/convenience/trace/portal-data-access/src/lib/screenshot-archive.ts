import { type TraceScreenshotManifest } from '@app-speed/convenience/trace/domain';
import { Effect, Schema } from 'effect';
import { strToU8, zipSync } from 'fflate';
import { downloadBrowserArtifact, safeTraceBaseName, traceArtifactName } from './browser-download';
import { loadTraceCapture, type LoadedTraceCapture } from './loaded-trace-capture';

export interface ScreenshotArchive {
  readonly blob: Blob;
  readonly downloadName: string;
  readonly manifest: TraceScreenshotManifest;
}

export interface ScreenshotExtraction {
  readonly capture: LoadedTraceCapture;
  readonly archive: ScreenshotArchive;
}

export class ScreenshotArchiveError extends Schema.TaggedErrorClass<ScreenshotArchiveError>()(
  'ScreenshotArchiveError',
  {
    message: Schema.String,
  },
) {}

const decodeBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

export const buildScreenshotArchive = Effect.fn('buildScreenshotArchive')(function* (capture: LoadedTraceCapture) {
  const manifest = capture.manifest;
  const root = `${safeTraceBaseName(capture.sourceFileName)}-screenshots`;

  const blob = yield* Effect.try({
    try: () => {
      const files: Record<string, Uint8Array> = {
        [`${root}/timings.json`]: strToU8(`${JSON.stringify(manifest, null, 2)}\n`),
      };
      for (const [index, frame] of capture.frames.entries()) {
        const timing = manifest.frames[index];
        if (timing) files[`${root}/${timing.file}`] = decodeBase64(frame.base64Data);
      }
      return new Blob([zipSync(files, { level: 0 })], { type: 'application/zip' });
    },
    catch: () => new ScreenshotArchiveError({ message: 'The screenshot archive could not be created.' }),
  });

  return {
    blob,
    downloadName: traceArtifactName(capture.sourceFileName, 'screenshots', 'zip'),
    manifest,
  } satisfies ScreenshotArchive;
});

export const prepareScreenshotExtraction = Effect.fn('prepareScreenshotExtraction')(function* (file: File) {
  const capture = yield* loadTraceCapture(file);
  const archive = yield* buildScreenshotArchive(capture);
  return { capture, archive } satisfies ScreenshotExtraction;
});

export const downloadScreenshotArchive = (archive: ScreenshotArchive) => downloadBrowserArtifact(archive);
