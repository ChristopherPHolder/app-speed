import { assert, it } from '@effect/vitest';
import { defaultFilmstripComparisonLabel, defaultTraceFilmstripSettings } from '@app-speed/convenience/trace/domain';
import { Effect } from 'effect';
import { renderFilmstripComparisonPng } from './trace-filmstrip-comparison';
import type { BrowserFilmstripFrame } from './trace-filmstrip';

const frame = (sourceIndex: number, source: string): BrowserFilmstripFrame => ({
  timestampMicroseconds: sourceIndex * 100_000,
  displayTimestampMicroseconds: sourceIndex * 100_000,
  sourceIndex,
  offsetMilliseconds: sourceIndex * 100,
  deltaMilliseconds: sourceIndex === 0 ? 0 : 100,
  format: 'png',
  base64Data: source,
  source,
});

it.effect('renders independently sized, labelled rows into one left-aligned comparison', () =>
  Effect.gen(function* () {
    class SuccessfulImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = 100;
      naturalHeight = 100;
      set src(value: string) {
        if (value) queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', SuccessfulImage);
    const drawImage = vi.fn();
    const fillText = vi.fn();
    const fillRect = vi.fn();
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'getContext', {
      value: () => ({
        fillStyle: '',
        font: '',
        textAlign: '',
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low',
        fillRect,
        drawImage,
        fillText,
      }),
    });
    Object.defineProperty(canvas, 'toBlob', { value: (callback: BlobCallback) => callback(new Blob(['png'])) });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) =>
      tagName === 'canvas' ? canvas : originalCreateElement(tagName),
    );

    const artifact = yield* renderFilmstripComparisonPng(
      {
        sourceFileName: `${'baseline'.repeat(12)}.json`,
        frames: [frame(0, 'first'), frame(1, 'second')],
        settings: { ...defaultTraceFilmstripSettings, imageHeight: 100 },
        label: { includeLabel: true, label: '  Baseline  ' },
      },
      {
        sourceFileName: 'after.trace',
        frames: [frame(0, 'third')],
        settings: { ...defaultTraceFilmstripSettings, imageHeight: 50, showTimestamps: false },
        label: { ...defaultFilmstripComparisonLabel('After'), includeLabel: false },
      },
    );

    assert.isTrue(
      fillRect.mock.calls.some((call) => call[0] === 0 && call[1] === 0 && call[2] === 230 && call[3] === 298),
    );
    assert.strictEqual(drawImage.mock.calls.length, 3);
    assert.deepStrictEqual(drawImage.mock.calls[0]?.slice(1), [10, 64, 100, 100]);
    assert.deepStrictEqual(drawImage.mock.calls[2]?.slice(1), [10, 238, 50, 50]);
    assert.deepStrictEqual(fillText.mock.calls[0], ['Baseline', 10, 22, 210]);
    assert.strictEqual(String(fillText.mock.calls[1]?.[0]).length, 80);
    assert.isTrue(fillRect.mock.calls.some((call) => call[1] === 216 && call[3] === 1));
    assert.strictEqual(
      artifact.downloadName,
      'baselinebaselinebaselinebaselinebaselinebaselinebaselinebaselinebaselinebaselinebaselinebaseline-vs-after-filmstrip-comparison.png',
    );
    assert.strictEqual(canvas.width, 0);
    assert.strictEqual(canvas.height, 0);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  }),
);
