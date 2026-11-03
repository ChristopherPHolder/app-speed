import { describe, expect, it } from 'vitest';
import { advanceOccurrences, nextOccurrence } from './recurrence';
const date = (value: string) => new Date(value);
describe('recurrence', () => {
  for (const minutes of [5, 15, 30, 60, 360, 720] as const) {
    it(`anchors ${minutes}-minute intervals to elapsed time`, () => {
      const after = date('2026-03-29T00:58:00Z');
      expect(nextOccurrence({ kind: 'interval', minutes }, after).getTime()).toBe(after.getTime() + minutes * 60_000);
    });
  }
  it('selects the next future weekly weekday', () => {
    const r = { kind: 'weekly', weekday: 1, time: '09:00', timezone: 'Europe/Vienna' } as const;
    expect(nextOccurrence(r, date('2026-11-02T08:00:00Z')).toISOString()).toBe('2026-11-09T08:00:00.000Z');
  });
  it('skips nonexistent local times at the spring DST change', () => {
    expect(
      nextOccurrence(
        { kind: 'daily', time: '02:30', timezone: 'Europe/Vienna' },
        date('2026-03-28T02:00:00Z'),
      ).toISOString(),
    ).toBe('2026-03-30T00:30:00.000Z');
  });
  it('uses the first autumn occurrence and never repeats the ambiguous wall time', () => {
    const r = { kind: 'daily', time: '02:30', timezone: 'Europe/Vienna' } as const;
    expect(nextOccurrence(r, date('2026-10-24T02:00:00Z')).toISOString()).toBe('2026-10-25T00:30:00.000Z');
    expect(nextOccurrence(r, date('2026-10-25T00:30:00Z')).toISOString()).toBe('2026-10-26T01:30:00.000Z');
  });
  it('follows local time across DST while fixed intervals keep elapsed time', () => {
    const r = { kind: 'daily', time: '09:00', timezone: 'Europe/Vienna' } as const;
    expect(nextOccurrence(r, date('2026-03-28T08:00:00Z')).toISOString()).toBe('2026-03-29T07:00:00.000Z');
  });
  it('summarizes long downtime without generating a catch-up queue', () => {
    expect(
      advanceOccurrences({ kind: 'interval', minutes: 5 }, date('2026-11-02T00:00:00Z'), date('2026-11-03T00:00:00Z')),
    ).toEqual({ count: 289, next: date('2026-11-03T00:05:00Z') });
  });
  it.each(['25:00', '2:30', '09:60'])('rejects invalid time %s', (time) => {
    expect(() => nextOccurrence({ kind: 'daily', time, timezone: 'Europe/Vienna' }, new Date())).toThrow();
  });
  it('rejects invalid zones', () => {
    expect(() => nextOccurrence({ kind: 'daily', time: '09:00', timezone: 'wrong/zone' }, new Date())).toThrow();
  });
});
