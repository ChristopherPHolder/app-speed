import { assert, it } from '@effect/vitest';
import { Effect } from 'effect';
import { calculateFilmstripExportLayout, createTraceFilmstrip, defaultTraceFilmstripSettings } from './trace-filmstrip';
import type { TraceScreenshotFrame } from './trace-screenshots';

const frames = (...milliseconds: ReadonlyArray<number>): ReadonlyArray<TraceScreenshotFrame> =>
  milliseconds.map((value) => ({ timestampMicroseconds: value * 1_000, format: 'png', base64Data: `iVBOR${value}` }));

describe('trace filmstrip', () => {
  it('samples the most recent frame and includes the final state at a closing interval', () => {
    const result = createTraceFilmstrip(frames(0, 40, 180, 250), defaultTraceFilmstripSettings);
    expect(result.map(({ sourceIndex, offsetMilliseconds }) => [sourceIndex, offsetMilliseconds])).toEqual([
      [0, 0],
      [1, 100],
      [2, 200],
      [3, 300],
    ]);
  });

  it('is deterministic at exact and between-frame range boundaries', () => {
    const result = createTraceFilmstrip(frames(0, 100, 220, 400), {
      ...defaultTraceFilmstripSettings,
      useFixedInterval: false,
      useTimeRange: true,
      startMilliseconds: 150,
      endMilliseconds: 220,
    });
    expect(result.map(({ sourceIndex }) => sourceIndex)).toEqual([1, 2]);
  });

  it('bounds fixed sampling to an explicit range while retaining opening context', () => {
    const result = createTraceFilmstrip(frames(0, 100, 220, 400), {
      ...defaultTraceFilmstripSettings,
      useTimeRange: true,
      startMilliseconds: 150,
      endMilliseconds: 350,
    });
    expect(result.map(({ sourceIndex, offsetMilliseconds }) => [sourceIndex, offsetMilliseconds])).toEqual([
      [1, 150],
      [2, 250],
      [2, 350],
    ]);
  });

  it('keeps a single frame', () => {
    expect(createTraceFilmstrip(frames(5), defaultTraceFilmstripSettings)).toHaveLength(1);
  });

  it.effect('calculates a padded aspect-ratio preserving export layout and rejects unsafe dimensions', () =>
    Effect.gen(function* () {
      const layout = yield* calculateFilmstripExportLayout(
        [
          { width: 200, height: 100 },
          { width: 100, height: 100 },
        ],
        defaultTraceFilmstripSettings,
      );
      assert.strictEqual(layout.width, 630);
      assert.strictEqual(layout.height, 250);
      assert.deepStrictEqual(layout.frames, [
        { x: 10, width: 400 },
        { x: 420, width: 200 },
      ]);

      const error = yield* Effect.flip(
        calculateFilmstripExportLayout([{ width: 100_000, height: 1 }], defaultTraceFilmstripSettings),
      );
      assert.strictEqual(error._tag, 'FilmstripExportTooLargeError');
    }),
  );
});
