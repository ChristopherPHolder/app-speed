import { Schema } from 'effect';
import type { TraceEvent } from 'lighthouse';

const StartContext = Schema.Struct({
  timeOrigin: Schema.Number,
  firstContentfulPaint: Schema.optional(Schema.Number),
  performanceTimelineNavigationId: Schema.Number,
});
const PaintData = Schema.Struct({ performanceTimelineNavigationId: Schema.Number });
const StartArgs = Schema.Struct({ context: StartContext });

export const TIMESPAN_SOFT_NAVIGATION_WARNING =
  'A soft navigation was detected during this timespan. ' +
  'Use a navigation step to capture FCP and LCP alongside INP. Soft navigation measurements are enabled automatically.';
export const MULTIPLE_SOFT_NAVIGATION_WARNING =
  'Multiple soft navigations were detected during the run. Only the first soft navigation is measured for FCP and LCP; INP covers the recorded step.';

export function softNavigationTimings(events: TraceEvent[], frameId: string) {
  const starts = events
    .filter((event) => event.name === 'SoftNavigationStart' && event.args['frame'] === frameId)
    .sort((a, b) => a.ts - b.ts);
  const first = starts[0];
  const args: unknown = first?.args;
  const context = Schema.is(StartArgs)(args) ? args.context : undefined;
  if (!context) return { count: 0 };
  const end = starts[1]?.ts ?? Infinity;
  const paints = events
    .filter((event) => {
      const data: unknown = event.args['data'];
      return (
        event.name === 'largestContentfulPaint::CandidateForSoftNavigation' &&
        (event.args['frame'] === frameId || event.args['data']?.frame === frameId) &&
        Schema.is(PaintData)(data) &&
        data.performanceTimelineNavigationId === context.performanceTimelineNavigationId &&
        event.ts >= context.timeOrigin &&
        event.ts < end
      );
    })
    .sort((a, b) => a.ts - b.ts);
  const lcp = paints.at(-1);
  return {
    count: starts.length,
    fcp:
      context.firstContentfulPaint === undefined
        ? undefined
        : (context.firstContentfulPaint - context.timeOrigin) / 1000,
    lcp: lcp ? (lcp.ts - context.timeOrigin) / 1000 : undefined,
  };
}
