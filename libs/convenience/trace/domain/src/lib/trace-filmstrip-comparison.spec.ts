import { assert, it } from '@effect/vitest';
import { Effect } from 'effect';
import { defaultTraceFilmstripSettings } from './trace-filmstrip';
import {
  calculateFilmstripComparisonLayout,
  defaultFilmstripComparisonLabel,
  filmstripComparisonLabelError,
  normalizedFilmstripComparisonLabel,
  truncateFilmstripComparisonText,
} from './trace-filmstrip-comparison';

describe('trace filmstrip comparison', () => {
  it.effect('keeps rows at their natural widths and separates them by 24 pixels', () =>
    Effect.gen(function* () {
      const layout = yield* calculateFilmstripComparisonLayout([
        {
          dimensions: [
            { width: 200, height: 100 },
            { width: 100, height: 100 },
          ],
          settings: defaultTraceFilmstripSettings,
          label: defaultFilmstripComparisonLabel('Trace A'),
        },
        {
          dimensions: [{ width: 100, height: 100 }],
          settings: { ...defaultTraceFilmstripSettings, imageHeight: 100, showTimestamps: false },
          label: { includeLabel: false, label: 'Trace B' },
        },
      ]);

      assert.strictEqual(layout.width, 630);
      assert.strictEqual(layout.rows[0].width, 630);
      assert.strictEqual(layout.rows[1].width, 120);
      assert.strictEqual(layout.rows[0].labelHeight, 54);
      assert.strictEqual(layout.rows[1].labelHeight, 0);
      assert.strictEqual(layout.rows[1].y - layout.rows[0].height, 24);
      assert.strictEqual(layout.dividerY, layout.rows[0].height + 12);
    }),
  );

  it.effect('trims valid labels and rejects blank or overlong visible labels', () =>
    Effect.gen(function* () {
      assert.strictEqual(
        yield* normalizedFilmstripComparisonLabel({ includeLabel: true, label: '  Baseline  ' }),
        'Baseline',
      );
      assert.isUndefined(filmstripComparisonLabelError({ includeLabel: false, label: '' }));
      assert.isDefined(filmstripComparisonLabelError({ includeLabel: true, label: '   ' }));
      const error = yield* Effect.flip(
        normalizedFilmstripComparisonLabel({ includeLabel: true, label: 'x'.repeat(81) }),
      );
      assert.strictEqual(error._tag, 'InvalidFilmstripComparisonLabelError');
    }),
  );

  it('truncates PNG secondary text to at most 80 characters', () => {
    expect(truncateFilmstripComparisonText(` ${'a'.repeat(90)} `)).toHaveLength(80);
    expect(truncateFilmstripComparisonText(' trace.json ')).toBe('trace.json');
  });

  it.effect('validates the final combined canvas dimensions', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(
        calculateFilmstripComparisonLayout(
          [
            {
              dimensions: [{ width: 1, height: 1 }],
              settings: defaultTraceFilmstripSettings,
              label: defaultFilmstripComparisonLabel('Trace A'),
            },
            {
              dimensions: [{ width: 1, height: 1 }],
              settings: defaultTraceFilmstripSettings,
              label: defaultFilmstripComparisonLabel('Trace B'),
            },
          ],
          { maxDimension: 1_000, maxArea: 100_000 },
        ),
      );
      assert.strictEqual(error._tag, 'FilmstripExportTooLargeError');
    }),
  );
});
