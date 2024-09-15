import { Result as AuditResult } from 'lighthouse/types/lhr/audit-result';
import { STATUS, StatusOptions } from '@portal/ui/status-badge';
import { FlowResult, Result } from 'lighthouse';
import { MetricSummary } from './viewer-step-metric-summary.component';

type Audits = FlowResult.Step['lhr']['audits'];

const metricStatus = (
  score: AuditResult['score'],
  numericValue?: AuditResult['numericValue'],
  scoringOptions?: AuditResult['scoringOptions'],
): StatusOptions => {
  if (score !== null) {
    return score > 0.89 ? STATUS.PASS : score > 0.49 ? STATUS.WARN : STATUS.ALERT;
  }

  if (scoringOptions === undefined || numericValue === undefined) {
    return STATUS.INFO;
  }

  if (numericValue <= scoringOptions.p10) {
    return STATUS.PASS;
  }
  if (numericValue <= scoringOptions.median) {
    return STATUS.WARN;
  }

  return STATUS.ALERT;
};

export const metricAudits = (auditRefs: Result.Category['auditRefs']): string[] => {
  return auditRefs.filter((ref) => ref?.group === 'metrics').map((ref) => ref.id);
};

export const metricResults = (ids: string[], audits: Audits): MetricSummary[] =>
  ids.map((id: string) => {
    const { title, displayValue, description, score, numericValue, scoringOptions } = audits[id];
    return { name: title, value: displayValue, description, status: metricStatus(score, numericValue, scoringOptions) };
  });
