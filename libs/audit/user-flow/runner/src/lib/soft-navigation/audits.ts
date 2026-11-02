import { Audit, defaultConfig, type Artifacts } from 'lighthouse';
import type AuditType from 'lighthouse/types/audit.js';
import type Config from 'lighthouse/types/config.js';
import Fcp from 'lighthouse/core/audits/metrics/first-contentful-paint.js';
import Lcp from 'lighthouse/core/audits/metrics/largest-contentful-paint.js';
import { ProcessedTrace } from 'lighthouse/core/computed/processed-trace.js';
import { softNavigationTimings } from './metrics';

async function observedPaint(
  artifacts: Artifacts,
  context: AuditType.Context,
  metric: 'fcp' | 'lcp',
): Promise<AuditType.Product> {
  const processed = await ProcessedTrace.request(artifacts.Trace, context);
  const timings = softNavigationTimings(artifacts.Trace.traceEvents, processed.mainFrameInfo.frameId);
  const timing = timings[metric];
  if (timing === undefined || timing < 0)
    return {
      score: null,
      scoreDisplayMode: 'error',
      errorMessage:
        timings.count === 0
          ? 'No soft navigation detected. The interaction must update the URL and render new content in the same document. A full page load is not a soft navigation.'
          : `No ${metric.toUpperCase()} was detected for the soft navigation.`,
    };
  const scoring = metric === 'fcp' ? { p10: 1800, median: 3000 } : { p10: 2500, median: 4000 };
  return {
    score: Audit.computeLogNormalScore(scoring, timing),
    scoringOptions: scoring,
    numericValue: timing,
    numericUnit: 'millisecond',
    displayValue: `${(timing / 1000).toFixed(1)} s`,
  };
}

class ExperimentalFcp extends Fcp {
  static override get meta(): AuditType.Meta {
    return { ...Fcp.meta, supportedModes: ['navigation', 'timespan'] };
  }
  static override audit(artifacts: Artifacts, context: AuditType.Context): Promise<AuditType.Product> {
    return artifacts.GatherContext.gatherMode === 'navigation'
      ? Fcp.audit(artifacts, context)
      : observedPaint(artifacts, context, 'fcp');
  }
}
class ExperimentalLcp extends Lcp {
  static override get meta(): AuditType.Meta {
    return { ...Lcp.meta, supportedModes: ['navigation', 'timespan'] };
  }
  static override audit(artifacts: Artifacts, context: AuditType.Context): Promise<AuditType.Product> {
    return artifacts.GatherContext.gatherMode === 'navigation'
      ? Lcp.audit(artifacts, context)
      : observedPaint(artifacts, context, 'lcp');
  }
}

export function experimentalNavigationConfig(preset: Config): Config {
  return {
    ...defaultConfig,
    ...preset,
    extends: undefined,
    settings: { ...defaultConfig.settings, ...preset.settings },
    audits: defaultConfig.audits?.map((audit) => {
      if (audit === 'metrics/first-contentful-paint') return { implementation: ExperimentalFcp };
      if (audit === 'metrics/largest-contentful-paint') return { implementation: ExperimentalLcp };
      return audit;
    }),
  };
}
