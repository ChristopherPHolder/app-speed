import { unzipSync, strFromU8 } from 'fflate';
import { Effect } from 'effect';
import { prepareScreenshotExtraction } from './screenshot-archive';

const readBlob = (blob: Blob): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result);
      else reject(new Error('Expected an ArrayBuffer result.'));
    });
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsArrayBuffer(blob);
  });

describe('prepareScreenshotExtraction', () => {
  it('packages screenshots and timings in a named folder', async () => {
    const source = JSON.stringify({
      traceEvents: [
        {
          name: 'Screenshot',
          cat: 'disabled-by-default-devtools.screenshot',
          ts: 10_000,
          args: { snapshot: 'data:image/png;base64,iVBORw0KGgo=' },
        },
      ],
    });
    const file = new File([source], 'Checkout trace.json');
    Object.defineProperty(file, 'text', { value: () => Promise.resolve(source) });
    const { archive, capture } = await Effect.runPromise(prepareScreenshotExtraction(file));
    const files = unzipSync(new Uint8Array(await readBlob(archive.blob)));

    expect(archive.downloadName).toBe('Checkout-trace-screenshots.zip');
    expect(capture.frames).toEqual([
      expect.objectContaining({
        source: 'data:image/png;base64,iVBORw0KGgo=',
        offsetMilliseconds: 0,
      }),
    ]);
    expect(Object.keys(files)).toEqual([
      'Checkout-trace-screenshots/timings.json',
      'Checkout-trace-screenshots/screenshots/frame-0001.png',
    ]);
    expect(JSON.parse(strFromU8(files['Checkout-trace-screenshots/timings.json']))).toMatchObject({
      sourceFileName: 'Checkout trace.json',
      frames: [{ file: 'screenshots/frame-0001.png', offsetMilliseconds: 0 }],
    });
  });
});
