import type { TraceEvent } from 'lighthouse';

export interface SoftNavigationRecord {
  navigationId?: string;
  interactionId?: number;
  url?: string;
  startTs: number;
  endTs?: number;
  paintEvents: TraceEvent[];
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function getContext(event: TraceEvent): Record<string, unknown> | undefined {
  return getRecord(getRecord(event.args)?.['context']);
}

function getData(event: TraceEvent): Record<string, unknown> | undefined {
  return getRecord(getRecord(event.args)?.['data']);
}

function asPositiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && value > 0 ? value : undefined;
}

export function extractSoftNavigations(traceEvents: TraceEvent[]): SoftNavigationRecord[] {
  const startEvents = traceEvents
    .filter((event) => event.name === 'SoftNavigationStart')
    .sort((a, b) => a.ts - b.ts);

  const records = startEvents.map((event, index): SoftNavigationRecord => {
    const context = getContext(event);
    const navigationId = asPositiveNumber(context?.['performanceTimelineNavigationId']);
    const interactionId = asPositiveNumber(context?.['interactionId']);
    const contextUrl = context?.['URL'];
    const url = typeof contextUrl === 'string' && contextUrl ? contextUrl : undefined;
    const startTs = asPositiveNumber(context?.['timeOrigin']) ?? event.ts;
    const nextStartEvent = startEvents[index + 1];
    const endTs = nextStartEvent
      ? (asPositiveNumber(getContext(nextStartEvent)?.['timeOrigin']) ?? nextStartEvent.ts)
      : undefined;

    return {
      ...(navigationId === undefined ? {} : { navigationId: String(navigationId) }),
      ...(interactionId === undefined ? {} : { interactionId }),
      ...(url === undefined ? {} : { url }),
      startTs,
      ...(endTs === undefined ? {} : { endTs }),
      paintEvents: [],
    };
  });

  const recordsByNavigationId = new Map(
    records
      .filter((record): record is SoftNavigationRecord & { navigationId: string } => record.navigationId !== undefined)
      .map((record) => [record.navigationId, record]),
  );

  for (const event of traceEvents) {
    if (event.name !== 'largestContentfulPaint::CandidateForSoftNavigation') continue;
    const navigationId = asPositiveNumber(getData(event)?.['performanceTimelineNavigationId']);
    if (navigationId !== undefined) recordsByNavigationId.get(String(navigationId))?.paintEvents.push(event);
  }

  return records;
}

export function computeMetricTimings(traceEvents: TraceEvent[]): { lcpTiming?: number; fcpTiming?: number } {
  const records = extractSoftNavigations(traceEvents);
  if (records.length !== 1) return {};

  const record = records[0];
  const startEvent = traceEvents.find((event) => {
    if (event.name !== 'SoftNavigationStart') return false;
    return (asPositiveNumber(getContext(event)?.['timeOrigin']) ?? event.ts) === record.startTs;
  });
  const fcpTs = startEvent && asPositiveNumber(getContext(startEvent)?.['firstContentfulPaint']);
  const lcpEvent = record.paintEvents.reduce<TraceEvent | undefined>(
    (latest, event) => (!latest || event.ts > latest.ts ? event : latest),
    undefined,
  );

  return {
    fcpTiming: fcpTs === undefined ? undefined : (fcpTs - record.startTs) / 1000,
    lcpTiming: lcpEvent === undefined ? undefined : (lcpEvent.ts - record.startTs) / 1000,
  };
}
