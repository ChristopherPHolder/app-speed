import { Effect, Schema } from 'effect';

export interface BrowserDownloadArtifact {
  readonly blob: Blob;
  readonly downloadName: string;
}

export class BrowserDownloadError extends Schema.TaggedErrorClass<BrowserDownloadError>()('BrowserDownloadError', {
  message: Schema.String,
}) {}

export const safeTraceBaseName = (sourceFileName: string): string => {
  const withoutExtension = sourceFileName.trim().replace(/\.(json|trace)$/i, '');
  return withoutExtension.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'trace';
};

export const traceArtifactName = (
  sourceFileName: string,
  suffix: 'screenshots' | 'filmstrip',
  extension: 'zip' | 'png',
): string => `${safeTraceBaseName(sourceFileName)}-${suffix}.${extension}`;

export const filmstripComparisonArtifactName = (firstSourceFileName: string, secondSourceFileName: string): string =>
  `${safeTraceBaseName(firstSourceFileName)}-vs-${safeTraceBaseName(secondSourceFileName)}-filmstrip-comparison.png`;

const downloadError = (): BrowserDownloadError =>
  new BrowserDownloadError({ message: 'The browser could not download the generated file.' });

export const downloadBrowserArtifact = Effect.fn('downloadBrowserArtifact')(function* (
  artifact: BrowserDownloadArtifact,
) {
  yield* Effect.acquireUseRelease(
    Effect.try({
      try: () => URL.createObjectURL(artifact.blob),
      catch: downloadError,
    }),
    (objectUrl) =>
      Effect.try({
        try: () => {
          const anchor = document.createElement('a');
          anchor.href = objectUrl;
          anchor.download = artifact.downloadName;
          anchor.hidden = true;
          document.body.append(anchor);
          try {
            anchor.click();
          } finally {
            anchor.remove();
          }
        },
        catch: downloadError,
      }),
    (objectUrl) =>
      Effect.try({
        try: () => URL.revokeObjectURL(objectUrl),
        catch: downloadError,
      }),
  );
});
