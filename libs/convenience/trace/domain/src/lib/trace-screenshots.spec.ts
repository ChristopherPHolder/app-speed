import { Effect } from 'effect';
import { createTraceScreenshotManifest, parseTraceScreenshots } from './trace-screenshots';

describe('trace screenshots', () => {
  it('extracts supported screenshot events and sorts them by timestamp', async () => {
    const trace = JSON.stringify({
      traceEvents: [
        { name: 'CaptureFrame', ts: 3_000, args: { data: '/9j/frame-two' } },
        {
          name: 'Screenshot',
          cat: 'disabled-by-default-devtools.screenshot',
          ts: 1_000,
          args: { snapshot: 'data:image/png;base64,iVBORframe-one' },
        },
        { name: 'ScreencastFrame', ts: 2_000, args: { dataUri: 'data:image/jpeg;base64,/9j/frame-middle' } },
      ],
    });

    await expect(Effect.runPromise(parseTraceScreenshots(trace))).resolves.toEqual([
      { timestampMicroseconds: 1_000, format: 'png', base64Data: 'iVBORframe-one' },
      { timestampMicroseconds: 2_000, format: 'jpeg', base64Data: '/9j/frame-middle' },
      { timestampMicroseconds: 3_000, format: 'jpeg', base64Data: '/9j/frame-two' },
    ]);
  });

  it('reports invalid JSON and traces without frames', async () => {
    await expect(Effect.runPromise(Effect.flip(parseTraceScreenshots('{')))).resolves.toMatchObject({
      _tag: 'InvalidTraceError',
    });
    await expect(Effect.runPromise(Effect.flip(parseTraceScreenshots('[]')))).resolves.toMatchObject({
      _tag: 'NoScreenshotFramesError',
    });
  });

  it('creates deterministic filenames and relative timings', () => {
    const manifest = createTraceScreenshotManifest('recording.json', [
      { timestampMicroseconds: 1_000, format: 'png', base64Data: 'iVBORa' },
      { timestampMicroseconds: 17_000, format: 'jpeg', base64Data: '/9j/b' },
    ]);

    expect(manifest).toMatchObject({
      version: 1,
      sourceFileName: 'recording.json',
      timeOriginMicroseconds: 1_000,
      durationMilliseconds: 16,
      frames: [
        { file: 'screenshots/frame-0001.png', offsetMilliseconds: 0, deltaMilliseconds: 0 },
        { file: 'screenshots/frame-0002.jpg', offsetMilliseconds: 16, deltaMilliseconds: 16 },
      ],
    });
  });
});
