import { describe, expect } from 'vitest';
import { AuditStepsSchema, isAuditStepSchema } from './audit-steps.schema';
import { Either, ParseResult, Schema } from 'effect';

describe('AuditStepSchema', () => {
  it('should reject invalid step in array', () => {
    const auditSteps = [
      { type: 'startNavigation' },
      { type: 'navigate', url: 'https://appspeed.dev' },
      { type: 'WOLOLO' },
    ];
    expect(isAuditStepSchema(auditSteps)).toEqual(false);

    const result = decode(auditSteps);
    expect(Either.isLeft(result)).toEqual(true);
    if (Either.isLeft(result)) {
      expect(ParseResult.TreeFormatter.formatErrorSync(result.left)).toContain('WOLOLO');
    }
  });

  it('should reject empty steps array', () => {
    expect(isAuditStepSchema([])).toEqual(false);
  });

  it('should accept valid steps', () => {
    const auditSteps = [{ type: 'navigate', url: 'https://appspeed.dev' }, { type: 'snapshot' }];
    expect(isAuditStepSchema(auditSteps)).toEqual(true);
  });

  it('should accept snapshot-only steps', () => {
    const auditSteps = [{ type: 'snapshot' }];
    expect(isAuditStepSchema(auditSteps)).toEqual(true);
  });
  const decode = Schema.decodeUnknownEither(AuditStepsSchema);
});
