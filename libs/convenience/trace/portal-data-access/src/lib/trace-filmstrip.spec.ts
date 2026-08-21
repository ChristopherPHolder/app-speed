import { assert, it } from '@effect/vitest';
import { Effect } from 'effect';
import { defaultTraceFilmstripSettings } from '@app-speed/convenience/trace/domain';
import {
  displayFilmstripFrames,
  downloadFilmstripPng,
  loadTraceFilmstrip,
  renderFilmstripPng,
  type BrowserFilmstripFrame,
} from './trace-filmstrip';

const traceSource = JSON.stringify({
  traceEvents: [
    {
      name: 'Screenshot',
      cat: 'disabled-by-default-devtools.screenshot',
      ts: 1_000,
      args: { snapshot: 'data:image/png;base64,iVBORfirst' },
    },
    { name: 'CaptureFrame', ts: 251_000, args: { data: '/9j/final' } },
  ],
});

describe('trace filmstrip data access', () => {
  it.effect('loads a trace and supplies browser-ready displayed frames', () =>
    Effect.gen(function* () {
      const file = new File([traceSource], 'Checkout trace.json');
      Object.defineProperty(file, 'text', { value: () => Promise.resolve(traceSource) });
      const trace = yield* loadTraceFilmstrip(file);
      const displayed = displayFilmstripFrames(trace, defaultTraceFilmstripSettings);

      assert.strictEqual(trace.durationMilliseconds, 250);
      assert.strictEqual(displayed.length, 4);
      assert.strictEqual(displayed[0]?.source, 'data:image/png;base64,iVBORfirst');
      assert.strictEqual(displayed.at(-1)?.sourceIndex, 1);
    }),
  );

  it.effect('reports invalid traces with a typed error', () =>
    Effect.gen(function* () {
      const file = new File(['{'], 'broken.trace');
      Object.defineProperty(file, 'text', { value: () => Promise.resolve('{') });
      const error = yield* Effect.flip(loadTraceFilmstrip(file));
      assert.strictEqual(error._tag, 'InvalidTraceError');
    }),
  );

  it('downloads a complete named PNG and revokes its temporary URL', async () => {
    class SuccessfulImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = 200;
      naturalHeight = 100;
      set src(value: string) {
        if (value) queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', SuccessfulImage);
    const drawImage = vi.fn();
    const fillText = vi.fn();
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'getContext', {
      value: () => ({
        fillStyle: '',
        font: '',
        textAlign: '',
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low',
        fillRect: vi.fn(),
        drawImage,
        fillText,
      }),
    });
    Object.defineProperty(canvas, 'toBlob', { value: (callback: BlobCallback) => callback(new Blob(['png'])) });
    const anchor = document.createElement('a');
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => undefined);
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') return canvas;
      if (tagName === 'a') return anchor;
      return originalCreateElement(tagName);
    });
    const createObjectURL = vi.fn(() => 'blob:filmstrip');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });

    const frame: BrowserFilmstripFrame = {
      timestampMicroseconds: 0,
      displayTimestampMicroseconds: 0,
      sourceIndex: 0,
      offsetMilliseconds: 0,
      deltaMilliseconds: 0,
      format: 'png',
      base64Data: 'iVBORframe',
      source: 'data:image/png;base64,iVBORframe',
    };
    await Effect.runPromise(downloadFilmstripPng('Checkout trace.json', [frame], defaultTraceFilmstripSettings));

    expect(drawImage).toHaveBeenCalledOnce();
    expect(fillText).toHaveBeenCalledWith('0.0 ms', 210, 230);
    expect(anchor.download).toBe('Checkout-trace-filmstrip.png');
    expect(click).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:filmstrip');
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('fails image decoding through the typed error channel', async () => {
    class FailingImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = 0;
      naturalHeight = 0;
      set src(value: string) {
        if (value) queueMicrotask(() => this.onerror?.());
      }
    }
    vi.stubGlobal('Image', FailingImage);
    const frame: BrowserFilmstripFrame = {
      timestampMicroseconds: 0,
      displayTimestampMicroseconds: 0,
      sourceIndex: 0,
      offsetMilliseconds: 0,
      deltaMilliseconds: 0,
      format: 'png',
      base64Data: 'iVBORframe',
      source: 'data:image/png;base64,iVBORframe',
    };
    await expect(
      Effect.runPromise(Effect.flip(renderFilmstripPng([frame], defaultTraceFilmstripSettings))),
    ).resolves.toMatchObject({
      _tag: 'FilmstripImageDecodeError',
    });
    vi.unstubAllGlobals();
  });
});
