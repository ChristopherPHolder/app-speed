import { Effect, Schema } from 'effect';
import {
  calculateFilmstripExportLayout,
  FilmstripExportTooLargeError,
  type FilmstripExportLayout,
  type FilmstripImageDimensions,
  type TraceFilmstripSettings,
} from './trace-filmstrip';

export const comparisonLabelMaximumLength = 80;
export const filmstripComparisonRowGap = 24;
export const filmstripComparisonDividerHeight = 1;
export const filmstripComparisonLabelHeight = 54;

export interface FilmstripComparisonLabelSettings {
  readonly includeLabel: boolean;
  readonly label: string;
}

export interface FilmstripComparisonLayoutRow {
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly labelHeight: number;
  readonly filmstrip: FilmstripExportLayout;
}

export interface FilmstripComparisonLayout {
  readonly width: number;
  readonly height: number;
  readonly dividerY: number;
  readonly dividerHeight: number;
  readonly rows: readonly [FilmstripComparisonLayoutRow, FilmstripComparisonLayoutRow];
}

export interface FilmstripComparisonLayoutInput {
  readonly dimensions: ReadonlyArray<FilmstripImageDimensions>;
  readonly settings: TraceFilmstripSettings;
  readonly label: FilmstripComparisonLabelSettings;
}

export class InvalidFilmstripComparisonLabelError extends Schema.TaggedErrorClass<InvalidFilmstripComparisonLabelError>()(
  'InvalidFilmstripComparisonLabelError',
  { message: Schema.String },
) {}

export const defaultFilmstripComparisonLabel = (label: string): FilmstripComparisonLabelSettings => ({
  includeLabel: true,
  label,
});

export const filmstripComparisonLabelError = (settings: FilmstripComparisonLabelSettings): string | undefined => {
  if (!settings.includeLabel) return undefined;
  const label = settings.label.trim();
  if (label.length === 0) return 'Enter a comparison label or hide the label.';
  if (label.length > comparisonLabelMaximumLength) {
    return `Comparison labels can contain at most ${comparisonLabelMaximumLength} characters.`;
  }
  return undefined;
};

export const truncateFilmstripComparisonText = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length <= comparisonLabelMaximumLength) return trimmed;
  return `${trimmed.slice(0, comparisonLabelMaximumLength - 1)}…`;
};

export const normalizedFilmstripComparisonLabel = Effect.fn('normalizedFilmstripComparisonLabel')(function* (
  settings: FilmstripComparisonLabelSettings,
) {
  const error = filmstripComparisonLabelError(settings);
  if (error) return yield* new InvalidFilmstripComparisonLabelError({ message: error });
  return settings.label.trim();
});

export const calculateFilmstripComparisonLayout = Effect.fn('calculateFilmstripComparisonLayout')(function* (
  inputs: readonly [FilmstripComparisonLayoutInput, FilmstripComparisonLayoutInput],
  limits: { readonly maxDimension: number; readonly maxArea: number } = { maxDimension: 32_767, maxArea: 268_435_456 },
) {
  const [firstInput, secondInput] = inputs;
  yield* normalizedFilmstripComparisonLabel(firstInput.label);
  yield* normalizedFilmstripComparisonLabel(secondInput.label);

  const firstFilmstrip = yield* calculateFilmstripExportLayout(firstInput.dimensions, firstInput.settings, limits);
  const secondFilmstrip = yield* calculateFilmstripExportLayout(secondInput.dimensions, secondInput.settings, limits);
  const firstLabelHeight = firstInput.label.includeLabel ? filmstripComparisonLabelHeight : 0;
  const secondLabelHeight = secondInput.label.includeLabel ? filmstripComparisonLabelHeight : 0;
  const firstHeight = firstLabelHeight + firstFilmstrip.height;
  const secondHeight = secondLabelHeight + secondFilmstrip.height;
  const width = Math.max(firstFilmstrip.width, secondFilmstrip.width);
  const height = firstHeight + filmstripComparisonRowGap + secondHeight;

  if (width > limits.maxDimension || height > limits.maxDimension || width * height > limits.maxArea) {
    return yield* new FilmstripExportTooLargeError({
      message:
        'This comparison is too large to export safely. Narrow a time range, increase an interval, or reduce an output height.',
      width,
      height,
    });
  }

  const secondY = firstHeight + filmstripComparisonRowGap;
  return {
    width,
    height,
    dividerY: firstHeight + Math.floor(filmstripComparisonRowGap / 2),
    dividerHeight: filmstripComparisonDividerHeight,
    rows: [
      {
        y: 0,
        width: firstFilmstrip.width,
        height: firstHeight,
        labelHeight: firstLabelHeight,
        filmstrip: firstFilmstrip,
      },
      {
        y: secondY,
        width: secondFilmstrip.width,
        height: secondHeight,
        labelHeight: secondLabelHeight,
        filmstrip: secondFilmstrip,
      },
    ],
  } satisfies FilmstripComparisonLayout;
});
