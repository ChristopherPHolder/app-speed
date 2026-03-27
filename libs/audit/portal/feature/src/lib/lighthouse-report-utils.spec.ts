import { describe, expect, it } from 'vitest';

import { STATUS } from '@app-speed/portal-ui/status-badge';
import { auditBadgeStatus, calculateRating } from './lighthouse-report-utils';

describe('calculateRating', () => {
  it('matches lighthouse thresholds for scored audits', () => {
    expect(calculateRating(1, 'binary')).toBe('pass');
    expect(calculateRating(0.9, 'binary')).toBe('pass');
    expect(calculateRating(0.89, 'binary')).toBe('average');
    expect(calculateRating(0.5, 'binary')).toBe('average');
    expect(calculateRating(0.49, 'binary')).toBe('fail');
  });

  it('handles lighthouse special score display modes', () => {
    expect(calculateRating(1, 'manual')).toBe('pass');
    expect(calculateRating(1, 'notApplicable')).toBe('pass');
    expect(calculateRating(null, 'error')).toBe('error');
    expect(calculateRating(null, 'informative')).toBe('fail');
  });
});

describe('auditBadgeStatus', () => {
  it('keeps informative and neutral audit types gray', () => {
    expect(auditBadgeStatus({ score: 1, scoreDisplayMode: 'informative' })).toBe(STATUS.INFO);
    expect(auditBadgeStatus({ score: 1, scoreDisplayMode: 'manual' })).toBe(STATUS.INFO);
    expect(auditBadgeStatus({ score: 1, scoreDisplayMode: 'notApplicable' })).toBe(STATUS.INFO);
  });

  it('maps lighthouse ratings to the shared status badge', () => {
    expect(auditBadgeStatus({ score: 1, scoreDisplayMode: 'binary' })).toBe(STATUS.PASS);
    expect(auditBadgeStatus({ score: 0.75, scoreDisplayMode: 'binary' })).toBe(STATUS.WARN);
    expect(auditBadgeStatus({ score: 0.1, scoreDisplayMode: 'binary' })).toBe(STATUS.ALERT);
    expect(auditBadgeStatus({ score: null, scoreDisplayMode: 'error' })).toBe(STATUS.ALERT);
  });
});
