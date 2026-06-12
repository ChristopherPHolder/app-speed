import type { Artifacts, TraceEvent } from 'lighthouse';
import type AuditType from 'lighthouse/types/audit.js';
import { beforeEach, vi } from 'vitest';

const request = vi.fn();

vi.mock('lighthouse/core/computed/processed-trace.js', () => ({
  ProcessedTrace: { request },
}));

const { default: SoftNavFcp } = await import('./soft-nav-fcp.js');
const { default: SoftNavLcp } = await import('./soft-nav-lcp.js');

function event(name: string, ts: number, args: Record<string, unknown>): TraceEvent {
  return { name, ts, args, cat: 'loading', pid: 1, tid: 1, ph: 'n' } as TraceEvent;
}

const artifacts = { Trace: { traceEvents: [] } } as unknown as Artifacts;
const context = {} as AuditType.Context;

beforeEach(() => request.mockReset());

describe.each([
  {
    AuditClass: SoftNavFcp,
    id: 'soft-nav-fcp',
    title: 'Soft Navigation First Contentful Paint',
    description: 'First Contentful Paint of a soft navigation.',
    paintEvent: undefined,
    expectedValue: 80,
  },
  {
    AuditClass: SoftNavLcp,
    id: 'soft-nav-lcp',
    title: 'Soft Navigation Largest Contentful Paint',
    description: 'Largest Contentful Paint of a soft navigation.',
    paintEvent: event('largestContentfulPaint::CandidateForSoftNavigation', 1_100_000, {
      data: { performanceTimelineNavigationId: 1 },
    }),
    expectedValue: 100,
  },
])('$id audit', ({ AuditClass, id, title, description, paintEvent, expectedValue }) => {
  it('exposes the preserved audit metadata', () => {
    expect(AuditClass.meta).toMatchObject({
      id,
      title,
      description,
      scoreDisplayMode: 'numeric',
      supportedModes: ['timespan'],
      requiredArtifacts: ['Trace'],
    });
  });

  it('returns a scored numeric result', async () => {
    request.mockResolvedValue({
      mainThreadEvents: [
        event('SoftNavigationStart', 1_000_000, {
          context: {
            timeOrigin: 1_000_000,
            firstContentfulPaint: 1_080_000,
            performanceTimelineNavigationId: 1,
          },
        }),
        ...(paintEvent ? [paintEvent] : []),
      ],
    });

    await expect(AuditClass.audit(artifacts, context)).resolves.toMatchObject({
      numericValue: expectedValue,
      numericUnit: 'millisecond',
      displayValue: `${expectedValue} ms`,
      score: expect.any(Number),
    });
  });

  it('returns notApplicable when its metric is unavailable', async () => {
    request.mockResolvedValue({ mainThreadEvents: [] });

    await expect(AuditClass.audit(artifacts, context)).resolves.toEqual({
      notApplicable: true,
      score: 1,
    });
  });
});
