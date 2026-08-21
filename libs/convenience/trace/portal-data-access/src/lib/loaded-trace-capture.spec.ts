import { assert, it } from '@effect/vitest';
import { Effect } from 'effect';
import { loadTraceCapture } from './loaded-trace-capture';

const traceSource = JSON.stringify({
  traceEvents: [
    { name: 'CaptureFrame', ts: 251_000, args: { data: '/9j/final' } },
    {
      name: 'Screenshot',
      cat: 'disabled-by-default-devtools.screenshot',
      ts: 1_000,
      args: { snapshot: 'data:image/png;base64,iVBORfirst' },
    },
  ],
});

it.effect('loads, sorts, and enriches trace screenshots once', () =>
  Effect.gen(function* () {
    const file = new File([traceSource], 'Checkout trace.json');
    const read = vi.fn(() => Promise.resolve(traceSource));
    Object.defineProperty(file, 'text', { value: read });

    const capture = yield* loadTraceCapture(file);

    assert.strictEqual(read.mock.calls.length, 1);
    assert.strictEqual(capture.sourceFileName, 'Checkout trace.json');
    assert.strictEqual(capture.timeOriginMicroseconds, 1_000);
    assert.strictEqual(capture.durationMilliseconds, 250);
    assert.deepStrictEqual(
      capture.frames.map((frame) => ({
        id: frame.id,
        file: frame.file,
        sourceIndex: frame.sourceIndex,
        source: frame.source,
        offsetMilliseconds: frame.offsetMilliseconds,
        deltaMilliseconds: frame.deltaMilliseconds,
      })),
      [
        {
          id: 'frame:0',
          file: 'screenshots/frame-0001.png',
          sourceIndex: 0,
          source: 'data:image/png;base64,iVBORfirst',
          offsetMilliseconds: 0,
          deltaMilliseconds: 0,
        },
        {
          id: 'frame:1',
          file: 'screenshots/frame-0002.jpg',
          sourceIndex: 1,
          source: 'data:image/jpeg;base64,/9j/final',
          offsetMilliseconds: 250,
          deltaMilliseconds: 250,
        },
      ],
    );
    assert.strictEqual(capture.manifest.frames.length, capture.frames.length);
    assert.strictEqual(capture.manifest.durationMilliseconds, capture.durationMilliseconds);
  }),
);

it.effect('reports file reading failures through a typed boundary error', () =>
  Effect.gen(function* () {
    const file = new File([], 'unreadable.trace');
    Object.defineProperty(file, 'text', { value: () => Promise.reject(new Error('unreadable')) });

    const error = yield* Effect.flip(loadTraceCapture(file));

    assert.strictEqual(error._tag, 'TraceFileReadError');
    assert.strictEqual(error.message, 'Could not read unreadable.trace.');
  }),
);

it.effect('preserves parser errors in the typed error channel', () =>
  Effect.gen(function* () {
    const file = new File(['{'], 'broken.trace');
    Object.defineProperty(file, 'text', { value: () => Promise.resolve('{') });

    const error = yield* Effect.flip(loadTraceCapture(file));

    assert.strictEqual(error._tag, 'InvalidTraceError');
  }),
);

it.effect('preserves the no-screenshot distinction at the loading boundary', () =>
  Effect.gen(function* () {
    const source = JSON.stringify({ traceEvents: [] });
    const file = new File([source], 'empty.trace');
    Object.defineProperty(file, 'text', { value: () => Promise.resolve(source) });

    const error = yield* Effect.flip(loadTraceCapture(file));

    assert.strictEqual(error._tag, 'NoScreenshotFramesError');
  }),
);
