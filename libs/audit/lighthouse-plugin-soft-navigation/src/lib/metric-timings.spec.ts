import type { TraceEvent } from 'lighthouse';
import { computeMetricTimings, extractSoftNavigations } from './metric-timings.js';

function traceEvent(event: Partial<TraceEvent> & Pick<TraceEvent, 'name' | 'ts'>): TraceEvent {
  return {
    args: {},
    cat: 'loading',
    pid: 111,
    tid: 2222,
    ph: 'n',
    ...event,
  } as TraceEvent;
}

function softNavigationStart(options: {
  navigationId: number;
  startTs: number;
  fcpTs?: number;
  url?: string;
  interactionId?: number;
}): TraceEvent {
  return traceEvent({
    name: 'SoftNavigationStart',
    ts: options.startTs,
    args: {
      context: {
        URL: options.url ?? '',
        firstContentfulPaint: options.fcpTs ?? 0,
        performanceTimelineNavigationId: options.navigationId,
        interactionId: options.interactionId ?? 0,
        timeOrigin: options.startTs,
      },
    } as TraceEvent['args'],
  });
}

function softNavigationLcp(navigationId: number, ts: number): TraceEvent {
  return traceEvent({
    name: 'largestContentfulPaint::CandidateForSoftNavigation',
    ts,
    args: {
      data: { performanceTimelineNavigationId: navigationId },
    } as TraceEvent['args'],
  });
}

describe('extractSoftNavigations', () => {
  it('normalizes identity, URL, timing, interaction, and paint data', () => {
    const start = softNavigationStart({
      navigationId: 6382,
      startTs: 1_000_000,
      fcpTs: 1_080_000,
      url: 'https://example.com/cart',
      interactionId: 42,
    });
    const lcp = softNavigationLcp(6382, 1_090_000);

    expect(extractSoftNavigations([start, lcp])).toEqual([
      {
        navigationId: '6382',
        interactionId: 42,
        url: 'https://example.com/cart',
        startTs: 1_000_000,
        paintEvents: [lcp],
      },
    ]);
  });

  it('correlates LCP candidates by navigation ID', () => {
    const firstLcp = softNavigationLcp(1, 1_090_000);
    const secondLcp = softNavigationLcp(2, 2_090_000);
    const records = extractSoftNavigations([
      softNavigationStart({ navigationId: 1, startTs: 1_000_000 }),
      softNavigationStart({ navigationId: 2, startTs: 2_000_000 }),
      secondLcp,
      firstLcp,
    ]);

    expect(records[0].paintEvents).toEqual([firstLcp]);
    expect(records[1].paintEvents).toEqual([secondLcp]);
  });

  it('uses the next soft-navigation start as the prior navigation end', () => {
    const records = extractSoftNavigations([
      softNavigationStart({ navigationId: 1, startTs: 1_000_000 }),
      softNavigationStart({ navigationId: 2, startTs: 2_000_000 }),
    ]);

    expect(records[0].endTs).toBe(2_000_000);
    expect(records[1].endTs).toBeUndefined();
  });
});

describe('computeMetricTimings', () => {
  it('computes modern soft-navigation FCP and latest LCP timings', () => {
    expect(
      computeMetricTimings([
        softNavigationStart({ navigationId: 6382, startTs: 1_000_000, fcpTs: 1_080_000 }),
        softNavigationLcp(6382, 1_090_000),
        softNavigationLcp(6382, 1_100_000),
      ]),
    ).toEqual({ fcpTiming: 80, lcpTiming: 100 });
  });

  it('returns undefined timings when paint data is missing', () => {
    expect(computeMetricTimings([softNavigationStart({ navigationId: 6382, startTs: 1_000_000 })])).toEqual({
      fcpTiming: undefined,
      lcpTiming: undefined,
    });
  });

  it('does not choose arbitrarily between multiple soft navigations', () => {
    expect(
      computeMetricTimings([
        softNavigationStart({ navigationId: 1, startTs: 1_000_000 }),
        softNavigationStart({ navigationId: 2, startTs: 2_000_000 }),
      ]),
    ).toEqual({});
  });
});
