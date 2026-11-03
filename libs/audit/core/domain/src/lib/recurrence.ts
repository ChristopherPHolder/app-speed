import { Temporal } from '@js-temporal/polyfill';
import { Schema } from 'effect';

export const RecurrenceSchema = Schema.Union([
  Schema.Struct({ kind: Schema.Literal('interval'), minutes: Schema.Literals([5, 15, 30, 60, 360, 720]) }),
  Schema.Struct({ kind: Schema.Literal('daily'), time: Schema.String, timezone: Schema.String }),
  Schema.Struct({
    kind: Schema.Literal('weekly'),
    time: Schema.String,
    timezone: Schema.String,
    weekday: Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: 7 })),
  }),
]);
export type Recurrence = typeof RecurrenceSchema.Type;

/** Strictly future; intervals use elapsed time, calendar schedules use the first matching wall time. */
export function nextOccurrence(recurrence: Recurrence, after: Date): Date {
  if (recurrence.kind === 'interval') return new Date(after.getTime() + recurrence.minutes * 60_000);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(recurrence.time)) throw new RangeError('Choose a local time as HH:mm.');
  // Validate a named IANA zone (fixed offsets are deliberately excluded).
  if (!Intl.supportedValuesOf('timeZone').includes(recurrence.timezone) && recurrence.timezone !== 'UTC') {
    // Intl canonical aliases, including older deployed browsers, are also valid IANA names.
    if (/^[+-]/.test(recurrence.timezone)) throw new RangeError('Choose an IANA timezone.');
    new Intl.DateTimeFormat('en', { timeZone: recurrence.timezone }).format();
  }
  const instant = Temporal.Instant.fromEpochMilliseconds(after.getTime());
  let date = instant.toZonedDateTimeISO(recurrence.timezone).toPlainDate();
  const time = Temporal.PlainTime.from(recurrence.time);
  for (let day = 0; day < 370; day++, date = date.add({ days: 1 })) {
    if (recurrence.kind === 'weekly' && date.dayOfWeek !== recurrence.weekday) continue;
    const local = date.toPlainDateTime(time);
    const zoned = local.toZonedDateTime(recurrence.timezone, { disambiguation: 'earlier' });
    // "earlier" resolves folds once; round-tripping detects gaps, which are skipped.
    if (!zoned.toPlainDateTime().equals(local)) continue;
    if (zoned.epochMilliseconds > after.getTime()) return new Date(zoned.epochMilliseconds);
  }
  throw new RangeError('No future occurrence found.');
}

/** Constant-space downtime accounting; calendar iteration is bounded by elapsed days, not writes. */
export function advanceOccurrences(recurrence: Recurrence, due: Date, now: Date) {
  if (recurrence.kind === 'interval') {
    const count = Math.floor((now.getTime() - due.getTime()) / (recurrence.minutes * 60_000)) + 1;
    return { count, next: new Date(due.getTime() + count * recurrence.minutes * 60_000) };
  }
  let count = 0;
  let next = due;
  while (next <= now) {
    count++;
    next = nextOccurrence(recurrence, next);
  }
  return { count, next };
}
