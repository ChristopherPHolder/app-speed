import { Audit, type Artifacts } from 'lighthouse';
import { ProcessedTrace } from 'lighthouse/core/computed/processed-trace.js';
import type AuditType from 'lighthouse/types/audit.js';
import { computeMetricTimings } from '../lib/metric-timings.js';

export default class SoftNavLcp extends Audit {
  static override get meta(): AuditType.Meta {
    return {
      id: 'soft-nav-lcp',
      title: 'Soft Navigation Largest Contentful Paint',
      description: 'Largest Contentful Paint of a soft navigation.',
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      supportedModes: ['timespan'],
      requiredArtifacts: ['Trace'],
    };
  }

  static override async audit(artifacts: Artifacts, context: AuditType.Context): Promise<AuditType.Product> {
    const processedTrace = await ProcessedTrace.request(artifacts.Trace, context);
    const { lcpTiming } = computeMetricTimings(processedTrace.mainThreadEvents);
    if (lcpTiming === undefined) return { notApplicable: true, score: 1 };

    return {
      numericValue: lcpTiming,
      numericUnit: 'millisecond',
      displayValue: `${lcpTiming} ms`,
      score: Audit.computeLogNormalScore({ p10: 2500, median: 4000 }, lcpTiming),
    };
  }
}
