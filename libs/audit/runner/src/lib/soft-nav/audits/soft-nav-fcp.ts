import { Audit, type Artifacts } from 'lighthouse';
import { ProcessedTrace } from 'lighthouse/core/computed/processed-trace.js';
import type AuditType from 'lighthouse/types/audit.js';
import { formatMetricTiming } from '../metrics/metric-display.js';
import { computeMetricTimings } from '../metrics/metric-timings.js';

export default class SoftNavFcp extends Audit {
  static override get meta(): AuditType.Meta {
    return {
      id: 'soft-nav-fcp',
      title: 'Soft Navigation First Contentful Paint',
      description: 'First Contentful Paint of a soft navigation.',
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      supportedModes: ['timespan'],
      requiredArtifacts: ['Trace'],
    };
  }

  static override async audit(artifacts: Artifacts, context: AuditType.Context): Promise<AuditType.Product> {
    const processedTrace = await ProcessedTrace.request(artifacts.Trace, context);
    const { fcpTiming } = computeMetricTimings(processedTrace.mainThreadEvents);
    if (fcpTiming === undefined) return { notApplicable: true, score: 1 };

    return {
      numericValue: fcpTiming,
      numericUnit: 'millisecond',
      displayValue: formatMetricTiming(fcpTiming),
      score: Audit.computeLogNormalScore({ p10: 1800, median: 3000 }, fcpTiming),
    };
  }
}
