import * as i18n from 'lighthouse/core/lib/i18n/i18n.js';

const str_ = i18n.createIcuMessageFn(import.meta.url, {});

export function formatMetricTiming(timeInMs: number) {
  return str_(i18n.UIStrings.seconds, { timeInMs });
}
