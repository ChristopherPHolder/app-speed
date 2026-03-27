import { Result } from 'lighthouse';
import { Result as AuditResult } from 'lighthouse/types/lhr/audit-result';
import { STATUS, StatusOptions } from '@app-speed/ui/status-badge';

const LIGHTHOUSE_PASS_THRESHOLD = 0.9;
const LIGHTHOUSE_AVERAGE_THRESHOLD = 0.5;
const WARNING_AUDITS_GROUP_TITLE = 'Passed audits but with warnings';
const PASSED_AUDITS_GROUP_TITLE = 'Passed audits';
const NOT_APPLICABLE_AUDITS_GROUP_TITLE = 'Not applicable';
const MANUAL_AUDITS_GROUP_TITLE = 'Additional items to manually check';

type LighthouseRating = 'pass' | 'average' | 'fail' | 'error';
export type AuditClumpId = 'failed' | 'warning' | 'manual' | 'passed' | 'notApplicable';

type CategoryAuditRefWithResult = Result.Category['auditRefs'][number] & {
  result: AuditResult;
};

type CategoryWithAuditResults = Omit<Result.Category, 'auditRefs'> & {
  auditRefs: CategoryAuditRefWithResult[];
};

export type CategoryFraction = {
  numPassed: number;
  numPassableAudits: number;
  numInformative: number;
  totalWeight: number;
};

type ScoringOptions = NonNullable<AuditResult['scoringOptions']>;

export type PerformanceMetricAudit = Pick<Result.Category['auditRefs'][number], 'acronym' | 'weight'> & {
  result: Pick<AuditResult, 'score' | 'numericValue' | 'scoringOptions'>;
};

export type SortablePerformanceAudit = {
  result: Pick<AuditResult, 'guidanceLevel' | 'metricSavings' | 'score'>;
};

type AuditBadgeInput = Pick<AuditResult, 'score' | 'scoreDisplayMode'>;

// Mirrors Lighthouse report-utils showAsPassed logic without depending on renderer internals.
export const showAsPassed = (audit: Pick<AuditResult, 'score' | 'scoreDisplayMode'>): boolean => {
  switch (audit.scoreDisplayMode) {
    case 'manual':
    case 'notApplicable':
      return true;
    case 'error':
    case 'informative':
      return false;
    case 'numeric':
    case 'binary':
    default:
      return Number(audit.score) >= LIGHTHOUSE_PASS_THRESHOLD;
  }
};

export const calculateCategoryFraction = (category: CategoryWithAuditResults): CategoryFraction => {
  let numPassableAudits = 0;
  let numPassed = 0;
  let numInformative = 0;
  let totalWeight = 0;

  for (const auditRef of category.auditRefs) {
    const auditPassed = showAsPassed(auditRef.result);

    if (
      auditRef.group === 'hidden' ||
      auditRef.result.scoreDisplayMode === 'manual' ||
      auditRef.result.scoreDisplayMode === 'notApplicable'
    ) {
      continue;
    }

    if (auditRef.result.scoreDisplayMode === 'informative') {
      if (!auditPassed) {
        numInformative += 1;
      }
      continue;
    }

    numPassableAudits += 1;
    totalWeight += auditRef.weight;
    if (auditPassed) {
      numPassed += 1;
    }
  }

  return { numPassed, numPassableAudits, numInformative, totalWeight };
};

export const shouldDisplayAsFraction = (gatherMode: Result.GatherMode): boolean => {
  return gatherMode === 'timespan' || gatherMode === 'snapshot';
};

export const passedAuditsGroupTitle = (lhr: Pick<Result, 'i18n'>): string => {
  return lhr.i18n.rendererFormattedStrings['passedAuditsGroupTitle'] || PASSED_AUDITS_GROUP_TITLE;
};

export const warningAuditsGroupTitle = (lhr: Pick<Result, 'i18n'>): string => {
  return lhr.i18n.rendererFormattedStrings['warningAuditsGroupTitle'] || WARNING_AUDITS_GROUP_TITLE;
};

export const notApplicableAuditsGroupTitle = (lhr: Pick<Result, 'i18n'>): string => {
  return lhr.i18n.rendererFormattedStrings['notApplicableAuditsGroupTitle'] || NOT_APPLICABLE_AUDITS_GROUP_TITLE;
};

export const manualAuditsGroupTitle = (lhr: Pick<Result, 'i18n'>): string => {
  return lhr.i18n.rendererFormattedStrings['manualAuditsGroupTitle'] || MANUAL_AUDITS_GROUP_TITLE;
};

export const auditClumpId = (
  audit: Pick<AuditResult, 'score' | 'scoreDisplayMode' | 'warnings'>,
): AuditClumpId => {
  if (audit.scoreDisplayMode === 'manual' || audit.scoreDisplayMode === 'notApplicable') {
    return audit.scoreDisplayMode;
  }

  if (showAsPassed(audit)) {
    return audit.warnings?.length ? 'warning' : 'passed';
  }

  return 'failed';
};

// Mirrors Lighthouse report-utils calculateRating logic without depending on renderer internals.
export const calculateRating = (
  score: AuditResult['score'],
  scoreDisplayMode?: AuditResult['scoreDisplayMode'],
): LighthouseRating => {
  if (scoreDisplayMode === 'manual' || scoreDisplayMode === 'notApplicable') {
    return 'pass';
  }

  if (scoreDisplayMode === 'error') {
    return 'error';
  }

  if (score === null) {
    return 'fail';
  }

  if (score >= LIGHTHOUSE_PASS_THRESHOLD) {
    return 'pass';
  }

  if (score >= LIGHTHOUSE_AVERAGE_THRESHOLD) {
    return 'average';
  }

  return 'fail';
};

// Mirrors Lighthouse audit icon treatment. Informative/manual/N/A stay neutral even when score is 1.
export const auditBadgeStatus = (audit: AuditBadgeInput): StatusOptions => {
  switch (audit.scoreDisplayMode) {
    case 'informative':
    case 'manual':
    case 'notApplicable':
      return STATUS.INFO;
    case 'error':
      return STATUS.ALERT;
    default:
      switch (calculateRating(audit.score, audit.scoreDisplayMode)) {
        case 'pass':
          return STATUS.PASS;
        case 'average':
          return STATUS.WARN;
        case 'error':
        case 'fail':
        default:
          return STATUS.ALERT;
      }
  }
};

const erf = (x: number): number => {
  const sign = Math.sign(x);
  x = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  return sign * (1 - y * Math.exp(-x * x));
};

const computeLogNormalScore = ({ median, p10 }: ScoringOptions, value: number): number => {
  if (value <= 0) {
    return 1;
  }

  const inverseErfcOneFifth = 0.9061938024368232;
  const xRatio = Math.max(Number.MIN_VALUE, value / median);
  const xLogRatio = Math.log(xRatio);
  const p10Ratio = Math.max(Number.MIN_VALUE, p10 / median);
  const p10LogRatio = -Math.log(p10Ratio);
  const standardizedX = xLogRatio * inverseErfcOneFifth / p10LogRatio;
  const complementaryPercentile = (1 - erf(standardizedX)) / 2;

  if (value <= p10) {
    return Math.max(0.9, Math.min(1, complementaryPercentile));
  }
  if (value <= median) {
    return Math.max(0.5, Math.min(0.8999999999999999, complementaryPercentile));
  }
  return Math.max(0, Math.min(0.49999999999999994, complementaryPercentile));
};

const overallImpact = (
  audit: SortablePerformanceAudit,
  metricAudits: PerformanceMetricAudit[],
): { overallImpact: number; overallLinearImpact: number } => {
  if (!audit.result.metricSavings) {
    return { overallImpact: 0, overallLinearImpact: 0 };
  }

  let aggregatedImpact = 0;
  let aggregatedLinearImpact = 0;

  for (const [acronym, savings] of Object.entries(audit.result.metricSavings)) {
    if (savings === undefined) {
      continue;
    }

    const metricAudit = metricAudits.find((candidate) => candidate.acronym === acronym);
    if (!metricAudit) {
      continue;
    }

    if (metricAudit.result.score === null) {
      continue;
    }

    const metricValue = metricAudit.result.numericValue;
    if (!metricValue) {
      continue;
    }

    aggregatedLinearImpact += (savings / metricValue) * metricAudit.weight;

    const scoringOptions = metricAudit.result.scoringOptions;
    if (!scoringOptions) {
      continue;
    }

    const newMetricScore = computeLogNormalScore(scoringOptions, metricValue - savings);
    aggregatedImpact += (newMetricScore - metricAudit.result.score) * metricAudit.weight;
  }

  return { overallImpact: aggregatedImpact, overallLinearImpact: aggregatedLinearImpact };
};

export const sortFailedPerformanceAudits = <T extends SortablePerformanceAudit>(
  audits: T[],
  metricAudits: PerformanceMetricAudit[],
  metricAcronym = 'All',
): T[] => {
  const impacts = new Map(
    audits.map((audit) => {
      return [audit, overallImpact(audit, metricAudits)] as const;
    }),
  );

  return [...audits].sort((a, b) => {
    const scoreA = a.result.score || 0;
    const scoreB = b.result.score || 0;
    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }

    if (metricAcronym !== 'All') {
      const aSavings = a.result.metricSavings?.[metricAcronym] ?? -1;
      const bSavings = b.result.metricSavings?.[metricAcronym] ?? -1;
      if (aSavings !== bSavings) {
        return bSavings - aSavings;
      }
    }

    const aImpact = impacts.get(a) || { overallImpact: 0, overallLinearImpact: 0 };
    const bImpact = impacts.get(b) || { overallImpact: 0, overallLinearImpact: 0 };
    const guidanceA = a.result.guidanceLevel || 1;
    const guidanceB = b.result.guidanceLevel || 1;

    if (aImpact.overallImpact !== bImpact.overallImpact) {
      return bImpact.overallImpact * guidanceB - aImpact.overallImpact * guidanceA;
    }

    if (
      aImpact.overallImpact === 0 &&
      bImpact.overallImpact === 0 &&
      aImpact.overallLinearImpact !== bImpact.overallLinearImpact
    ) {
      return bImpact.overallLinearImpact * guidanceB - aImpact.overallLinearImpact * guidanceA;
    }

    return guidanceB - guidanceA;
  });
};

export const sortAuditRefsByWeight = <T extends Pick<Result.Category['auditRefs'][number], 'weight'>>(audits: T[]): T[] => {
  return [...audits].sort((a, b) => b.weight - a.weight);
};
